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
  let host = 'github';
  if (repo.includes('bitbucket.org')) {
    host = 'bitbucket';
  }
  log.info('Start download', repo);
  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 1, totalSteps, message: `Start downloading ${homeyApp.name.en}`}
  });

  const source = await fetch(repo, {
    host,
    temp: `${escape(app.getAppPath())}${sep}tmp${sep}`
  }).catch((error) => event.reply(`installation-finished-${homeyApp.id}`, {error, app: homeyApp}));

  if (!source) {
    return
  }
  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 1, totalSteps, message: `Completed downloading ${homeyApp.name.en}`}
  });

  log.info('Finished download', repo);
  const repoDir = escape(`${dirname(source)}${sep}repo`);
  const packageJson = escape(`${repoDir}${sep}package.json`);
  const nodeModules = escape(`${repoDir}${sep}node_modules`);
  log.info('Locations:',  {
    repoDir,
    packageJson,
    nodeModules
  });

  log.info('Start extracting', repo);
  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 2, totalSteps, message: `Start extracting ${homeyApp.name.en}`}
  });
  await extract(source, repoDir);
  log.info('Finished extracting', repo);
  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 2, totalSteps, message: `Finished extracting ${homeyApp.name.en}`}
  });

  event.reply(`installation-progress`, {
    app: homeyApp,
    progress: {step: 3, totalSteps, message: `Start installation preparations ${homeyApp.name.en}`}
  });

  if (existsSync(packageJson) && !existsSync(nodeModules)) {
    log.info('Run npm install', repo);

    try {
      await npmInstall(repoDir);
    } catch (error) {
      return event.reply(`installation-finished-${homeyApp.id}`, {error, app: homeyApp});
    }
    log.info('Finished npm install', repo);
  }
  event.reply('installation-progress', {
    app: homeyApp,
    progress: {step: 3, totalSteps, message: `Finished installation preparations ${homeyApp.name.en}`}
  });

  log.info('Start Homey install', repo);
  event.reply(`installation-progress`, {
    app: homeyApp,
    progress: {step: 4, totalSteps, message: `Start installation ${homeyApp.name.en}`}
  });

  try {
    const appAPI = new AthomApp(repoDir);
    appAPI.path = slash(appAPI.path);
    appAPI._app._path = slash(appAPI._app._path);
    appAPI._appJsonPath = slash(appAPI._appJsonPath);
    appAPI._pluginsPath = slash(appAPI._pluginsPath);
    appAPI._homeyComposePath = slash(appAPI._homeyComposePath);

    log.debug('APP API', appAPI);
    const result = await appAPI.install();
    log.info('install result', result);
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



