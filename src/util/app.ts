import repos from '../assets/apps.json';
import axios from 'axios';
import {ipcMain} from 'electron';
import {AppInfo} from "../interfaces/App";

export async function getApps(): Promise<AppInfo[]> {
  const appList: AppInfo[] = [];

  const keys = Object.keys(repos);
  const promises = keys.map(async (key) => {
    let url = (repos as { [key: string]: any; })[key].repo;
    if (url.includes('github.com')) {
      if (!url.includes('#')) {
        url = `${url}#master`;
      }
      const rawUrl = url.replace('#', '/raw/');
      const appJsonUrl = `${rawUrl}/app.json`;
      const response: any = await axios.get(appJsonUrl).catch(console.error);
      if (!response || response.status !== 200) {
        console.error(response.statusText);
        return key;
      }
      let appInfo: AppInfo = response.data;
      if (typeof response.data !== 'object') {
        appInfo = null;
        try {
          appInfo = JSON.parse(response.data);
        } catch (e) {
          console.log(url);
          console.error(e);
          return key;
        }
      }
      const iconResponse: any = await axios.get(`${rawUrl}/assets/icon.svg`).catch(console.error);
      if (!iconResponse || iconResponse.status !== 200) {
        console.error(iconResponse.statusText);
        // return key;
      } else {
        appInfo.icon = iconResponse.data;
      }

      if (appInfo.images?.small) {
        appInfo.images.small = `${rawUrl}/${appInfo.images.small.substr(0, 1) === '.' ? appInfo.images.small.substr(1) : appInfo.images.small}`
      }
      if (appInfo.images?.large) {
        appInfo.images.large = `${rawUrl}/${appInfo.images.large.substr(0, 1) === '.' ? appInfo.images.large.substr(1) : appInfo.images.large}`
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

      appList.push(appInfo);
    }
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
      if (!categories.includes(cat.toLowerCase())){
        categories.push(cat.toLowerCase());
      }
    });
  });
  categories.sort();
  event.reply('retrieve-apps-finished', {apps, categories});
});
