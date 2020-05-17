import {normalize, sep} from "path";
import slash from "slash";
import {app} from "electron";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
const copyRecursive = require('recursive-copy');
import log from 'electron-log';

export function rootPath(): string {
  return escape(app.getAppPath());
}

export function escape(path: string) {
  return slash(normalize(path));
}

export function copy(src: string, dest: string, overwrite = false) {
  const options = {
    overwrite: overwrite,
    dot: true,
    junk: true,
    debug: true
  };

  return new Promise((resolve, reject) => {
    copyRecursive(src, dest, options)
      .on(copyRecursive.events.COPY_FILE_START, function(copyOperation: any) {
        log.info('Copying file ' + copyOperation.src + '...');
      })
      .on(copyRecursive.events.COPY_FILE_COMPLETE, function(copyOperation: any) {
        log.info('Copied to ' + copyOperation.dest);
      })
      .on(copyRecursive.events.ERROR, function(error: any, copyOperation: any) {
        log.error('Unable to copy ' + copyOperation.dest);
        reject(error);
      })
      .then(function(results: any) {
        log.info(results.length + ' file(s) copied');
        resolve(results);
      })
      .catch(function(error: any) {
        log.error('Copy failed: ' + error);
        reject(error);
      });
  })
}

export function readFile(path: string) {
  return readFileSync(path, {encoding: 'utf8'})
}

export function writeFile(path: string, data: any) {
  return writeFileSync(path, data, {encoding: 'utf8'});
}

export function initFolders(){
  if (!existsSync(`${rootPath()}${sep}tmp`)) {
    mkdirSync(`${rootPath()}${sep}tmp`);
  }
}
