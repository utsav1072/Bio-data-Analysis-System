const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let djangoProcess;

function getResourcePath(relativePath) {
    const resourcePath = isDev
        ? path.join(__dirname, '..', relativePath)
        : path.join(process.resourcesPath, relativePath);
    console.log(`Resource path for ${relativePath}:`, resourcePath);
    return resourcePath;
}

function findIndexHtml() {
    const frontendPath = getResourcePath('frontend');
    console.log('Searching for index.html in:', frontendPath);

    const rootIndexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(rootIndexPath)) {
        console.log('Found index.html in root:', rootIndexPath);
        return rootIndexPath;
    }

    const assetsIndexPath = path.join(frontendPath, 'assets', 'index.html');
    if (fs.existsSync(assetsIndexPath)) {
        console.log('Found index.html in assets:', assetsIndexPath);
        return assetsIndexPath;
    }

    throw new Error('Could not find index.html in frontend build');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        try {
            const indexHtmlPath = findIndexHtml();
            console.log('Loading frontend from:', indexHtmlPath);
            mainWindow.loadFile(indexHtmlPath).catch(err => {
                console.error('Failed to load frontend:', err);
            });
        } catch (err) {
            console.error('Error finding index.html:', err);
        }
    }

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('Failed to load:', errorCode, errorDescription);
    });
}

function startDjangoServer() {
    let spawnOptions;
    let spawnArgs;
    let spawnCmd;

    if (isDev) {
        const pythonPath = path.join(getResourcePath('venv/Scripts/python.exe'));
        const managePath = path.join(getResourcePath('backend/manage.py'));
        console.log('Starting Django server in DEV mode:');
        console.log('Python path:', pythonPath);
        console.log('Manage.py path:', managePath);

        spawnCmd = pythonPath;
        spawnArgs = [managePath, 'runserver', '--noreload'];
        spawnOptions = {
            cwd: path.join(getResourcePath('backend')),
            stdio: 'pipe',
            windowsHide: true
        };
    } else {
        const djangoExe = path.join(process.resourcesPath, 'backend', 'biodata_backend.exe');
        console.log('Starting Django server in PROD mode:', djangoExe);

        // Log output to file for debugging double-click issues
        const outLog = fs.openSync(path.join(process.resourcesPath, 'backend', 'backend-out.log'), 'a');
        const errLog = fs.openSync(path.join(process.resourcesPath, 'backend', 'backend-err.log'), 'a');

        spawnCmd = djangoExe;
        spawnArgs = ['runserver', '--noreload'];
        spawnOptions = {
            cwd: path.join(process.resourcesPath, 'backend'),
            stdio: ['ignore', outLog, errLog],
            windowsHide: true,
            env: {
                ...process.env,
                DJANGO_SETTINGS_MODULE: 'backend.settings', // set if needed
            }
        };
    }

    djangoProcess = spawn(spawnCmd, spawnArgs, spawnOptions);

    // In dev, log to Electron console
    if (isDev) {
        djangoProcess.stdout && djangoProcess.stdout.on('data', data => console.log(`stdout: ${data}`));
        djangoProcess.stderr && djangoProcess.stderr.on('data', data => console.error(`stderr: ${data}`));
    }

    djangoProcess.on('error', (err) => {
        console.error('Failed to start Django server:', err);
    });

    djangoProcess.on('exit', (code, signal) => {
        console.log(`Django server exited with code ${code} and signal ${signal}`);
    });
}

app.whenReady().then(() => {
    console.log('App is ready');
    console.log('App path:', app.getAppPath());
    console.log('Resource path:', process.resourcesPath);

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
