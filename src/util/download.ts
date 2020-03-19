import {ipcMain, app} from 'electron';
import {fetch, extract} from "gitly";
import {existsSync} from "fs";
import {dirname} from 'path'
const AthomApp = require('homey').App;
const log = require('electron-log');
import {execute} from "./shell";
const fixPath = require('fix-path');

fixPath();

const totalSteps = 4;

function escape(path: string) {
  return path;
  // return path.replace(/\s/g, '\\ ');
}

ipcMain.on('install', async (event, {repo, homeyApp}) => {
  log.info('Start download', repo);
  event.reply('installation-progress', {app: homeyApp, progress: {step: 1, totalSteps, message: `Start downloading ${homeyApp.name.en}`}});

  const source = await fetch(repo, {
    temp: `${escape(app.getAppPath())}/tmp/`
  }).catch((error) => event.reply(`installation-finished-${homeyApp.id}`, {error, app: homeyApp}));

  if (!source){
    return
  }
  event.reply('installation-progress', {app: homeyApp, progress: {step: 1, totalSteps, message: `Completed downloading ${homeyApp.name.en}`}});

  log.info('Finished download', repo);
  const repoDir = escape(`${dirname(source)}/repo`);
  const packageJson = escape(`${repoDir}/package.json`);
  const nodeModules = escape(`${repoDir}/node_modules`);

  log.info('Start extracting', repo);
  event.reply('installation-progress', {app: homeyApp, progress: {step: 2, totalSteps, message: `Start extracting ${homeyApp.name.en}`}});
  await extract(source, repoDir);
  log.info('Finished extracting', repo);
  event.reply('installation-progress', {app: homeyApp, progress: {step: 2, totalSteps, message: `Finished extracting ${homeyApp.name.en}`}});

  event.reply(`installation-progress`, {app: homeyApp, progress: {step: 3, totalSteps, message: `Start installation preparations ${homeyApp.name.en}`}});

  if (existsSync(packageJson) && !existsSync(nodeModules)) {
    log.info('Run npm install', repo);
    const {stdout, stderr} = await execute(`${escape(app.getAppPath())}/node_modules/npm/bin/npm-cli.js install --prod`, {cwd: repoDir}).catch(console.error);
    if (stderr) {
      console.error(stderr);
      return event.reply(`installation-finished-${homeyApp.id}`, {error: stderr, app: homeyApp});
    }
    log.info(`stdout: ${stdout}`);
    log.info('Finished npm install', repo);
  }
  event.reply('installation-progress', {app: homeyApp, progress: {step: 3, totalSteps, message: `Finished installation preparations ${homeyApp.name.en}`}});

  log.info('Start Homey install', repo);
  event.reply(`installation-progress`, {app: homeyApp, progress: {step: 4, totalSteps, message: `Start installation ${homeyApp.name.en}`}});

  try {
    const {stdout, stderr} = await execute(`${escape(app.getAppPath()).replace(/\s/g, '\\ ')}/node_modules/.bin/homey app install`, {cwd: repoDir});
    if (stderr) {
      console.error(stderr);
      return event.reply(`installation-finished-${homeyApp.id}`, {error: stderr, app: homeyApp});
    }
  } catch(error) {
    return event.reply(`installation-finished-${homeyApp.id}`, {error, app: homeyApp});
  }

  event.reply('installation-progress', {app: homeyApp, progress: {step: 4, totalSteps, message: `Finished installation ${homeyApp.name.en}`}});
  event.reply(`installation-finished-${homeyApp.id}`, {app: homeyApp});
});
