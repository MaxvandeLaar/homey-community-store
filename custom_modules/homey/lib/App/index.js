'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const Log = require('../..').Log;
const AthomApi = require('../..').AthomApi;
const AppPluginCompose = require('../AppPluginCompose');
const AppPluginZwave = require('../AppPluginZwave');
const AppPluginZigbee = require('../AppPluginZigbee');
const AppPluginRF = require('../AppPluginRF');
const AppPluginLog = require('../AppPluginLog');
const AppPluginOAuth2 = require('../AppPluginOAuth2');
const { AthomAppsAPI } = require('athom-api');

const { getAppLocales } = require('homey-lib');
const HomeyLibApp = require('homey-lib').App;
const HomeyLibDevice = require('homey-lib').Device;
const colors = require('colors');
const inquirer = require('inquirer');
const tmp = require('tmp-promise');
const tar = require('tar-fs');
const semver = require('semver');
const ignoreWalk = require('ignore-walk');
const gitIgnoreParser = require('gitignore-parser');
const { monitorCtrlC } = require('monitorctrlc');
const fse = require('fs-extra');
const filesize = require('filesize');
const querystring = require('querystring');
const fetch = require('node-fetch');

const statAsync = promisify( fs.stat );
const mkdirAsync = promisify( fs.mkdir );
const readFileAsync = promisify( fs.readFile );
const writeFileAsync = promisify( fs.writeFile );
const copyFileAsync = promisify( fs.copyFile );
const accessAsync = promisify( fs.access );
const readDirAsync = promisify( fs.readdir );

const GitCommands = require('../Modules/GitCommands');
const NpmCommands = require('../Modules/NpmCommands');

const PLUGINS = {
  'compose': AppPluginCompose,
  'zwave': AppPluginZwave,
  'zigbee': AppPluginZigbee,
  'rf': AppPluginRF,
  'log': AppPluginLog,
  'oauth2': AppPluginOAuth2,
};

const FLOW_TYPES = [ 'triggers', 'conditions', 'actions' ];

class App {

	constructor( appPath ) {
		this.path = path.resolve(appPath);
		this._app = new HomeyLibApp( this.path );
    this._appJsonPath = path.join( this.path, 'app.json' );
    this._pluginsPath = path.join( this.path, '.homeyplugins.json');
    this._homeyComposePath = path.join(this.path, '.homeycompose');
		this._exiting = false;
		this._std = {};
    this._git = new GitCommands(appPath);
  }

  async validate({ level = 'debug' } = {}) {
    Log(colors.green('✓ Validating app...'));

    try {
      await this._app.validate({ level });

      Log(colors.green(`✓ Homey App validated successfully against level \`${level}\``));
      return true;
    } catch( err ) {
      Log(colors.red(`✖ Homey App did not validate against level \`${level}\`:`));
      Log(err.message);
      return false;
    }
  }

  async build() {
    Log(colors.green('✓ Building app...'));
    await this.preprocess();

    let valid = await this.validate();
    if( valid !== true ) throw new Error('The app is not valid, please fix the validation issues first.');

    Log(colors.green('✓ App built successfully'));
  }

  async run({
    clean = false,
    skipBuild = false,
  } = {}) {

    this._session = await this.install({
      clean,
      skipBuild,
      debug: true,
    });

    const activeHomey = await AthomApi.getActiveHomey();

    clean && Log(colors.green(`✓ Purged all Homey App settings`));
    Log(colors.green(`✓ Running \`${this._session.appId}\`, press CTRL+C to quit`));
    Log(colors.grey(` — Profile your app's performance at https://go.athom.com/app-profiling?homey=${activeHomey._id}&app=${this._session.appId}`));
    Log('─────────────── Logging stdout & stderr ───────────────');

    activeHomey.devkit.on('std', this._onStd.bind(this));
    activeHomey.devkit.waitForConnection()
      .then(() => {
        return activeHomey.devkit.getAppStdOut({
          session: this._session.session
        })
      }).then( stdCache => {
        stdCache
          .map(std => {
            std.chunk = Buffer.from(std.chunk);
            return std;
          })
          .forEach(this._onStd.bind(this));
      }).catch(err => {
        Log(colors.red('✖', err.message || err.toString()));
      })
    activeHomey.devkit.on('disconnect', () => {
      Log(colors.red(`✖ Connection has been lost, exiting...`));
      process.exit();
    })

    monitorCtrlC(this._onCtrlC.bind(this));
  }

  async install({
    clean = false,
    skipBuild = false,
    debug = true,
  } = {}) {
    if (skipBuild) {
      Log(colors.yellow(`\n⚠ Skipping build steps!\n`));
    } else {
      await this.preprocess();
    }

    let valid = await this.validate();
    if( valid !== true ) throw new Error('Not installing, please fix the validation issues first');

    let activeHomey = await AthomApi.getActiveHomey();

    Log(colors.green(`✓ Packing Homey App...`));

    let archiveStream = await this._getPackStream();
    let env = await this._getEnv();
    env = JSON.stringify(env);

    let form = {
      app: archiveStream,
      debug: debug,
      env: env,
      purgeSettings: clean,
    }

    Log(colors.green(`✓ Installing Homey App on \`${activeHomey.name}\` (${await activeHomey.baseUrl})...`));

    try {
      let result = await activeHomey.devkit._call('POST', '/', {
        form: form,
        opts: {
          $timeout: 1000 * 60 * 5 // 5 min
        },
      });

      Log(colors.green(`✓ Homey App \`${result.appId}\` successfully installed`));

      return result;
    } catch( err ) {
      Log(colors.red('✖', err.message || err.toString()));
      process.exit();
    }
  }

	async preprocess() {
    	Log(colors.green('✓ Pre-processing app...'));

		const appJson = await this._getAppJsonFromFolder();
		if (appJson) {
			this._isValidAppJson(appJson);
		} else throw new Error('This app.json is invalid!');

		let plugins = await this._getPlugins();
		if( plugins.length < 1 ) return;

    Log(colors.green('✓ Running plugins...'));

    for( let i = 0; i < plugins.length; i++ ) {
      let plugin = plugins[i];
      let pluginId = plugin.id;
      let pluginClass = PLUGINS[ pluginId ];

      if( typeof pluginClass !== 'function' )
        throw new Error(`Invalid plugin: ${pluginId}`);

      Log(colors.green(`✓ Running plugin \`${pluginId}\`...`));
      let pluginInstance = new pluginClass( this, plugin.options );
      try {
        await pluginInstance.run();
        Log(colors.green(`✓ Plugin \`${pluginId}\` finished`));
      } catch( err ) {
        console.trace(err)
        throw new Error(`Plugin \`${pluginId}\` did not finish:\n${err.message}\n\nAborting.`);
      }
    }

  }

