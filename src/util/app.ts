// import repos from '../assets/apps.json';
import axios from 'axios';
import {ipcMain} from 'electron';

const log = require('electron-log');
import {AppInfo} from "../interfaces/App";

let repos: { [key: string]: any } = null;

async function init() {
  const response = await axios.get('https://raw.githubusercontent.com/MaxvandeLaar/homey-community-store/master/src/assets/apps.json').catch(console.error);
  if (!response || response.status !== 200) {
    return;
  }
  repos = response.data;
}

init();


export async function getApps(): Promise<AppInfo[]> {
  const appList: AppInfo[] = [];

  if (!repos) {
    await init();
  }

  const keys = Object.keys(repos);
  const promises = keys.map(async (key) => {
    let url: string = (repos as { [key: string]: any; })[key].repo;
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

    const appJsonUrl = `${rawUrl}/app.json`;

    const response: any = await axios.get(appJsonUrl).catch((e) => {
      return key
    });
    if (!response || response.status !== 200) {
      // console.error(response ? response.statusText : response);
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

    const iconResponse: any = await axios.get(`${rawUrl}/assets/icon.svg`).catch(console.error);
    if (!iconResponse || iconResponse.status !== 200) {
      // console.error(iconResponse ? iconResponse.statusText : iconResponse);
      return key;
    } else {
      appInfo.icon = iconResponse.data;
    }

    if (appInfo.images?.small) {
      appInfo.images.small = `${rawUrl}/${appInfo.images.small.substr(0, 1) === '.' ? appInfo.images.small.substr(1) : appInfo.images.small}`
      const smallImageResponse = await axios.head(appInfo.images.small).catch((e) => {
      });
      if (!smallImageResponse || smallImageResponse.status !== 200) {
        appInfo.images.small = null;
      }
    }
    if (appInfo.images?.large) {
      appInfo.images.large = `${rawUrl}/${appInfo.images.large.substr(0, 1) === '.' ? appInfo.images.large.substr(1) : appInfo.images.large}`
      const largeImageResponse = await axios.head(appInfo.images.large).catch((e) => {
      });
      if (!largeImageResponse || largeImageResponse.status !== 200) {
        appInfo.images.large = null;
      }
    }
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

    if (appInfo.drivers) {
      appInfo.drivers.forEach((driver) => {
        driver.images.small = `${rawUrl}/${driver.images.small.substr(0, 1) === '.' ? driver.images.small.substr(1) : driver.images.small}`
        driver.images.large = `${rawUrl}/${driver.images.large.substr(0, 1) === '.' ? driver.images.large.substr(1) : driver.images.large}`
      });
    }

    appList.push(appInfo);

    return key;
  });

  await Promise.all(promises);
  appList.sort((a: AppInfo, b: AppInfo) => {
    const nameA = a.name.en.toLowerCase();
    const nameB = b.name.en.toLowerCase();
    return nameA > nameB ? 1 : nameA < nameB ? -1 : 0;
  });

  return appList;
}

ipcMain.on('retrieve-apps', async (event, args) => {
  const apps = await getApps();
  const categories: string[] = [];
  apps.forEach(app => {
    app.category.forEach(cat => {
      if (!categories.includes(cat.toLowerCase())) {
        categories.push(cat.toLowerCase());
      }
    });
  });
  categories.sort();
  event.reply('retrieve-apps-finished', {apps, categories});
});
