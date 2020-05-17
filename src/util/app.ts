// import repos from '../assets/apps.json';
import axios from 'axios';
import {ipcMain} from 'electron';

const log = require('electron-log');
import {AppInfo} from "../interfaces/App";

let repos: { [key: string]: any } = null;

async function init() {
  log.info('Retrieve app repos');
  const response = await axios.get('https://raw.githubusercontent.com/MaxvandeLaar/homey-community-store/master/src/assets/apps.json').catch(log.error);
  if (!response || response.status !== 200) {
    log.error(response ? response.statusText : response);
    return;
  }
  repos = response.data;
  log.info('Retrieving app repos completed');
  log.debug('App repos', repos);
}

init();


export async function getApps(): Promise<AppInfo[]> {
  log.info('Getting all apps');
  const appList: AppInfo[] = [];

  if (!repos) {
    await init();
  }

  const keys = Object.keys(repos);
  log.debug('Loop through all repos', keys);
  const promises = keys.map(async (key) => {
    log.debug('Start processing', key);
    let url: string = (repos as { [key: string]: any; })[key].repo;
    log.debug('Url', key, url);

    let rawUrl = url;

    if (url.includes('github.com')) {
      if (!url.includes('#')) {
        url = `${url}#master`;
      }
      rawUrl = url.replace('#', '/raw/');
    }

    if (url.includes('bitbucket.org')) {
      if (!url.includes('/src/')) {
        rawUrl = url.endsWith('/') ? url : `${url}/`;
        rawUrl = `${rawUrl}src/master`;
      }
      rawUrl = rawUrl.replace('/src/', '/raw/');
    }

    log.debug('Raw url', key, rawUrl);

    const appJsonUrl = `${rawUrl}/app.json`;
    log.debug('Get App info', key, appJsonUrl);
    const response: any = await axios.get(appJsonUrl).catch((e) => {
      return key
    });
    if (!response || response.status !== 200) {
      log.error(response ? response.statusText : response);
      return key;
    }
    let appInfo: AppInfo = response.data;
    if (typeof response.data !== 'object') {
      appInfo = null;
      try {
        appInfo = JSON.parse(response.data);
      } catch (e) {
        log.error(e);
        return key;
      }
    }
    log.debug('App info', key, appInfo);

    log.debug('Get app icon', key);
    const iconResponse: any = await axios.get(`${rawUrl}/assets/icon.svg`).catch(log.error);
    if (!iconResponse || iconResponse.status !== 200) {
      log.error(iconResponse ? iconResponse.statusText : iconResponse);
      return key;
    } else {
      appInfo.icon = iconResponse.data;
    }

    log.debug('Get small app image if exists', key, appInfo.images?.small);
    if (appInfo.images?.small) {
      appInfo.images.small = `${rawUrl}/${appInfo.images.small.substr(0, 1) === '.' ? appInfo.images.small.substr(1) : appInfo.images.small}`
      const smallImageResponse = await axios.head(appInfo.images.small).catch((e) => {
        log.error(e);
      });
      if (!smallImageResponse || smallImageResponse.status !== 200) {
        appInfo.images.small = null;
      }
    }

    log.debug('Get large app image if exists', key, appInfo.images?.large);
    if (appInfo.images?.large) {
      appInfo.images.large = `${rawUrl}/${appInfo.images.large.substr(0, 1) === '.' ? appInfo.images.large.substr(1) : appInfo.images.large}`
      const largeImageResponse = await axios.head(appInfo.images.large).catch((e) => {
      });
      if (!largeImageResponse || largeImageResponse.status !== 200) {
        appInfo.images.large = null;
      }
    }
    log.debug('Set app description/repo/categories', key);
    if (typeof appInfo.description !== 'object') {
      appInfo.description = {en: appInfo.description};
    }
    appInfo.repo = url;

    if (!appInfo.category || appInfo.category.length === 0) {
      appInfo.category = ['general'];
    }
    if (typeof appInfo.category === 'string') {
      appInfo.category = [appInfo.category];
    }

    log.debug('Get app README', key);
    const readMeResponseTxt = await axios.get(`${rawUrl}/README.txt`).catch(e => {
    });
    if (readMeResponseTxt && readMeResponseTxt.status === 200) {
      appInfo.readMe = readMeResponseTxt.data;
    }

    const readMeResponse = await axios.get(`${rawUrl}/README.md`).catch(e => {
    });
    if (readMeResponse && readMeResponse.status === 200) {
      appInfo.readMe = readMeResponse.data;
    }

    log.debug('Loop through pp drives if any exist', key, appInfo.drivers);
    if (appInfo.drivers) {
      appInfo.drivers.forEach((driver) => {
        log.debug('Set driver images (small/large)', key, driver);
        driver.images.small = `${rawUrl}/${driver.images.small.substr(0, 1) === '.' ? driver.images.small.substr(1) : driver.images.small}`
        driver.images.large = `${rawUrl}/${driver.images.large.substr(0, 1) === '.' ? driver.images.large.substr(1) : driver.images.large}`
      });
    }
    log.debug('Push app info into array', key, appInfo);
    appList.push(appInfo);
    log.debug('Finished processing', key);
    return key;
  });

  await Promise.all(promises).catch(log.error);

  log.debug('Sort app list alphabetically');
  appList.sort((a: AppInfo, b: AppInfo) => {
    const nameA = a.name.en.toLowerCase();
    const nameB = b.name.en.toLowerCase();
    return nameA > nameB ? 1 : nameA < nameB ? -1 : 0;
  });
  log.debug('App list', appList);
  log.info('Getting apps completed');
  return appList;
}

ipcMain.on('retrieve-apps', async (event, args) => {
  log.info('Retrieve apps');
  const apps = await getApps();
  log.info('Divide apps in categories');
  const categories: string[] = [];
  apps.forEach(app => {
    app.category.forEach(cat => {
      if (!categories.includes(cat.toLowerCase())) {
        categories.push(cat.toLowerCase());
      }
    });
  });
  categories.sort();
  log.debug('Categories are', categories);
  log.info('Retrieving apps completed');
  event.reply('retrieve-apps-finished', {apps, categories});
});
