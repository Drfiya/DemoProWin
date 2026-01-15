const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let currentTool = 'cursor';
let isDrawing = false;
let startX = 0;
let startY = 0;
let savedImageData = null;

// Dynamic resize
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Save current content if any
    let tempCanvas = null;
    if (canvas.width > 0 && canvas.height > 0) {
        tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
    }

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Restore Config after resize
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;

    // Restore content
    if (tempCanvas) {
        ctx.drawImage(tempCanvas, 0, 0, width, height);
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Drawing Config
// Initial defaults - will be updated by IPC/resize
ctx.lineCap = 'round';
ctx.lineJoin = 'round';
ctx.lineWidth = 4;
ctx.strokeStyle = '#ef4444';

// History
let history = [];
let historyIndex = -1;

function saveState() {
    historyIndex++;
    if (historyIndex < history.length) {
        history.length = historyIndex;
    }
    const stateCanvas = document.createElement('canvas');
    stateCanvas.width = canvas.width;
    stateCanvas.height = canvas.height;
    stateCanvas.getContext('2d').drawImage(canvas, 0, 0);
    history.push(stateCanvas);
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const dpr = window.devicePixelRatio || 1;
        ctx.drawImage(history[historyIndex], 0, 0, canvas.width / dpr, canvas.height / dpr);
    }
});

window.electronAPI.onMessage('redo', () => {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const dpr = window.devicePixelRatio || 1;
        ctx.drawImage(history[historyIndex], 0, 0, canvas.width / dpr, canvas.height / dpr);
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

    // Save current state for shapes preview
    savedImageData = document.createElement('canvas');
    savedImageData.width = canvas.width;
    savedImageData.height = canvas.height;
    savedImageData.getContext('2d').drawImage(canvas, 0, 0);

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

    const dpr = window.devicePixelRatio || 1;
    if (currentTool === 'pen') {
        ctx.lineTo(x, y);
        ctx.stroke();
    } else if (currentTool === 'rect') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(savedImageData, 0, 0, canvas.width / dpr, canvas.height / dpr);
        ctx.strokeRect(startX, startY, x - startX, y - startY);
    } else if (currentTool === 'arrow') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(savedImageData, 0, 0, canvas.width / dpr, canvas.height / dpr);
        drawArrow(startX, startY, x, y);
    } else if (currentTool === 'circle') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(savedImageData, 0, 0, canvas.width / dpr, canvas.height / dpr);
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
    window.electronAPI.sendMessage('stroke-added');
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
