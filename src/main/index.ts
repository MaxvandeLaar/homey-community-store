'use strict'

import {app, BrowserWindow} from 'electron'
import * as path from 'path'
import {format as formatUrl} from 'url'
import './utils/auth';
import './utils/apps';
import './utils/install';
import { autoUpdater } from "electron-updater";
import log from 'electron-log';

autoUpdater.logger = log;

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null

autoUpdater.on('checking-for-update', () => {
  log.debug('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  log.debug('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  log.debug('Update not available.');
})
autoUpdater.on('error', (err) => {
  log.debug('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.debug(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  log.debug('Update downloaded');
  autoUpdater.quitAndInstall();
});

function createMainWindow() {
  const window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false
    },
    minWidth: 900,
    minHeight: 500,
    width: 1050,
    height: 800
  });

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  } else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();
  autoUpdater.checkForUpdatesAndNotify();
})
