import {ipcMain, app} from 'electron';
import {fetch, extract} from "gitly";
import {existsSync} from "fs";
import {dirname} from 'path'
const AthomApp = require('homey/lib/App');

import {execute} from "../util/shell";

ipcMain.on('install', async(event, {repo, homeyApp}) => {
  console.log('Start download', repo);
  const source = await fetch(repo, {
    temp: `${app.getAppPath()}/tmp/`
  }).catch((error) => event.reply('installation-failed', {error}));

  if (!source){
    return
  }
  console.log('Finished download', repo);
  const repoDir = `${dirname(source)}/repo`;
  const packageJson = `${repoDir}/package.json`;
  const nodeModules = `${repoDir}/node_modules`;
  console.log('Start extracting', repo);
  await extract(source, repoDir);
  console.log('Finished extracting', repo);

  if (existsSync(packageJson) && !existsSync(nodeModules)) {
    console.log('Run npm install', repo);
    const {stdout, stderr} = await execute(`${app.getAppPath()}/node_modules/npm/bin/npm-cli.js install --prod`, {cwd: repoDir}).catch(console.error);
    if (stderr) {
      console.error(stderr);
      return event.reply('installation-failed', {error: stderr});
    }
    console.log(`stdout: ${stdout}`);
    console.log('Finished npm install', repo);
  }

  console.log('Start Homey install', repo);
  const {stdout, stderr} = await execute(`${app.getAppPath()}/node_modules/.bin/homey app install`, {cwd: repoDir});
  if (stderr) {
    console.error(stderr);
    return event.reply('installation-failed', {error: stderr});
  }
  console.log(`stdout: ${stdout}`);
  event.reply('installation-finished', {app: homeyApp});
});
