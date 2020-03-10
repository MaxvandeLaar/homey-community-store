import {ipcMain, BrowserWindow, app} from 'electron';
import {download} from 'electron-dl';
import  {App} from 'homey';
import {exec} from 'child_process';

const request = require('request');
import {Open} from "unzipper";


ipcMain.on('download-zip', async (event, args) => {
  const directory = await Open.url(request, args.url);
  event.reply('download-progress', 'downloaded');
  const tmp = await directory.extract({path: `${app.getAppPath()}/tmp/`});
  event.reply('download-progress', 'unzipped');

  exec( `${app.getAppPath()}/node_modules/.bin/homey app install`,
  // exec( `pwd`,
    {
      cwd: `${app.getAppPath()}/tmp/webos-plus-v1.1.0/`
    },
    function (error, stdout, stderr) {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });

  event.reply('download-complete', 'done');
});