  async version(version) {
    let hasCompose = await this._hasPlugin('compose');
    let appJsonPath;
    let appJson;

    if( hasCompose ) {
        let appJsonComposePath = path.join(this.path, '.homeycompose', 'app.json');
        let exists = false;
        try {
          await accessAsync(appJsonComposePath, fs.constants.R_OK | fs.constants.W_OK);
          exists = true;
        } catch( err ) {}

        if( exists ) {
          appJsonPath = appJsonComposePath;
        } else {
          appJsonPath = path.join(this.path, 'app.json');
        }
      } else {
        appJsonPath = path.join(this.path, 'app.json');
      }

      try {
        appJson = await readFileAsync( appJsonPath, 'utf8' );
        appJson = JSON.parse( appJson );
      } catch( err ) {
        if( err.code === 'ENOENT' )
          throw new Error(`Could not find a valid Homey App at \`${this.path}\``);

        throw new Error(`Error in \`app.json\`:\n${err}`);
      }

      if( semver.valid(version) ) {
        appJson.version = version;
    } else {
      if( !['minor', 'major', 'patch'].includes(version) )
        throw new Error('Invalid version. Must be either patch, minor or major.');

      appJson.version = semver.inc(appJson.version, version);
    }

    await writeFileAsync( appJsonPath, JSON.stringify(appJson, false, 2) );
    await this.build();

    Log(colors.green(`✓ Updated app.json version to \`${appJson.version}\``));
  }

