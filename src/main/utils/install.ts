import {AppInfo} from "../../interfaces/App";
import {ipcMain, IpcMainEvent} from "electron";
import {info, debug, error} from 'electron-log';
import {apiAccess} from "./auth";
import AWS from "aws-sdk";
import {createWriteStream, ensureDirSync, createReadStream, readdirSync, statSync, remove} from "fs-extra";
import {appFolder} from "./system";
import {extname, join} from "path";
import {Extract} from 'unzipper';

const AthomApp = require('../homey/index').App;
import slash from 'slash';

ipcMain.on('install-app', async (event, args) => {
  const {app, version} = args;
  debug('Install App');
  event.reply('install-app-progress', {
    event: 'Start',
    app,
  });
  const authenticated = await apiAccess().catch(error);
  debug('authenticated?', !!authenticated);
  if (!authenticated) {
    return;
  }
  AWS.config.update(authenticated);
  debug('Start download');
  const downloadPath = `${appFolder()}/apps/${app.id}/${version}/`;
  const downloadFile = await downloadApp(downloadPath, app, version, event).catch(error);
  if (!downloadFile) {
    return;
  }
  const appPath = await unzipApp(downloadPath, downloadFile);
  info('UNZIPPED', appPath);

  try {
    event.reply('install-app-progress', {
      event: 'Installing',
      app,
      progress: 100
    });
    debug('Init AthomApp Api', app.id);
    const appAPI = new AthomApp(appPath);
    appAPI.path = slash(appAPI.path);
    appAPI._app._path = slash(appAPI._app._path);
    appAPI._appJsonPath = slash(appAPI._appJsonPath);
    appAPI._pluginsPath = slash(appAPI._pluginsPath);
    appAPI._homeyComposePath = slash(appAPI._homeyComposePath);

    const result = await appAPI.install();
    if (Object.keys(result).length > 0) {
      info('Installation complete', app.id, result);
      return event.reply(`install-app-completed`, {app});
    } else {
      error('Installation failed due to unknown error', app.id, result);
      return event.reply(`install-app-completed`, {
        error: 'Installation failed due to an unknown error',
        app
      });
    }
  } catch (error) {
    error(error);
    return event.reply(`install-app-completed`, {error, app});
  } finally {
    remove(downloadPath, err => {
      if (err) return error(err)
      debug('Removed source code folder');
    });
  }

});

async function downloadApp(downloadPath: string, app: AppInfo, version: string, event: IpcMainEvent): Promise<string> {
  event.reply('install-app-progress', {
    event: 'Download',
    app,
    progress: 0
  });
  return new Promise(async (resolve, reject) => {
    ensureDirSync(downloadPath);
    const downloadFile = `${downloadPath}dist.zip`

    const s3 = new AWS.S3();
    const params = {
      Bucket: 'homey-community-store',
      Delimiter: '/',
      Prefix: `${app.id}/${version}/`
    }

    const s3Files = await s3.listObjects(params).promise();
    const remoteFile = s3Files.Contents?.find((file) => {
      return file.Key && extname(file.Key) === '.zip';
    });
    if (!remoteFile || !remoteFile.Key) {
      return reject({error: 'No file found'});
    }

    const s3Size = await s3.headObject({
      Bucket: 'homey-community-store',
      Key: remoteFile.Key
    }).promise();
    const downloadSize = s3Size.ContentLength || 100000000;

    const s3Stream = s3.getObject({
      Bucket: 'homey-community-store',
      Key: remoteFile.Key
    }).createReadStream();

    const fileStream = createWriteStream(downloadFile);

    s3Stream.on('error', (err) => {
      error(err);
      reject(err);
    });
    let downloadCounter = 0;


    s3Stream.on('data', (data) => {
      downloadCounter += data.length;
      const percentage = Math.round(downloadCounter * 100 / downloadSize);
      if (percentage % 10 === 0) {
        event.reply('install-app-progress', {
          event: 'Downloading',
          app,
          progress: percentage
        });
      }
    });

    s3Stream.pipe(fileStream)
      .on('error', (err) => {
        error('File Stream:', err);
        reject(err)
      })
      .on('close', () => {
      resolve(downloadFile);
    });
  });
}

async function unzipApp(output: string, input: string) {
  return new Promise((resolve, reject) => {
    const stream = createReadStream(input)
      .pipe(Extract({path: `${output}dist`}));

    stream.on('error', (err) => {
      error(err);
      reject(err);
    });

    stream.on('close', (res: any) => {
      const appFolder = findAppFolder(`${output}dist`, 'app.json');
      resolve(appFolder);
    });
  });
}

function findAppFolder(root: string, filename: string, files?: string[], result?: string) {
  files = files || readdirSync(root)
  files.forEach(
    function (file) {
      const newRoot = join(root, file)
      if (statSync(newRoot).isDirectory()) {
        result = findAppFolder(newRoot, filename, readdirSync(newRoot), result)
      } else {
        if (file === filename) {
          result = root;
        }
      }
    }
  )
  return result
}

