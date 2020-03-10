/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import {ipcRenderer} from 'electron';

console.log('👋 This message is being logged by "renderer.js", included via webpack');

document.querySelector('#download').addEventListener('click', () => {
  // alert('download');
  ipcRenderer.send('download-zip', {options: {}, url: 'https://github.com/MaxvandeLaar/homey-webos-plus/releases/download/v1.1.0/webos-plus-v1.1.0.zip'});

});

ipcRenderer.on('download-complete', (event, arg) => {
  console.log(arg) // prints "pong"
});

ipcRenderer.on('download-progress', (event, arg) => {
  console.log(arg) // prints "pong"
});