  async publish() {

    await this.preprocess();

    if( await fse.pathExists(path.join(this.path, 'package.json')) ) {
      const hasAllModules = await NpmCommands.listModules( {path: this.path} );
      if (!hasAllModules) {
        const continueOnError = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'value',
            default: false,
            message: `Not all node modules are installed. Are you sure you want to continue?`
          },
        ]);
        if( !continueOnError.value )
          throw new Error('✖ Please run "npm install" to install any missing node modules.');
      }
    }

    const valid = await this.validate({ level: 'publish' });
    if( valid !== true ) throw new Error('The app is not valid, please fix the validation issues first.');

    const env = await this._getEnv();

    const appJson = await fse.readJSON(this._appJsonPath);
    let {
      id: appId,
      version: appVersion,
    } = appJson;

    const versionBumpChoices = {
      patch: {
        value: 'patch',
        targetVersion: `${semver.inc(appVersion, 'patch')}`,
        get name() { return `Patch (to v${this.targetVersion})` },
      },
      minor: {
        value: 'minor',
        targetVersion: `${semver.inc(appVersion, 'minor')}`,
        get name() { return `Minor (to v${this.targetVersion})` },
      },
      major: {
        value: 'major',
        targetVersion: `${semver.inc(appVersion, 'major')}`,
        get name() { return `Major (to v${this.targetVersion})` },
      },
    };

    // First ask if version bump is desired
    const shouldUpdateVersion = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'value',
        message: `Do you want to update your app's version number? (current v${appVersion})`
      },
    ]);
    let shouldUpdateVersionTo = null;

    // If version bump is desired ask for patch/minor/major
    if (shouldUpdateVersion.value) {
      shouldUpdateVersionTo = await inquirer.prompt([
        {
          type: 'list',
          name: 'version',
          message: 'Select the desired version number',
          choices: Object.values(versionBumpChoices)
        },
      ]);
    }

    let bumpedVersion = false;
    const commitFiles = [];
    if (shouldUpdateVersion.value) {

      // Apply new version (this changes app.json and .homeycompose/app.json if needed)
      await this.version(shouldUpdateVersionTo.version);

      // Check if only app.json or also .homeycompose/app.json needs to be committed
      commitFiles.push(this._appJsonPath);
      if (await fse.exists(path.join(this._homeyComposePath, 'app.json'))) {
        commitFiles.push(path.join(this._homeyComposePath, 'app.json'));
      }

      // Update version number
      appVersion = versionBumpChoices[shouldUpdateVersionTo.version].targetVersion;

      // Set flag to know that we have changed the version number
      bumpedVersion = true;
    }

    // Get or create changelog
    let updatedChangelog = false;
    const changelog = await Promise.resolve().then(async () => {
      const changelogJsonPath = path.join(this.path, '.homeychangelog.json');
      const changelogJson = (await fse.pathExists(changelogJsonPath))
        ? await fse.readJson(changelogJsonPath)
        : {}

      if( !changelogJson[appVersion] || !changelogJson[appVersion]['en'] ) {
        const { text } = await inquirer.prompt([
          {
            type: 'input',
            name: 'text',
            message: `(Changelog) What's new in ${appJson.name.en} v${appVersion}?`,
            validate: input => {
              return input.length > 3;
            }
          },
        ]);

        changelogJson[appVersion] = changelogJson[appVersion] || {};
        changelogJson[appVersion]['en'] = text;
        await fse.writeJson(changelogJsonPath, changelogJson, {
          spaces: 2,
        });

        Log(colors.grey(` — Changelog: ${text}`));

        // Mark as changed
        updatedChangelog = true;

        // Make sure to commit changelog changes
        commitFiles.push(changelogJsonPath);
      }

      return changelogJson[appVersion];
    });

    // Get readme
    const en = await readFileAsync( path.join(this.path, 'README.txt' ) )
      .then(buf => buf.toString())
      .catch(err => {
        throw new Error('Missing file `/README.txt`. Please provide a README for your app. The contents of this file will be visible in the App Store.');
      });

    const readme = { en };

    // Read files in app dir
    const files = await readDirAsync(this.path, { withFileTypes: true });

    // Loop all paths to check for matching readme names
    for (const file of files) {
      if (Object.prototype.hasOwnProperty.call(file, 'name') && typeof file.name === 'string') {
        // Check for README.<code>.txt file name
        if (file.name.startsWith('README.') && file.name.endsWith('.txt')) {
          const languageCode = file.name.replace('README.', '').replace('.txt', '');

          // Check language code against homey-lib supported language codes
          if (getAppLocales().includes(languageCode)) {
            // Read contents of file into readme object
            readme[languageCode] = await readFileAsync(path.join(this.path, file.name)).then(buf => buf.toString());
          }
        }
      }
    }

    // Get delegation token
    Log(colors.green(`✓ Submitting ${appId}@${appVersion}...`));
    if( Object.keys(env).length ) {
      function ellipsis(str) {
        if (str.length > 10)
          return str.substr(0, 5) + '...' + str.substr(str.length-5, str.length);
        return str;
      }

      Log(colors.grey(` — Homey.env (env.json)`));
      Object.keys(env).forEach(key => {
        const value = env[key];
        Log(colors.grey(`   — ${key}=${ellipsis(value)}`));
      });
    }

    const bearer = await AthomApi.createDelegationToken({
      audience: 'apps',
    });

    const api = new AthomAppsAPI({
      bearer,
    });

    const {
      url,
      method,
      headers,
      buildId,
    } = await api.createBuild({
      env,
      appId,
      changelog,
      version: appVersion,
      readme,
    }).catch(err => {
      err.message = err.name || err.message;
      throw err;
    });

    // Make sure archive stream is created after any additional changes to the app
    // and right before publishing
    const archiveStream = await this._getPackStream();
    const { size } = await fse.stat(archiveStream.path);

    Log(colors.green(`✓ Created Build ID ${buildId}`));
    Log(colors.green(`✓ Uploading ${appId}@${appVersion} (${filesize(size)})...`));
    {
      await fetch(url, {
        method,
        headers: {
          'Content-Length': size,
          ...headers,
        },
        body: archiveStream,
      }).then(async res => {
        if(!res.ok) {
          throw new Error(res.statusText);
        }
      });
    }

    // Commit the version bump and/or changelog to Git if the current path is a repo
    if (await GitCommands.isGitInstalled() && await GitCommands.isGitRepo({ path: this.path })) {
      let createdGitTag = false;
      // Only commit and tag if version is bumped
      if (bumpedVersion) {

        // First ask if version bump is desired
        const shouldCommit = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'value',
            message: `Do you want to commit ${bumpedVersion ? 'the version bump' : ''} ${updatedChangelog ? 'and updated changelog' : ''}?`,
          },
        ]);

        // Check if commit is desired
        if (shouldCommit.value) {

          // If version is bumped via wizard and changelog is changed via wizard then commit all at once
          if (updatedChangelog) {
            await this._git.commitFiles({
              files: commitFiles,
              message: `Bumps version to v${appVersion}`,
              description: `Changelog: ${changelog['en']}`,
            });
            Log(colors.green(`✓ Committed ${commitFiles.map(i => i.replace(`${this.path}/`, '')).join(', and ')} with version bump`));
          } else {
            await this._git.commitFiles({
              files: commitFiles,
              message: `Bumps version to v${appVersion}`,
            });
            Log(colors.green(`✓ Committed ${commitFiles.map(i => i.replace(`${this.path}/`, '')).join(', and ')} with version bump`));
          }

          try {
            if (await this._git.hasUncommittedChanges())
              throw new Error('There are uncommitted or untracked files in this git repository');

            await this._git.createTag({
              version: appVersion,
              message: changelog['en']
            });

            Log(colors.green(`✓ Successfully created Git tag \`${appVersion}\``));
            createdGitTag = true;
          } catch (error) {
            Log(colors.yellow(`⚠ Warning: could not create git tag (v${appVersion}), reason:`));
            Log(colors.grey(error));
          }
        }
      }

      if (await this._git.hasRemoteOrigin() && bumpedVersion) {
        const answers = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'push',
            message: `Do you want to push the local changes to \`remote "origin"\`?`,
            default: false
          }
        ]);

        if (answers.push) {

          // First push tag
          if (createdGitTag) await this._git.pushTag({ version: appVersion });

          // Push all staged changes
          await this._git.push();
          Log(colors.green(`✓ Successfully pushed changes to remote.`));
        }
      }
    }
    Log(colors.green(`✓ App ${appId}@${appVersion} successfully uploaded.`));
    Log(colors.white(`\nVisit https://developer.athom.com/apps/app/${appId}/build/${buildId} to publish your app.`));
  }

  async _hasPlugin( pluginId ) {
    let plugins = await this._getPlugins();
    for( let i = 0; i < plugins.length; i++ ) {
      let plugin = plugins[i];
      if( plugin.id === pluginId ) return true;
    }
    return false;
  }

  async _getPlugins() {
    try {
      let plugins = await readFileAsync( this._pluginsPath );
      return JSON.parse(plugins);
    } catch( err ) {
      if( err.code !== 'ENOENT' )
        throw new Error(`Error in \`.homeyplugins.json\`:\n${err}`);
    }
    return [];
  }

  async addPlugin( pluginId ) {
    if( !PLUGINS[pluginId] )
      throw new Error(`Invalid plugin: ${plugin}`);

    if( await this._hasPlugin(pluginId) ) return;
    let plugins = await this._getPlugins();
    plugins.push({
      id: pluginId
    });
    await this._savePlugins( plugins );
  }

  async addPluginCLI() {
    const { pluginId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'pluginId',
        message: `Select the plugin`,
        choices: Object.keys(PLUGINS)
      }
    ]);

    await this.addPlugin(pluginId);

    Log(colors.green(`✓ Added plugin \`${pluginId}\``));
  }

  async listPlugins() {
    const enabledPlugins = await this._getPlugins();

    Object.keys(PLUGINS).forEach(pluginId => {
      const enabled = !!enabledPlugins.find(plugin => plugin.id === pluginId);
      Log(`[${enabled ? 'x' : ' '}] ${pluginId}`)
    });
  }

  async _savePlugins( plugins ) {
    await writeFileAsync( this._pluginsPath, JSON.stringify(plugins, false, 2) );
  }

  _onStd( std ) {
    if( this._exiting ) return;
    if( std.session !== this._session.session ) return;
    if( this._std[ std.id ] ) return;

    if( std.type === 'stdout' ) process.stdout.write( std.chunk );
    if( std.type === 'stderr' ) process.stderr.write( std.chunk );

    // mark std as received to prevent duplicates
    this._std[ std.id ] = true;
  }

  async _onCtrlC() {
    if( this._exiting ) return;
      this._exiting = true;

    Log('───────────────────────────────────────────────────────');
    Log(colors.green(`✓ Uninstalling \`${this._session.appId}\`...`));

    try {
      let activeHomey = await AthomApi.getActiveHomey();
      await activeHomey.devkit.stopApp({ session: this._session.session });
      Log(colors.green(`✓ Homey App \`${this._session.appId}\` successfully uninstalled`));
    } catch( err ) {
      Log(err.message || err.toString());
    }

    process.exit();

  }

  async _getEnv() {
    try {
      let data = await readFileAsync( path.join(this.path, 'env.json') );
      return JSON.parse(data);
    } catch( err ) {
      return {};
    }
  }

  /**
   * Method performs a npm prune dry run. It reads the generated JSON and based on that builds an array of paths that need
   * to be ignored during the tar process. If anything goes wrong, an empty array is returned (hence no paths will be pruned).
   * @returns {Promise<String[]>}
   * @private
   */
  async _getPrunePaths() {
    // Check if npm is available then start prune dry-run
    const npmInstalled = await NpmCommands.isNpmInstalled();
    Log('GET PRUNE', this.path);
    if (npmInstalled) {
      Log(colors.green('✓ Pruning dev dependencies...'));
      return NpmCommands.getPrunePaths({path: this.path});
    } else {
      Log('npm not installed!');
    }
  }

  async _getPackStream() {
    return tmp.file().then( async o => {

      let tmpPath = o.path;
      Log('tmpPath', o.path);

      // Get list of files to pack, excluding npm prune paths and files in .homeyignore
      const prunePaths = await this._getPrunePaths();
      Log('prunePaths', prunePaths);
      const fileEntries = await this._getPackFileEntries(prunePaths);
      Log('fileEntries', fileEntries);

      let tarOpts = {
        entries: fileEntries,
        dereference: true
      };

      return new Promise((resolve, reject) => {

        let appSize = 0;
        let writeFileStream = fs.createWriteStream( tmpPath )
          .once('close', () => {
            Log(colors.grey(' — App size: ' + filesize(appSize)));
            let readFileStream = fs.createReadStream( tmpPath );
              readFileStream.once('close', () => {
                o.cleanup();
              })
            resolve( readFileStream );
          })
          .once('error', reject)

        tar
          .pack( this.path, tarOpts )
          .on('data', chunk => {
            appSize += chunk.length;
          })
          .pipe( zlib.createGzip() )
          .pipe( writeFileStream )

      });

		})
  }

  async _getPackFileEntries(prunePaths) {
    const walker = new ignoreWalk.Walker({
      path: this.path,
      ignoreFiles: [ '.homeyignore', '' ], // Empty string is workaround for adding default ignore rules
      includeEmpty: true,
      follow: true
    });

    // Add default ignore rules for dotfiles, env.json and npm prune paths
    const ignoreRules = ['.*', 'env.json', ...prunePaths];
    walker.onReadIgnoreFile('', ignoreRules.join('\r\n'), () => {});

    const fileEntries = await new Promise((resolve, reject) => {
      walker.on('done', resolve).on('error', reject).start();
    });

    return fileEntries;
  }

  /**
   * Check if the current folder has a valid app.json.
   * @returns : Parsed JSON object or Error if no app.json was found
   * @private
   */
  async _getAppJsonFromFolder() {
    const appJsonPath = path.join(this.path, 'app.json');
    let appJson;

    try {
      appJson = await readFileAsync( appJsonPath, 'utf8' );
      appJson = JSON.parse( appJson );
    } catch( err ) {
      if( err.code === 'ENOENT' )	throw new Error(`Could not find a valid Homey App at \`${this.path}\``);

      throw new Error(`Error in \`app.json\`:\n${err}`);
    }
    return appJson;
  }

  /**
   * Check if the parsed app.json contains the keys to be a valid Homey app.
   * @param
   * @returns {Boolean}
   *  */
  _isValidAppJson(appJson) {
    if( appJson.hasOwnProperty('id') &&
      appJson.hasOwnProperty('version') &&
      appJson.hasOwnProperty('compatibility') &&
      appJson.hasOwnProperty('name')
    ) return true;

    return false;
  }

  _validateAppJson(appJson) {
    if( this._isValidAppJson(appJson) ) return;

    throw new Error(`The found app.json does not contain the required properties for a valid Homey app!`);
  }

  /**
   * Function to get al drivers from the current path.
   * Returns: String array containing the driver id's.
   */
  async _getDrivers() {
    let driverPath = path.join( this.path, 'drivers' );
    try {
      await fse.ensureDir( driverPath );
    } catch( error ) {
      throw new Error('Your app doesn\'t contain any drivers!');
    }

    const folderContents = await readDirAsync(driverPath, { withFileTypes: true });
    let drivers = [];

    folderContents.forEach( content => {
      if( content.isDirectory() ) {
        drivers.push(content.name);
      }
    })

    return drivers;
  }

  /**
   *
   * @param {Object} param Object containing options. Message is the message to aks the user for input.
   * 					Validator is an optional validator function if the default is not sufficient.
   * @returns Object with translations.
   */
  static async _getTranslatedString({ message, defaultAnswer, validator }) {
    const locales = {
      en: {
        name: '🇬🇧 English',
        value: 'en',
      },
      da: {
        name: '🇩🇰 Dansk',
        value: 'da'
      },
      de: {
        name: '🇩🇪 Deutsch',
        value: 'de'
      },
      es: {
        name: '🇪🇸 España',
        value: 'es'
      },
      fr: {
        name: '🇫🇷 Français',
        value: 'fr'
      },
      it: {
        name: '🇮🇹 Italiano',
        value: 'it'
      },
      nl: {
        name: '🇳🇱 Nederlands',
        value: 'nl',
      },
      no: {
        name: '🇳🇴 Norsk',
        value: 'no'
      },
      sv: {
        name: '🇸🇪 Svenska',
        value: 'sv'
      }
    }

    let translations = {};

    async function addLocale(locale) {
      const answers =  await inquirer.prompt([
        {
          type: 'input',
          name: 'translated',
          message: `[${locale}] ${message}`,
          default: defaultAnswer || '',
          validate: validator || (input => {
            return input.length > 0;
          })
        },
        {
          type: 'confirm',
          name: 'more',
          message: 'Do you want to add another language?',
          default: false
        }
      ]);

      translations[locale] = answers.translated;
      // Remove already translated keys.
      delete locales[locale];

      if( answers.more ) {
        const chosenLanguage = await inquirer.prompt([
          {
            type: 'list',
            name: 'language',
            message: `Select the next locale to translate`,
            choices: Object.values(locales)
          }
        ]);

        if (Object.keys(locales).length === 0) {
          Log('No more supported languages to translate.');
          return;
        }
        await addLocale( chosenLanguage.language );
      } else {
        return;
      }
    }

    await addLocale('en'); // default call and start the recursive loop

    return translations;
  }

  async migrateToCompose() {
    if( await this._hasPlugin('compose') ) throw new Error('You already have the Compose plugin enabled, no need to run this command.');

    // Check if the current folder is a git repo. If it is, check for uncommitted changes.
    if ( await GitCommands.isGitInstalled() && await GitCommands.isGitRepo({path: this.path}) ) {
      if( await this._git.hasUncommittedChanges() )
        throw new Error('Please commit changes first!');
    }

    const appJson = await this._getAppJsonFromFolder( this.path );
    this._validateAppJson( appJson );

    let drivers = await this._getDrivers();
    if( appJson.flow ) {
      var appFlowJson = appJson.flow;
      // Delete the flow section from the app JSON.
      delete appJson.flow;
    }

    try {
      if ( !await fse.exists( this._homeyComposePath ) ) await mkdirAsync( this._homeyComposePath );
    } catch( err ) { console.log('Error creating folder', dir, err) }

    if( drivers && appJson.drivers ) {
      drivers.forEach(driver => {
        appJson.drivers.forEach(async driverObject => {
          if( driverObject.id === driver ) {
            // Create a driver Flow JSON object.
            let driverFlowJson = {};

            if( appFlowJson ) {
              FLOW_TYPES.forEach( type => {
                if( !appFlowJson[type] ) return // Return when this type is not found in the JSON.

                appFlowJson[type].forEach( flowCard => {
                  let removeThisFlow = false;

                  flowCard.args.forEach( (argument, index, flowCardArgs) => {
                    if( argument.type === 'device' ) {
                      const filteredArgument = querystring.parse(argument.filter);

                      // Check if the driver_id matches the current driver.
                      // If so, remove the arg  and add the Flowcard to the Flow JSON for this driver.
                      if( filteredArgument.driver_id === driver ) {
                        flowCardArgs.splice(index, 1);
                        if( driverFlowJson[type] ) {
                          driverFlowJson[type].push(flowCard);
                        } else {
                          driverFlowJson[type] = [ flowCard ];
                        }
                        removeThisFlow = true;
                      }
                    }

                    if( removeThisFlow ) {
                      appFlowJson[type] = appFlowJson[type].filter(filterFlowCard => {
                        return filterFlowCard !== flowCard;
                      });
                    }
                  });
                });
              });

              // If there are driver Flows write them to a JSON file.
              if (Object.keys(driverFlowJson).length > 0) {
                await writeFileAsync(
                  path.join( this.path, 'drivers', driver, 'driver.flow.compose.json'),
                  JSON.stringify( driverFlowJson, false, 2)
                );
                Log(`Created driver Flow compose file for ${driver}`);
              }
            }

            // Driver compose stuff
            delete driverObject.id //id Should not be in the compose driver JSON.
            await writeFileAsync(
              path.join( this.path, 'drivers', driver, 'driver.compose.json'),
              JSON.stringify( driverObject, false, 2)
            );
            Log(`Created driver compose file for ${driver}`);
          }
        });
      });

      // Delete the driver section from the app JSON.
      delete appJson.drivers;
    }

    // Flow seperation
    if( appFlowJson ){
      try {
        if ( !await fse.exists( path.join(this._homeyComposePath, 'flow') ) ) await mkdirAsync( path.join(this._homeyComposePath, 'flow') );
      } catch( err ) { console.log('Error creating folder', err) }

      FLOW_TYPES.forEach( async type => {
        if( !appFlowJson[type] ) return // Return when this type is not found in the JSON.

        try {
          if ( !await fse.exists( path.join(this._homeyComposePath, 'flow', type) ) ) await mkdirAsync( path.join(this._homeyComposePath, 'flow', type) );
        } catch( err ) { console.log('Error creating folder', err) }

        // Loop over all flow cards
        appFlowJson[type].forEach( async flowCard => {
          try {
            await writeFileAsync(
              path.join( this._homeyComposePath, 'flow', type, `${flowCard.id}.json` ),
              JSON.stringify( flowCard, false, 2 )
            );
            console.log(`Created Flow Card '${flowCard.id}.json'`);
          } catch( err ) { console.log('Error writing flow trigger JSON', err) }
        });
      });
    }

    // Handle custom capabilities
    if( appJson.capabilities ) {
      // Create capabilities folder
      try {
        if ( !await fse.exists( path.join(this._homeyComposePath, 'capabilities') ) ) await mkdirAsync( path.join(this._homeyComposePath, 'capabilities') );
      } catch( err ) { console.log('Error creating folder', err) }

      Object.entries(appJson.capabilities).forEach( async ([name, capability]) => {
        try {
          await writeFileAsync(
            path.join(this._homeyComposePath, 'capabilities', `${name.toLowerCase()}.json`),
            JSON.stringify(capability, false, 2)
          );
          Log(`Created Capability ${name}.json`);
        } catch( err ) { console.log('Error writing Capability json', err) }
      });

      delete appJson.capabilities;
    }

    if( appJson.discovery ) {
      try {
        if ( !await fse.exists( path.join(this._homeyComposePath, 'discovery') ) ) await mkdirAsync( path.join(this._homeyComposePath, 'discovery') );
      } catch( err ) { console.log('Error creating folder', err) }

      Object.entries(appJson.discovery).forEach( async ([name, strategy]) => {
        try {
          await writeFileAsync(
            path.join(this._homeyComposePath, 'discovery', `${name.toLowerCase()}.json`),
            JSON.stringify(strategy, false, 2)
          );
          Log(`Created Discovery ${name}.json`);
        } catch( err ) { console.log('Error writing Discovery json', err) }
      })

      // Remove the discovery section from the app JSON.
      delete appJson.discovery;
    }

    try {
      await writeFileAsync(
        path.join(this._homeyComposePath, 'app.json'),
        JSON.stringify(appJson, false, 2)
      );
    } catch( err ) { console.log('Error writing app.json', err) }

    await this.addPlugin('compose');

    Log(colors.green(`✓ Successfully migrated app ${appJson.id} to compose`));

  }

  async _askComposeMigration() {
    let answers = await inquirer.prompt(
      {
        type: 'confirm',
        name: 'switch_compose',
        message: 'The Homey compose plugin is not detected. Do you want to use Homey compose? It will split the app.json file into separate files for Drivers, Flow Cards and Discovery Strategies.'
      }
    )

    return answers.switch_compose;
  }

	async createDriver() {
		const appJson = await this._getAppJsonFromFolder();
		if (appJson) {
			this._isValidAppJson(appJson);
		} else return;

		const driverName = await App._getTranslatedString( {
			message: 'What is your Driver\'s Name?'
		} );

		let answers = await inquirer.prompt([].concat(
			[
				{
					type: 'input',
					name: 'id',
					message: 'What is your Driver\'s ID?',
					default: () => {
						let name = driverName.en; // Always use the en name to create a driver id
							name = name.toLowerCase();
							name = name.replace(/ /g, '-');
							name = name.replace(/[^0-9a-zA-Z-_]+/g, '');
						return name;
					},
					validate: async input => {
						if( input.search(/^[a-zA-Z0-9-_]+$/) === -1 )
							throw new Error('Invalid characters: only use [a-zA-Z0-9-_]');

            if( await fse.exists( path.join(this.path, 'drivers', input) ) )
              throw new Error('Driver directory already exists!');

            return true;
          }
        },
        {
          type: 'list',
          name: 'class',
          message: 'What is your Driver\'s Device Class?',
          choices: () => {
            let classes = HomeyLibDevice.getClasses();
            return Object.keys(classes)
              .sort(( a, b ) => {
                a = classes[a];
                b = classes[b];
                return a.title.en.localeCompare( b.title.en )
              })
              .map( classId => {
                return {
                  name: classes[classId].title.en + colors.grey(` (${classId})`),
                  value: classId,
                }
              })
          }
        },
        {
          type: 'checkbox',
          name: 'capabilities',
          message: 'What are your Driver\'s Capabilities?',
          choices: () => {
            let capabilities = HomeyLibDevice.getCapabilities();
            return Object.keys(capabilities)
              .sort(( a, b ) => {
                a = capabilities[a];
                b = capabilities[b];
                return a.title.en.localeCompare( b.title.en )
              })
              .map( capabilityId => {
                let capability = capabilities[capabilityId];
                return {
                  name: capability.title.en + colors.grey(` (${capabilityId})`),
                  value: capabilityId,
                }
              })
          }
        },
      ],

      // TODO pair

			AppPluginZwave.createDriverQuestions(),
			AppPluginZigbee.createDriverQuestions(),
			AppPluginRF.createDriverQuestions(),
			[
				{
					type: 'confirm',
					name: 'createDiscovery',
					default: false,
					message: 'Do you want to create a Discovery strategy to find your device automatically in the IP network?'
				},
			],
			[
				{
					type: 'confirm',
					name: 'confirm',
					message: 'Seems good?'
				}
			]
		));

    if( !answers.confirm ) return;

		let driverId = answers.id;
		let driverPath = path.join( this.path, 'drivers', driverId );
		let driverJson = {
			id: driverId,
			name: driverName,
			class: answers.class,
			capabilities: answers.capabilities,
			images: {
				large: `/drivers/${driverId}/assets/images/large.png`,
				small: `/drivers/${driverId}/assets/images/small.png`,
			},
		}

		await fse.ensureDir( driverPath );
		await fse.ensureDir( path.join(driverPath, 'assets') );
		await fse.ensureDir( path.join(driverPath, 'assets', 'images') );

    let templatePath = path.join(__dirname, '..', '..', 'assets', 'templates', 'app', 'drivers');
    await copyFileAsync( path.join(templatePath, 'driver.js'), path.join(driverPath, 'driver.js') );
    await copyFileAsync( path.join(templatePath, 'device.js'), path.join(driverPath, 'device.js') );

    if( answers.isZwave ) {
      await AppPluginZwave.createDriver({
        driverId,
        driverPath,
        answers,
        driverJson,
        app: this,
      });
    }

    if( answers.isZigbee ) {
      await AppPluginZigbee.createDriver({
        driverId,
        driverPath,
        answers,
        driverJson,
        app: this,
      });
    }

    if( answers.isRf ) {
      await AppPluginRF.createDriver({
        driverId,
        driverPath,
        answers,
        driverJson,
        app: this,
      });
    }

		let hasCompose = await this._hasPlugin('compose');
		if( hasCompose ) {
			if( answers.createDiscovery === true ) {
				await this.createDiscoveryStrategy();
			}

      if( driverJson.settings ) {
        let driverJsonSettings = driverJson.settings;
        delete driverJson.settings;
        await writeFileAsync( path.join(driverPath, 'driver.settings.compose.json'), JSON.stringify(driverJsonSettings, false, 2) );
      }

      if( driverJson.flow ) {
        let driverJsonFlow = driverJson.flow;
        delete driverJson.flow;
        await writeFileAsync( path.join(driverPath, 'driver.flow.compose.json'), JSON.stringify(driverJsonFlow, false, 2) );
      }

      await writeFileAsync( path.join(driverPath, 'driver.compose.json'), JSON.stringify(driverJson, false, 2) );

    } else {
      let appJsonPath = path.join(this.path, 'app.json');
      let appJson = await readFileAsync( appJsonPath );
        appJson = appJson.toString();
        appJson = JSON.parse(appJson);
        appJson.drivers = appJson.drivers || [];
        appJson.drivers.push( driverJson );

      await writeFileAsync( appJsonPath, JSON.stringify(appJson, false, 2) );
    }

    Log(colors.green(`✓ Driver created in \`${driverPath}\``));

  }

  async changeDriverCapabilities() {
    let hasCompose = await this._hasPlugin('compose');
    if( !hasCompose ) {
      if( await this._askComposeMigration() ) {
        await this.migrateToCompose();
      } else {
        throw new Error("This command requires the compose plugin to be enabled!");
      }
    }

    let drivers = await this._getDrivers();

    const selectedDriverAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'driverId',
        message: 'For which driver do you want to change the capabilities?',
        choices: () => {
          return drivers;
        }
      }
    ]);

    const driverJsonPath = path.join(this.path, 'drivers', selectedDriverAnswer.driverId, 'driver.compose.json');

    let driverJson;
    try {
      driverJson = await readFileAsync( driverJsonPath, 'utf8' );
      driverJson = JSON.parse( driverJson );
    } catch( err ) {
      if( err.code === 'ENOENT' )
        throw new Error(`Could not find a valid driver.compose JSON at \`${driverJsonPath}\``);

      throw new Error(`Error in \`driver.compose.json.json\`:\n${err}`);
    }

    Log(`Current Driver capabilities: ${driverJson.capabilities}`);

    const capabilitesAnswers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'capabilities',
        message: 'What are your Driver\'s Capabilities?',
        choices: () => {
          let capabilities = HomeyLibDevice.getCapabilities();
          return Object.keys(capabilities)
            .sort(( a, b ) => {
              a = capabilities[a];
              b = capabilities[b];
              return a.title.en.localeCompare( b.title.en )
            })
            .map( capabilityId => {
              let capability = capabilities[capabilityId];
              return {
                name: capability.title.en + colors.grey(` (${capabilityId})`),
                value: capabilityId,
              }
            })
        },
        default: driverJson.capabilities
      }
    ]);

    // Since we've used the existing capabilities as a default and therefore loaded them into the array,
    // we can just overwrite the capabilities array in the JSON
    driverJson.capabilities = capabilitesAnswers.capabilities;

    await writeFileAsync( driverJsonPath, JSON.stringify(driverJson, false, 2) );

    Log(colors.green(`✓ Driver capabilities updated for \`${driverJson.id}\``));
  }

  async createDriverFlow() {
    let drivers = await this._getDrivers();

    const driverFlowAnswers = await inquirer.prompt([
      {
        type: 'list',
        name: 'driverId',
        message: 'For which driver do you want to create a Flow?',
        choices: () => {
          return drivers;
        }
      }
    ]);
    const chosenDriver = driverFlowAnswers.driverId;

    let flowJson = await this.createFlowJson();

    const flowPath = path.join(this.path, 'drivers', chosenDriver, 'driver.flow.compose.json');

    let driverFlowJson;
    try {
      driverFlowJson = await readFileAsync( flowPath, 'utf8' );
      driverFlowJson = JSON.parse( driverFlowJson );
    } catch( err ) {
      if( err.code === 'ENOENT' )	{
        driverFlowJson = {}; // File not found so init empty JSON
      } else {
        throw new Error(`Error in \`driver.flow.compose.json.\`:\n${err}`);
      }
    }

    const flowType = flowJson.type;
    delete flowJson.type;

    // Check if the chosen flow type entry is available
    driverFlowJson[flowType] = driverFlowJson[flowType] || [];

    driverFlowJson[flowType].push(flowJson);

    await writeFileAsync( flowPath, JSON.stringify(driverFlowJson, false, 2) );

    Log(colors.green(`✓ Driver Flow created in \`${flowPath}\``));
  }

  async createFlowJson() {
    const appJson = await this._getAppJsonFromFolder();
    if( appJson ) {
      this._validateAppJson(appJson);
    }

    let hasCompose = await this._hasPlugin('compose');
    if( !hasCompose ) {
      if( await this._askComposeMigration() ) {
        await this.migrateToCompose();
      } else {
        throw new Error("This command requires the compose plugin to be enabled!");
      }
    }

    const flowFolder = path.join(this.path, '.homeycompose', 'flow');

    const translatedStrings = {
      title: await App._getTranslatedString({ message: 'What is the title of your Flow Card?' }),
      hint: await App._getTranslatedString({ message: 'What is the hint for your Flow Card' }),
    }

    let answers = await inquirer.prompt([].concat(
      [
        {
          type: 'list',
          name: 'type',
          message: 'What is the type of your Flow card?',
          choices: () => {
            return [
              {
                name: "Trigger (When)",
                value: "triggers"
              },
              {
                name: "Condition (And)",
                value: "conditions"
              },
              {
                name: "Action (Then)",
                value: "actions"
              }
            ]
          }
        },

        {
          type: 'input',
          name: 'id',
          message: 'What is the ID of your Flow Card?',
          default: () => {
            let name = translatedStrings.title.en;
            name = name.toLowerCase();
            name = name.replace(/ /g, '-');
            name = name.replace(/[^0-9a-zA-Z-_]+/g, '');
            return name;
          },
          validate: async input => {
            if( input.search(/^[a-zA-Z0-9-_]+$/) === -1 )
              throw new Error('Invalid characters: only use [a-zA-Z0-9-_]');

            // Check if the flow entry already exists in the .homeycompose/flow folder
            if( await fse.exists( path.join(flowFolder, 'triggers', `${input}.json` ) ) ||
              await fse.exists( path.join(flowFolder, 'conditions', `${input}.json` ) ) ||
              await fse.exists( path.join(flowFolder, 'actions', `${input}.json` ) )
            )

              throw new Error('Flow already exists!');

            return true;
          }
        }
      ]
    ));

    const useArgs = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'using_arguments',
        message: 'Do you want to use arguments for this Flow Card?',
        default: false
      }
    ]);

    let flowArgs = [];
    if ( useArgs.using_arguments ) {
      // recursive function to add arguments to the flow.
      async function addArgument() {
        const argumentStrings = {
          placeholder: await App._getTranslatedString({ message: 'Enter the placeholder for the argument' })
        }

        let argumentAnswers =  await inquirer.prompt([
          {
            type: 'list',
            name: 'type',
            message: 'What is the type of the argument?',
            choices: () => {
              return [
                {
                  name: "Text",
                  value: "text"
                },
                {
                  name: "Number",
                  value: "number"
                },
                {
                  name: "Autocomplete",
                  value: "autocomplete"
                },
                {
                  name: "Range",
                  value: "range"
                },
                {
                  name: "Date",
                  value: "date"
                },
                {
                  name: "Time",
                  value: "time"
                },
                {
                  name: "Dropdown",
                  value: "dropdown"
                },
                {
                  name: "Color",
                  value: "color"
                },
                {
                  name: "Droptoken",
                  value: "droptoken"
                }
              ]
            }
          },
          {
            type: 'input',
            name: 'name',
            message: 'What is the name of your argument?',
            validate: async input => {
              if( input.search(/^[a-zA-Z0-9-_]+$/) === -1 )
                throw new Error('Invalid characters: only use [a-zA-Z0-9-_]');

              return true;
            }
          }
        ]);

        const addMore = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'more',
            message: 'Add more arguments?'
          }
        ]);

        // Create a custom object to inject en flag for the placeholder.
        flowArgs.push({
          type: argumentAnswers.type,
          name: argumentAnswers.name,
          placeholder: argumentStrings.placeholder,
        });

        if( addMore.more ) {
          await addArgument();
        } else {
          return;
        }
      }

      await addArgument();
    }

    const useTokens = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'using_tokens',
        message: 'Do you want to use tokens for this Flow Card?',
        default: false
      }
    ]);

    let flowTokens = [];
    if( useTokens.using_tokens ) {
      async function addToken() {
        const tokenStrings = {
          title: await App._getTranslatedString({ message: 'Enter the user title of your token' }),
          example: await App._getTranslatedString({ message: 'Give a brief example of what your token can provide' }),
        }

        let tokenAnswers =  await inquirer.prompt([].concat(
          [
            {
              type: 'list',
              name: 'type',
              message: 'What is the type of the token?',
              choices: () => {
                return [
                  {
                    name: "Text",
                    value: "string"
                  },
                  {
                    name: "Number",
                    value: "number"
                  },
                  {
                    name: "Boolean",
                    value: "boolean"
                  },
                  {
                    name: "Image",
                    value: "image"
                  }
                ]
              }
            },
            {
              type: 'input',
              name: 'name',
              message: 'What the name of your token?',
              validate: async input => {
                if( input.search(/^[a-zA-Z0-9-_]+$/) === -1 )
                  throw new Error('Invalid characters: only use [a-zA-Z0-9-_]');

                return true;
              }
            }
          ]
        ));

        const addMore = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'more',
            message: 'Add more tokens?'
          }
        ]);

        flowTokens.push({
          type: tokenAnswers.type,
          name: tokenAnswers.name,
          title: tokenStrings.title,
          example : tokenStrings.example,
        });

        if( addMore.more ) {
          await addToken();
        } else {
          return;
        }
      }

      await addToken();
    }

    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Seems good?'
      }
    ]);

    if( !confirm ) return;

    let flowJson = {
      type: answers.type,
      id: answers.id,
      title: translatedStrings.title,
      hint: translatedStrings.hint,
    }

    if( useArgs.using_arguments ) {
      Object.assign(flowJson, flowJson,
        {
          args: flowArgs
        }
      );
    }

    if( useTokens.using_tokens ) {
      Object.assign(flowJson, flowJson,
        {
          tokens: flowTokens
        }
      )
    }

    return flowJson;
  }

  async createFlow() {
    let flowJson = await this.createFlowJson();

    if( !flowJson ) throw new Error('Could not create valid Flow');

    const flowFolder = path.join(this.path, '.homeycompose', 'flow');
    const flowPath = path.join(this.path, '.homeycompose', 'flow', flowJson.type);

    // Delete roperty 'type' from the Flow JSON because it's not needed.
    delete flowJson.type;

    // Check if the folder already exists, if not create it
    if ( !await fse.exists( flowFolder ) ) await mkdirAsync( flowFolder );
    if ( !await fse.exists( flowPath ) ) await mkdirAsync( flowPath );

    await writeFileAsync( path.join(flowPath, `${flowJson.id}.json`), JSON.stringify(flowJson, false, 2) );

    Log(colors.green(`✓ Flow created in \`${flowPath}\``));
  }

  async createDiscoveryStrategy() {
    const appJson = await this._getAppJsonFromFolder();
    if( appJson ) {
      this._validateAppJson(appJson);
    }

    let hasCompose = await this._hasPlugin('compose');
    if( !hasCompose ) {
      if( await this._askComposeMigration() ) {
        await this.migrateToCompose();
      } else {
        throw new Error("This command requires the compose plugin to be enabled!");
      }
    }

    const discoveryPath = path.join(this.path, '.homeycompose', 'discovery');
    const discoveryBase = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'What is your Discovery strategy ID?',
          validate: async input => {
            input.replace(/[^0-9a-zA-Z-_]+/g, '');
            if( input.search(/^[a-zA-Z0-9-_]+$/) === -1 )
              throw new Error('Invalid characters: only use [a-zA-Z0-9-_]');

            if( await fse.exists( path.join(discoveryPath, `${input}.json` ) ) ) {
              throw new Error('Discovery strategy already exists!');
            }

            return true;
          }
        },
        {
          type: 'list',
          name: 'type',
          message: 'What is the type of your Discovery strategy?',
          choices: () => {
            return [
              {
                name: 'mDNS-SD',
                value: 'mdns-sd'
              },
              {
                name: 'SSDP',
                value: 'ssdp'
              },
              {
                name: 'MAC Address range',
                value: 'mac'
              }
            ]
          }
        }
      ]
    );

    // Create new questions based on the Discovery type selected
    let discoveryJson;
    let answers;
    switch( discoveryBase.type ) {
      case 'mdns-sd':
        answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: 'What is the name of the mDNS query?',
            validate: input => {
              return input.length > 0;
            }
          },
          {
            type: 'list',
            name: 'protocol',
            message: 'What is the protocol of your mDNS query?',
            choices: [ "tcp", "udp"	]
          },
          {
            type: 'input',
            name: 'id',
            message: 'What is the indentifier to indentify the device? For example, \'name\' or \'txt.id\'',
            validate: input => {
              return input.length > 0;
            }
          },
        ]);

        if( !answers.id.startsWith('{{') && !answers.id.endsWith('}}') ) {
          answers.id = `{{${answers.id}}}`;
        }

        discoveryJson = {
          type: 'mdns-sd',
          'mdns-sd': {
            name: answers.name,
            protocol: answers.protocol
          },
          id: answers.id,
        }

        break;
      case 'ssdp':
        answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'search',
            message: 'What is the search scheme?',
            validate: input => {
              return input.length > 0;
            }
          },
          {
            type: 'input',
            name: 'id',
            message: 'What is the indentifier to indentify the device? For example, \'name\' or \'headers.usn\'',
            validate: input => {
              if( input.search(/^[a-zA-Z0-9-_]+$/) === -1 ) throw new Error('Invalid characters: only use [a-zA-Z0-9-_]');
            }
          },
        ]);

        discoveryJson = {
          type: 'ssdp',
          ssdp: {
            name: answers.name,
            search: answers.search
          },
          id: `{{${answers.id}}}`
        }

        break;
      case 'mac':
        // All added MAC addresses from the addMacAddress recursive function will be stored in this array.
        let macAddresses = [];

      function parseMacToDecArray(macAddress) {
        let mac = [];
        macAddress
          .slice(0,8)
          .split(':') // TODO - is also a valid MAC address seperator
          .forEach( macByte => mac.push( parseInt(macByte, 16) ) );

        return mac;
      }

        // Recursive function to input, parse and store MAC addresses.
      async function addMacAddress() {
        answers = await inquirer.prompt([
          {
            type: 'input',
            name: 'mac',
            message: 'Enter a full MAC address or the first three bytes',
            validate: async input => {
              if( input.length === 17 && input.search(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/) === 0 ) return true;
              if( input.length === 8 && input.search(/^([0-9A-Fa-f]{2}[:-]){2}([0-9A-Fa-f]{2})$/) === 0 ) return true;

              return false;
            }
          },
          {
            type: 'confirm',
            name: 'more',
            message: 'Add more MAC addresses?'
          }
        ]);

        // Parse and store the address
        macAddresses.push( parseMacToDecArray( answers.mac ) );

        // If the user wants to add more addresses, call this function again.
        if( answers.more ) {
          await addMacAddress();
        } else {
          return;
        }
      }

        await addMacAddress();

        if( macAddresses.length < 1) return;

        discoveryJson = {
          type: 'mac',
          mac: {
            manufacturer: macAddresses
          }
        }

        break;
    }

    const confirmCreate = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Seems good?'
      }
    ]);

    if( !confirmCreate.confirm ) return;

    // Check if the folder already exists, if not create it
    if ( !await fse.exists( discoveryPath ) ) await mkdirAsync( discoveryPath );

    await writeFileAsync( path.join(discoveryPath, `${discoveryBase.title}.json`), JSON.stringify(discoveryJson, false, 2) );

    Log(colors.green(`✓ Discovery strategy created in \`${discoveryPath}\``));

  }

  static async create({ appPath }) {

    let stat = await statAsync( appPath );
    if( !stat.isDirectory() )
      throw new Error('Invalid path, must be a directory');

    let localizedProperties = {
      name: await App._getTranslatedString({ message: 'What is your app\'s name?', defaultAnswer: 'My App' }),
      description: await App._getTranslatedString({ message: 'What is your app\'s description?', defaultAnswer: 'Adds support for MyBrand devices.'})
    }

		let answers = await inquirer.prompt([
			{
				type: 'input',
				name: 'id',
				message: 'What is your app\'s unique ID?',
				default: 'com.athom.myapp',
				validate: input => {
					return HomeyLibApp.isValidId( input );
				}
			},
			{
				type: 'list',
				name: 'category',
				message: 'What is your app\'s category?',
				choices: HomeyLibApp.getCategories()
			},
			{
				type: 'input',
				name: 'version',
				message: 'What is your app\'s version?',
				default: '1.0.0',
				validate: input => {
					return semver.valid(input) === input;
				}
			},
			{
				type: 'input',
				name: 'compatibility',
				message: 'What is your app\'s compatibility?',
				default: '>=1.5.0',
				validate: input => {
					return semver.validRange(input) !== null;
				}
			},
			{
				type: 'confirm',
				name: 'compose',
				message: 'Use Homey compose plugin?'
			},
			{
				type: 'confirm',
				name: 'license',
				message: 'Use standard license for Homey Apps (GPL3)?'
			},
			{
				type: 'confirm',
				name: 'confirm',
				message: 'Seems good?'
			}
		]);

    if( !answers.confirm ) return;

    const appJson = {
      id: answers.id,
      version: answers.version,
      compatibility: answers.compatibility,
      sdk: 2,
      name: localizedProperties.name,
      description: localizedProperties.description,
      category: [ answers.category ],
      permissions: [],
      images: {
        large: '/assets/images/large.png',
        small: '/assets/images/small.png'
      }
    }

    try {
      let profile = await AthomApi.getProfile();
      appJson.author = {
        name: `${profile.firstname} ${profile.lastname}`,
        email: profile.email
      }
    } catch( err ) {}

    appPath = path.join( appPath, appJson.id );

    try {
      let stat = await statAsync( appPath );
      throw new Error(`Path ${appPath} already exists`);
    } catch( err ) {
      if( err.code === undefined ) throw err;
    }

    // make dirs
    const dirs = [
      '',
      'locales',
      'drivers',
      'assets',
      path.join('assets', 'images'),
    ];

    // Append the homeycompose dir if used
    if( answers.compose ) {
      dirs.push( '.homeycompose' );
      dirs.push( path.join('.homeycompose', 'flow') );
      dirs.push( path.join('.homeycompose', 'drivers') );
    }

    for( let i = 0; i < dirs.length; i++ ) {
      let dir = dirs[i];
      try {
        await mkdirAsync( path.join(appPath, dir) );
      } catch( err ) {
        Log( err );
      }
    }

		await writeFileAsync( path.join(appPath, 'app.json'), JSON.stringify(appJson, false, 2) );
		await writeFileAsync( path.join(appPath, 'locales', 'en.json'), JSON.stringify({}, false, 2) );
		await writeFileAsync( path.join(appPath, 'app.js'), '' );
		await writeFileAsync( path.join(appPath, 'README.md'), `# ${appJson.name.en}\n\n${appJson.description.en}` );
		await writeFileAsync( path.join(appPath, 'README.txt'), `${appJson.description.en}\n`);

		// i18n pre-support
		// TODO check if this works after creating i18n inquirer stuff
		if( appJson.description.nl ) {
			await writeFileAsync( path.join(appPath, 'README.nl.txt'), `${appJson.description.nl}\n`);
		}

    // copy files
    const templatePath = path.join(__dirname, '..', '..', 'assets', 'templates', 'app');
    const files = [
      'app.js',
      path.join('assets', 'icon.svg'),
    ]

    if( answers.license ) {
      files.push('LICENSE');
      files.push('CODE_OF_CONDUCT.md');
      files.push('CONTRIBUTING.md');
    }

    for( let i = 0; i < files.length; i++ ) {
      let file = files[i];
      try {
        await copyFileAsync( path.join(templatePath, file), path.join( appPath, file ) );
      } catch( err ) {
        Log( err );
      }
    }

    // Now the ap files has been created, we can create a App instance and use that to add plugins.
    if( answers.compose ) {
      const app = new App( appPath );
      app.addPlugin( 'compose' );
    }

    // Create package lock
    const packageJson = {
      name: answers.id,
      version: answers.version,
      main: 'app.js',
    }

    await writeFileAsync( path.join(appPath, 'package.json'), JSON.stringify(packageJson, false, 2) );

    // Check if npm is available, then install homey as dev dependency
    const npmInstalled = await NpmCommands.isNpmInstalled();
    if (npmInstalled) {
      await NpmCommands.install({ saveDev: true, path: appPath }, {
        id: 'homey'
      });
    }

    const gitIgnore = "env.json\nnode_modules/";

    await writeFileAsync( path.join(appPath, '.gitignore'), gitIgnore.toString() );

    Log(colors.green(`✓ App created in \`${appPath}\``));

  }

}

module.exports = App;
