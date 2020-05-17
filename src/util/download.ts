import {ipcMain, app} from 'electron';
import {fetch, extract} from "gitly";
import {existsSync} from "fs";
import {dirname, sep} from 'path'
import {AppInfo} from "../interfaces/App";

const AthomApp = require('homey').App;
const log = require('electron-log');

const fixPath = require('fix-path');
const slash = require('slash');
import {escape} from "./file";
import { npmInstall } from './npm';

fixPath();

const totalSteps = 4;

ipcMain.on('install', async (event, {repo, homeyApp}: {repo: string, homeyApp: AppInfo}) => {
  const appName = homeyApp.name.en;
  const appId = homeyApp.id;
  log.info('Start installation app', appId);
  log.debug('Start installation app', repo, homeyApp);
  let host = 'github';
  if (repo.includes('bitbucket.org')) {
    host = 'bitbucket';
  }
  log.info('Start download', repo, host);
  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 1, totalSteps, message: `Start downloading ${appName}`}
  });

  const source = await fetch(repo, {
    host,
    temp: `${escape(app.getAppPath())}${sep}tmp${sep}`
  }).catch((error) => {
    log.error(error);
    event.reply(`installation-finished-${homeyApp.id}`, {error, app: homeyApp})
  });

  if (!source) {
    return
  }
  log.info('Download completed', appId);
  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 1, totalSteps, message: `Completed downloading ${appName}`}
  });

  log.info('Finished download', appId);
  const repoDir = escape(`${dirname(source)}${sep}repo`);
  const packageJson = escape(`${repoDir}${sep}package.json`);
  const nodeModules = escape(`${repoDir}${sep}node_modules`);
  log.debug('App file paths:',  appId, {
    repoDir,
    packageJson,
    nodeModules
  });

  log.info('Start extracting', appId);
  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 2, totalSteps, message: `Start extracting ${homeyApp.name.en}`}
  });
  await extract(source, repoDir);
  log.info('Finished extracting', appId);
  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 2, totalSteps, message: `Finished extracting ${homeyApp.name.en}`}
  });

  event.reply(`installation-progress`, {
    app: homeyApp,
    progress: {step: 3, totalSteps, message: `Start installation preparations ${homeyApp.name.en}`}
  });

  if (existsSync(packageJson) && !existsSync(nodeModules)) {
    log.info('Run npm install', appId);
    try {
      await npmInstall(repoDir);
    } catch (error) {
      log.error(appId, error)
      return event.reply(`installation-finished-${homeyApp.id}`, {error, app: homeyApp});
    }
    log.info('Finished npm install', appId);
  }
  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 3, totalSteps, message: `Finished installation preparations ${homeyApp.name.en}`}
  });

  log.info('Start Homey install', appId);
  event.reply(`installation-progress`, {
    app: homeyApp,
    progress: {step: 4, totalSteps, message: `Start installation ${homeyApp.name.en}`}
  });

  try {
    log.debug('Init AthomApp Api', appId);
    const appAPI = new AthomApp(repoDir);
    appAPI.path = slash(appAPI.path);
    appAPI._app._path = slash(appAPI._app._path);
    appAPI._appJsonPath = slash(appAPI._appJsonPath);
    appAPI._pluginsPath = slash(appAPI._pluginsPath);
    appAPI._homeyComposePath = slash(appAPI._homeyComposePath);
    const result = await appAPI.install();
    if (Object.keys(result).length > 0){
      log.info('Installation complete', appId, result);
    } else {
      log.error('Installation failed due to unknown error', appId, result);
      return event.reply(`installation-finished-${homeyApp.id}`, {error: 'Installation failed due to an unknown error', app: homeyApp});
    }
  } catch (error) {
    log.log(error);
    return event.reply(`installation-finished-${homeyApp.id}`, {error, app: homeyApp});
  }

  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 4, totalSteps, message: `Finished installation ${homeyApp.name.en}`}
  });
  event.reply(`installation-finished-${homeyApp.id}`, {app: homeyApp});
});



