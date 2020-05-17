import axios from "axios";
import {version} from "../../package.json";
import cmp from 'semver-compare';
import log from 'electron-log';
import {createWriteStream, existsSync} from "fs";
import {promisify} from 'util';
import {sep, normalize} from "path";
import Zip from 'adm-zip';
import {escape, copy, rootPath, readFile, writeFile} from "./file";
import rimraf from 'rimraf';
import os from 'os';

const plist = require('plist');


const streamPipeline = promisify(require('stream').pipeline);


export async function checkForStoreUpdate() {
  const response = await axios.get('https://api.github.com/repos/MaxvandeLaar/homey-community-store/releases/latest').catch(log.error);
  if (!response || response.status !== 200) {
    log.warn('Failed check for update', response);
    return false; // No update if can't connect to repo
  }
  const remotePackage = response.data;
  const remoteVersion = remotePackage.tag_name.replace(/v/gi, '');
  const resultCheck = cmp(remoteVersion, version) === 1; // 1 === removeVersion is higher than current app version
  log.info('Is update required?', `current ${version}`, `remote ${remoteVersion}`, `compare result ${resultCheck}`);
  return resultCheck;
}

export async function updateStore() {
  log.info('Downloading store update info');
  const response = await axios.get('https://api.github.com/repos/MaxvandeLaar/homey-community-store/releases/latest').catch(log.error);
  if (!response || response.status !== 200) {
    return {success: false, error: 'Cannot connect to the Homey Community Store server'}; // No update if can't connect to repo
  }
  const release = response.data;
  const sourceAsset = release.assets.find((asset: any) => asset.name === 'update-source.zip');
  const sourceUrl = sourceAsset.browser_download_url;

  const filePath = `${rootPath()}${sep}tmp${sep}update-source`;
  const extension = '.zip';
  const file = filePath + extension;

  const destination = process.env.NODE_ENV === 'development' ? `${rootPath()}${sep}tmp${sep}test` : rootPath() + sep;

  log.info('Downloading store update files');

  const downloadResponse = await axios.get(sourceUrl, {
    responseType: 'stream',
    onDownloadProgress: (p) => {
      log.info('Download progress', p);
    }
  });
  if (!downloadResponse || downloadResponse.status !== 200) {
    log.error('Download update files failed', downloadResponse);
    return {success: false, error: 'Download update files failed'}; // No update if can't connect to repo
  }
  await streamPipeline(downloadResponse.data, createWriteStream(file));

  log.info('Extracting update files', file);
  const zip = new Zip(file);

  zip.extractAllTo(escape(`${rootPath()}${sep}tmp${sep}`), true);
  log.info('Extraction finished');

  log.info('Check if previous files exist');
  if (existsSync(`${destination}${sep}.webpack`)) {
    log.info('Remove .webpack folder');
    rimraf.sync(`${destination}${sep}.webpack`);
  }
  if (existsSync(`${destination}${sep}package.json`)) {
    log.info('Remove package.json');
    rimraf.sync(`${destination}${sep}package.json`);
  }
  if (existsSync(`${destination}${sep}package-lock.json`)) {
    log.info('Remove package-lock.json');
    rimraf.sync(`${destination}${sep}package-lock.json`);
  }
  if (existsSync(`${destination}${sep}node_modules`)) {
    log.info('Remove node_modules');
    rimraf.sync(`${destination}${sep}node_modules`);
  }

  log.info('Move installation files from, to', filePath + sep, destination);

  try {
    await copy(filePath + sep, destination, true);
  } catch (e) {
    log.error(e);
    return {success: false, error: e}; // No update if can't connect to repo
  }

  log.info('Moved installation files');

  if (os.platform() === 'darwin' && process.env.NODE_ENV !== 'development') {
    try {
      const plistFile = normalize(`${rootPath()}/../../Info.plist`);
      const plistObj = plist.parse(readFile(plistFile));
      plistObj.CFBundleShortVersionString = release.tag_name.replace('v', '');
      plistObj.CFBundleVersion = release.tag_name.replace('v', '');
      writeFile(plistFile, plist.build(plistObj));
    } catch(e) {
      log.error(e);
    }
  }

  log.info('Finished installation');
  log.info('Relaunching app');
  return {success: true};
}

