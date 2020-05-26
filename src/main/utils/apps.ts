import {error} from "electron-log";
import AWS from "aws-sdk";
import {ipcMain, app} from "electron";
import fetch from 'node-fetch';
import {AppInfo} from "../../interfaces/App";
import {apiAccess, apiKey} from "./auth";
import cmp from 'semver-compare';


AWS.config = new AWS.Config({region: 'eu-central-1'});
const electronApp = app;

ipcMain.on('retrieve-apps', async (event, args) => {
  const authenticated = await apiAccess().catch(error);
  if (!authenticated) {
    return;
  }
  AWS.config.update(authenticated);
  const result: any = await retrieveApps().catch(error);
  if (!result) {
    return;
  }
  const apps: AppInfo[] = [];
  const appPromises = result.map(async (app: { id: string, versions: any[] }) => {
    app.versions.sort((a, b) => {
      return cmp(b.version, a.version);
    });

    const promises = app.versions.map(async (appVersion) => {
      appVersion = getAppAssets(appVersion);
      appVersion = getAppLocales(appVersion);

      if (!appVersion.category || appVersion.category.length === 0) {
        appVersion.category = ['general'];
      }
      if (typeof appVersion.category === 'string') {
        appVersion.category = [appVersion.category];
      }

      if (!appVersion.readMe) {
        const urlLocale = electronApp.getLocale() === 'en' ? '' : `.${electronApp.getLocale()}`;
        let readMeUrl = `${appVersion.rawUrl}README${urlLocale}.txt`;

        const exists = await fetch(readMeUrl, {method: 'HEAD'});
        if (!exists.ok) {
          if (!urlLocale) {
            readMeUrl = `${appVersion.rawUrl}README.md`;
          } else {
            readMeUrl = `${appVersion.rawUrl}README.txt`;

            const res = await fetch(readMeUrl, {method: 'HEAD'});
            if (!res.ok){
              readMeUrl = `${appVersion.rawUrl}README.md`;
            }
          }
        }
        const response = await fetch(readMeUrl);
        if (!response.ok){
          appVersion.readMe = appVersion.description;
        } else {
          appVersion.readMe = await response.text();
        }
      }

      return appVersion;
    });

    await Promise.all(promises).catch(error);

    apps.push(app.versions[0]);
    return app;
  });

  await Promise.all(appPromises).catch(error)

  const categories: string[] = [];
  apps.forEach(app => {
    app.category.forEach(cat => {
      if (!categories.includes(cat.toLowerCase())) {
        categories.push(cat.toLowerCase());
      }
    });
  });
  categories.sort();
  event.reply('retrieve-apps-complete', {apps, categories, allApps: result});
});

async function retrieveApps() {
  return new Promise((resolve, reject) => {
    fetch('https://4c23v5xwtc.execute-api.eu-central-1.amazonaws.com/production/apps', {
      headers: {
        'x-api-key': apiKey
      }
    })
      .then((res) => res.json())
      .then(res => {
        const apps: any = [];
        res.Items.forEach((app: any) => {
          const theApp = AWS.DynamoDB.Converter.unmarshall(app);
          apps.push(theApp);
        });
        resolve(apps);
      })
      .catch(reject);
  });
}

function getAppAssets(appInfo: AppInfo): AppInfo {
  const bucket = 'https://homey-community-store.s3.eu-central-1.amazonaws.com/';
  const {id, version} = appInfo;
  const baseUrl = `${bucket}${id}/${version}/`;
  appInfo.icon = `${baseUrl}assets/icon.svg`;
  if (appInfo.images.small) {
    appInfo.images.small = `${baseUrl}${cleanUrl(appInfo.images.small)}`;
  }
  if (appInfo.images.large) {
    appInfo.images.large = `${baseUrl}${cleanUrl(appInfo.images.large)}`;
  }

  appInfo.rawUrl = baseUrl;

  return appInfo;
}

function getAppLocales(appInfo: AppInfo): AppInfo {
  const locales: { [key: string]: any } = {}

  if (appInfo.name) {
    Object.keys(appInfo.name).forEach(lang => {
      locales[lang] = {name: appInfo.name[lang]}
    });
  }

  if (appInfo.description) {
    Object.keys(appInfo.description).forEach(lang => {
      locales[lang] = {
        ...locales[lang],
        description: appInfo.description[lang]
      }
    });
  }

  if (appInfo.tags) {
    Object.keys(appInfo.tags).forEach(lang => {
      locales[lang] = {
        ...locales[lang],
        tags: appInfo.tags[lang]
      }
    });
  }

  appInfo.locales = locales;
  return appInfo;
}

function cleanUrl(url: string) {
  let tmp = url.substr(0, 1) === '.' ? url.substr(1) : url;
  tmp = tmp.substr(0, 1) === '/' ? tmp.substr(1) : tmp;
  return tmp;
}
