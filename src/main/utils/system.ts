import {app} from 'electron';
import {ensureDirSync} from "fs-extra";


export function appFolder() {
  const path = `${app.getPath('appData')}/com.maxvandelaar.homey-community-store`;
  ensureDirSync(path);
  return path;
}
