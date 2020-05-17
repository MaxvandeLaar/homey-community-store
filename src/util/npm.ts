const npm = require('npm');
import log from 'electron-log';

export function npmInstall(path: string) {
  return new Promise((resolve, reject) => {
    npm.load({
      loaded: false,
      progress: false,
      'no-audit': true,
      'only': 'prod',
    }, (err: any) => {

      if (err){
        return reject(err);
      }

      npm.commands.install(path, [], (error: any, data: any) => {
        if (error) {
          return reject(error);
        }
        log.debug("NPM install result", data);
        return resolve(data);
      });

      npm.on("log", function (message: any) {
        log.debug(message);
      });
    });
  });
}
