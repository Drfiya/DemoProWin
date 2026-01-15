const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

let paletteWindow
let overlayWindows = []
let lastActiveOverlay = null

function createWindows() {
    const displays = screen.getAllDisplays()

    displays.forEach((display) => {
        const overlay = new BrowserWindow({
            x: display.bounds.x,
            y: display.bounds.y,
            width: display.bounds.width,
            height: display.bounds.height,
            transparent: true,
            frame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            hasShadow: false,
            enableLargerThanScreen: true,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                contextIsolation: true,
                backgroundThrottling: false
            }
        })

        overlay.setIgnoreMouseEvents(true, { forward: true })
        overlay.loadFile('overlay/index.html')
        overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

        // Ensure it stays on top of normal windows but BELOW the palette
        overlay.setAlwaysOnTop(true, 'floating')

        overlayWindows.push(overlay)

        overlay.webContents.on('before-input-event', handleInput)
    })

    // Create Palette Window
    const primaryDisplay = screen.getPrimaryDisplay()
    paletteWindow = new BrowserWindow({
        width: 70,
        height: 700,
        x: primaryDisplay.bounds.x + 20,
        y: primaryDisplay.bounds.y + 100,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        skipTaskbar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true
        }
    })

    paletteWindow.loadFile('palette/index.html')
    paletteWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    paletteWindow.setAlwaysOnTop(true, 'screen-saver') // Much higher than 'floating'

    paletteWindow.webContents.on('before-input-event', handleInput)
}

function handleInput(event, input) {
    if (input.type === 'keyDown' && input.key === 'Escape') {
        overlayWindows.forEach(win => win.webContents.send('clear'))
        setTool('cursor')
    }
}

app.whenReady().then(() => {
    createWindows()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindows()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// IPC Handler
// IPC Handler
// Helper to set tool from either IPC or Main logic
function setTool(tool) {
    if (tool === 'cursor') {
        overlayWindows.forEach(win => win.setIgnoreMouseEvents(true, { forward: true }))
    } else {
        overlayWindows.forEach(win => win.setIgnoreMouseEvents(false))
    }

    overlayWindows.forEach(win => win.webContents.send('tool-change', tool))

    if (paletteWindow) {
        paletteWindow.webContents.send('tool-change', tool)
    }
}

ipcMain.on('tool-change', (event, tool) => {
    setTool(tool)
})

ipcMain.on('color-change', (event, color) => {
    overlayWindows.forEach(win => win.webContents.send('color-change', color))
})

ipcMain.on('stroke-added', (event) => {
    lastActiveOverlay = event.sender
})

ipcMain.on('action', (event, action) => {
    if (action === 'quit') app.quit()
    if (action === 'undo' || action === 'redo') {
        if (lastActiveOverlay) {
            lastActiveOverlay.send(action)
        } else {
            // Fallback: send to all if we don't know who's active
            overlayWindows.forEach(win => win.webContents.send(action))
        }
    }
    if (action === 'clear') {
        overlayWindows.forEach(win => win.webContents.send('clear'))
    }
})

