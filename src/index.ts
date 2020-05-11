import { app, BrowserWindow, ipcMain } from 'electron';
import {join} from 'path';
declare const MAIN_WINDOW_WEBPACK_ENTRY: any;
import {version} from '../package.json';
import axios from 'axios';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1000,
    minWidth: 850,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: true
    },
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

async function checkForUpdate(){

}

ipcMain.on('check-for-update', async (event, args) => {
  console.log("CHECK FOR UPDATAE!");
  const response = await axios.get('https://raw.githubusercontent.com/MaxvandeLaar/homey-community-store/master/package.json').catch(console.error);
  console.log('APP VERSION LOCAL', version);
  if (!response || response.status !== 200) {
    return;
  }
  const remotePackage = response.data;
  if (version !== remotePackage.version) {
    event.reply('check-for-update-completed', true);
  } else {
    console.log('Running latest version');
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') {
    app.quit();
  // }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
