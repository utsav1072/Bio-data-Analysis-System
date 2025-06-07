const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let djangoProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Load the React app
    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../bio-data-analysis-fe/dist/index.html'));
    }
}

function startDjangoServer() {
    const pythonPath = path.join(__dirname, '../venv/Scripts/python');
    const managePath = path.join(__dirname, '../backend/manage.py');
    
    djangoProcess = spawn(pythonPath, [managePath, 'runserver'], {
        stdio: 'inherit'
    });

    djangoProcess.on('error', (err) => {
        console.error('Failed to start Django server:', err);
    });
}

app.whenReady().then(() => {
    startDjangoServer();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        if (djangoProcess) {
            djangoProcess.kill();
        }
        app.quit();
    }
});

app.on('before-quit', () => {
    if (djangoProcess) {
        djangoProcess.kill();
    }
}); 