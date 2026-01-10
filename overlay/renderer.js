const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let currentTool = 'cursor';
let isDrawing = false;
let startX = 0;
let startY = 0;
let savedImageData = null;

// Dynamic resize
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Note: resizing clears canvas. In a persistent app, we'd restore image data.
    // For now, let's assume screen size doesn't change mid-draw frequently.
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Drawing Config
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.lineWidth = 4;
ctx.strokeStyle = '#ef4444'; // default red

// History
let history = [];
let historyIndex = -1;

function saveState() {
    historyIndex++;
    if (historyIndex < history.length) {
        history.length = historyIndex; // Remove future history if we diverge
    }
    history.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
}

// IPC Listeners
window.electronAPI.onMessage('tool-change', (tool) => {
    currentTool = tool;
    if (tool === 'cursor') {
        canvas.style.cursor = 'default';
        canvas.style.pointerEvents = 'none'; // Further ensure click-through
    } else {
        canvas.style.cursor = 'crosshair';
        canvas.style.pointerEvents = 'auto';
    }
});

window.electronAPI.onMessage('color-change', (color) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color; // For any potential fills, though we assume stroke mostly
});

window.electronAPI.onMessage('clear', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState(); // Clearing is a state change
});

window.electronAPI.onMessage('undo', () => {
    if (historyIndex > 0) {
        historyIndex--;
        ctx.putImageData(history[historyIndex], 0, 0);
    }
});

window.electronAPI.onMessage('redo', () => {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        ctx.putImageData(history[historyIndex], 0, 0);
    }
});

// Event Handlers
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

// Init History
saveState(); // Save blank state

function startDrawing(e) {
    if (currentTool === 'cursor') return;

    isDrawing = true;
    startX = e.offsetX;
    startY = e.offsetY;

    // Save state for shapes preview (this is distinct from history stack)
    // We actually just want to capture the CURRENT canvas state before we draw on top of it for preview
    savedImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // For pen, start immediately
    if (currentTool === 'pen') {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    }
}

function draw(e) {
    if (!isDrawing) return;
    if (currentTool === 'cursor') return;

    const x = e.offsetX;
    const y = e.offsetY;

    if (currentTool === 'pen') {
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (currentTool === 'rect') {
        // Restore then Draw
        ctx.putImageData(savedImageData, 0, 0);
        ctx.strokeRect(startX, startY, x - startX, y - startY);
    } else if (currentTool === 'arrow') {
        ctx.putImageData(savedImageData, 0, 0);
        drawArrow(startX, startY, x, y);
    } else if (currentTool === 'circle') {
        ctx.putImageData(savedImageData, 0, 0);
        const radius = Math.sqrt(Math.pow(x - startX, 2) + Math.pow(y - startY, 2));
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    if (currentTool === 'pen') {
        ctx.closePath();
    }
    // Save state to history after drawing completes
    saveState();
}

function drawArrow(fromX, fromY, toX, toY) {
    const headLength = 15; // length of head in pixels
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);

    // Arrow head
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));

    ctx.stroke();
}
