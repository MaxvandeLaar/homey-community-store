import {exec} from 'child_process';

export function execute(command: string, options = {}): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    exec( command,
      options,
      function (error, stdout, stderr) {
        if (error) {
          return reject({error, stdout, stderr});
        }
        return resolve({stdout, stderr});
      });
  });

}
