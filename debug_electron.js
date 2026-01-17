// Debug script to check electron module
console.log('Checking electron module...');
console.log('process.type:', process.type);
console.log('process.versions.electron:', process.versions.electron);
console.log('process.argv:', process.argv);
console.log('__dirname:', __dirname);
console.log('module.paths:', module.paths);

// Check if we're in main process
if (process.type === 'browser') {
    console.log('Running in MAIN (browser) process');
} else if (process.type === 'renderer') {
    console.log('Running in RENDERER process');
} else if (process.type === 'worker') {
    console.log('Running in WORKER process');
} else {
    console.log('process.type is:', process.type, '- NOT in proper Electron process');
}

try {
    const electron = require('electron');
    console.log('electron type:', typeof electron);
    if (typeof electron === 'string') {
        console.log('ERROR: require("electron") returned a string (path):', electron);
        console.log('This means Electron is not properly initialized as main process');
    } else if (electron.app) {
        console.log('SUCCESS: electron.app is defined');
        console.log('app.getName():', electron.app.getName());
    }
} catch (e) {
    console.log('Error loading electron:', e.message);
}
