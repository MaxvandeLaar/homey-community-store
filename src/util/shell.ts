import {exec} from 'child_process';
const log = require('electron-log');

export function execute(command: string, options = {}): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    log.debug('Running command:', command, options);
    exec( command,
      {
        timeout: 30000,
        ...options
      },
      function (error, stdout, stderr) {
        if (error) {
          return reject({error, stdout, stderr});
        }
        return resolve({stdout, stderr});
      });
  });

}
