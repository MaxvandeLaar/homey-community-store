import {ipcMain, app} from 'electron';
import {fetch, extract} from "gitly";
import {existsSync} from "fs";
import {dirname} from 'path'
const AthomApp = require('homey/lib/App');

import {execute} from "../util/shell";

ipcMain.on('install', async(event, {repo, homeyApp}) => {
  const source = await fetch(repo, {
    temp: `${app.getAppPath()}/tmp/`
  }).catch((error) => event.reply('installation-failed', {error}));

  if (!source){
    return
  }
  const repoDir = `${dirname(source)}/repo`;
  const packageJson = `${repoDir}/package.json`;

  await extract(source, repoDir);

  if (existsSync(packageJson)) {
    const {stdout, stderr} = await execute(`${app.getAppPath()}/node_modules/npm/bin/npm-cli.js install --prod`, {cwd: repoDir}).catch(console.error);
    if (stderr) {
      console.error(stderr);
      return event.reply('installation-failed', {error: stderr});
    }
    // console.log(`stdout: ${stdout}`);
  }

  const athomApp = new AthomApp(repoDir);
  await athomApp.install();
  event.reply('installation-finished', {app: homeyApp});
});
