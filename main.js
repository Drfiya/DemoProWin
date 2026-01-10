const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

let paletteWindow
let overlayWindow

function createWindows() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    // Create Overlay Window (Fullscreen, Transparent)
    // We use 'screen-saver' level for overlay ensuring it is very high, but we will put palette higher if possible or same.
    // Actually, standard 'floating' or 'pop-up-menu' might be better for palette.

    overlayWindow = new BrowserWindow({
        fullscreen: true,
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

    // Set overlay to be click-through initially
    overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    overlayWindow.loadFile('overlay/index.html')

    // Move to top level explicitly
    overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

    // Create Palette Window
    paletteWindow = new BrowserWindow({
        width: 70, // Slight bit wider for comfort
        height: 700,
        x: 20,
        y: 100,
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

    // Ensure palette stays on top of overlay
    paletteWindow.setAlwaysOnTop(true, 'screen-saver')
    // Note: on Windows, 'screen-saver' is one of the highest.

    // Handle Keyboard Shortcuts (Esc to Clear + Switch to Cursor)
    const handleInput = (event, input) => {
        if (input.type === 'keyDown' && input.key === 'Escape') {
            if (overlayWindow) overlayWindow.webContents.send('clear')
            setTool('cursor')
        }
    }

    paletteWindow.webContents.on('before-input-event', handleInput)
    overlayWindow.webContents.on('before-input-event', handleInput)
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
    if (!overlayWindow) return

    if (tool === 'cursor') {
        // Pass clicks through
        overlayWindow.setIgnoreMouseEvents(true, { forward: true })
    } else {
        // Capture clicks for drawing
        overlayWindow.setIgnoreMouseEvents(false)
    }

    // Inform overlay of tool change
    overlayWindow.webContents.send('tool-change', tool)

    // Inform palette of tool change (to update UI)
    if (paletteWindow) {
        paletteWindow.webContents.send('tool-change', tool)
    }
}

ipcMain.on('tool-change', (event, tool) => {
    setTool(tool)
})

ipcMain.on('color-change', (event, color) => {
    if (!overlayWindow) return
    overlayWindow.webContents.send('color-change', color)
})

ipcMain.on('action', (event, action) => {
    if (action === 'quit') app.quit()
    if (action === 'undo' || action === 'redo') {
        if (overlayWindow) overlayWindow.webContents.send(action)
    }
    if (action === 'clear') {
        if (overlayWindow) {
            overlayWindow.webContents.send('clear')
        }
    }
})

