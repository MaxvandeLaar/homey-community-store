const fs = require('fs');
const {exec} =  require('child_process');

module.exports = {
  packagerConfig: {
    packageManager: "npm",
    executableName: "homey-community-store",
    icon: "src/assets/logo.icns"
  },
  rebuildConfig: {
    extraModules: [
      "homey",
      "npm"
    ]
  },
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "MaxvandeLaar",
          name: "homey-community-store"
        },
        prerelease: true
      }
    }
  ],
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "HomeyCommunityStore",
        exe: "homey-community-store.exe"
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "darwin"
      ]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {}
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    }
  ],
  plugins: [
    [
      "@electron-forge/plugin-webpack",
      {
        mainConfig: "./webpack.main.config.js",
        renderer: {
          config: "./webpack.renderer.config.js",
          entryPoints: [
            {
              html: "./src/index.html",
              js: "./src/renderer.tsx",
              name: "main_window"
            }
          ]
        }
      }
    ]
  ],
  hooks: {
    postPackage: async () => {
      const pathDarwin = `${__dirname}/out/Homey Community Store-darwin-x64/Homey Community Store.app/Contents/Resources/app`;
      const pathLinux = `${__dirname}/out/Homey Community Store-linux-x64/resources/app`;
      const pathWindows = `${__dirname}/out/Homey Community Store-win32-x64/resources/app`;
      const lockFile = 'package-lock.json';

      if (fs.existsSync(pathDarwin) && ! fs.existsSync(pathDarwin + '/' + lockFile)){
        await afterPackage(pathDarwin);
      }
      if (fs.existsSync(pathLinux) && ! fs.existsSync(pathLinux + '/' + lockFile)){
        await afterPackage(pathLinux);
      }
      if (fs.existsSync(pathWindows) && ! fs.existsSync(pathWindows + '/' + lockFile)){
        await afterPackage(pathWindows);
      }
    }
  }
}

async function afterPackage(path){
  await execute(`npm install homey npm electron-log`, {cwd: path});
  const escapedPath = path.replace(/\s/g, '\\ ');
  await execute(`cp -rf ./custom_modules/homey ${escapedPath}/node_modules/`, );
}

function execute(command, options = {}) {
  return new Promise((resolve, reject) => {
    console.log('Running command:', command, options);
    exec( command,
      {
        timeout: 30000,
        ...options
      },
      function (error, stdout, stderr) {
        if (error) {
          console.error(error);
          return reject({error, stdout, stderr});
        }
        console.log(stdout);
        if (stderr) {
          console.error(stderr);
        }
        return resolve({stdout, stderr});
      });
  });

}
