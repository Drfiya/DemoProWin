const tools = ['cursor', 'pen', 'arrow', 'rect', 'circle'];

tools.forEach(tool => {
    document.getElementById(tool).addEventListener('click', () => {
        setActiveTool(tool);
    });
});

document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const color = e.target.dataset.color;
        setActiveColor(e.target, color);
    });
});

document.getElementById('undo').addEventListener('click', () => {
    window.electronAPI.sendMessage('action', 'undo');
});

document.getElementById('redo').addEventListener('click', () => {
    window.electronAPI.sendMessage('action', 'redo');
});

document.getElementById('clear').addEventListener('click', () => {
    // Add simple animation
    const btn = document.getElementById('clear');
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => btn.style.transform = '', 100);

    window.electronAPI.sendMessage('action', 'clear');
});

document.getElementById('quit').addEventListener('click', () => {
    window.electronAPI.sendMessage('action', 'quit');
});

function setActiveTool(toolId) {
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(toolId).classList.add('active');
    window.electronAPI.sendMessage('tool-change', toolId);
}

function setActiveColor(targetBtn, color) {
    document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('active'));
    targetBtn.classList.add('active');
    window.electronAPI.sendMessage('color-change', color);
}

// Listen for tool changes from Main Process (e.g. Escape key)
window.electronAPI.onMessage('tool-change', (toolId) => {
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(toolId).classList.add('active');
});
