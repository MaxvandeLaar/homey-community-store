'use strict'

const util = require('util');
const _path = require('path');
const upath = require('upath');
const fse = require('fs-extra');
const colors = require('colors');
const npm = require('npm-programmatic');
const exec = util.promisify(require('child_process').exec);

const Log = require('../..').Log;

class NpmCommands {

  /**
   * Check if npm is installed. By using --version git will not exit with an error code
   */
  static async isNpmInstalled() {
    return true;
  }

  /**
   * Execute npm install for a given packageId or array of packageIds.
   * @param {boolean} [save=true] - npm --save flag
   * @param {boolean} [saveDev=false] - npm --save-dev flag
   * @param {string} [path=process.cwd()] - Current working directory where npm install should be executed.
   * @param {string|Array<String>|Array<Object<{id:String, version:String}>>} packageIds - Package (or packages if Array) that should be installed (e.g. 'request' or 'request@1.2.3'.
   * @returns {Promise<void>}
   */
  static async install({ save = true, saveDev = false, path = process.cwd() }, packageIds) {
    if (!(packageIds instanceof Array)) packageIds = [packageIds]; // Wrap in array if needed
    if (typeof path !== 'string') throw new TypeError('expected_path_string');

    // Convert Array of objects to strings
    packageIds = packageIds.map(packageId => {
      if (typeof packageId === 'string') {
        return packageId;
      } else if (Object.prototype.hasOwnProperty.call(packageId, 'id')
        && typeof packageId.id === 'string'
        && Object.prototype.hasOwnProperty.call(packageId, 'version')
        && typeof packageId.version === 'string') {
        return `${packageId.id}@${packageId.version}`;
      } else if (Object.prototype.hasOwnProperty.call(packageId, 'id')
        && typeof packageId.id === 'string') {
        return `${packageId.id}`;
      }
    });

    // Build log string based on provided packageIds
    let packageIdLogStrings = '';
    packageIds.forEach((packageId, i) => packageIdLogStrings += `${i >= 1 ? ', ' : ''}${packageId}`);
    let logString = `✓ Installing ${saveDev ? 'npm dev' : 'npm'} package${packageIds.length > 1 ? 's' : ''} (${packageIdLogStrings})`;
    Log(colors.green(logString));

    // Install packageIds
    await fse.ensureDir(_path.join(path, 'node_modules'));

    // Specify install options
    const installOpts = { cwd: path };

    // Add saveDev or save flag
    if (saveDev) installOpts.saveDev = true;
    else if (save) installOpts.save = true;

    // Install
    await npm.install(packageIds, installOpts);
    Log(colors.green(`✓ Installation complete`));
  }

  /**
   * Execute npm prune and parse the JSON response. Pick the required properties and return an array of paths to be pruned.
   * @param {string} path
   * @returns {Promise<string[]>}
   */
  static async getPrunePaths({ path }) {
    const npmInstalled = await NpmCommands.isNpmInstalled();
    if (!npmInstalled) {
      Log(colors.red('✖ Could not execute npm prune, please install npm globally'));
      return []; // Return empty array to be safe
    }

    try {
      // Perform prune dry run and parse the JSON response
      const { stdout } = await exec(`npm prune --production --dry-run --json`, { cwd: path });
      const prunePathsJson = JSON.parse(stdout);
      const prunePaths = prunePathsJson.removed.map(pruneObject => upath.normalize(pruneObject.path) + upath.sep);
      return prunePaths;
    } catch (err) {
      Log(colors.red('✖ Error occurred during npm prune', err));
      return [];
    }
  }

  static async listModules({ path }) {
    const npmInstalled = await NpmCommands.isNpmInstalled();
    if (!npmInstalled) {
      Log(colors.red('✖ Could not execute npm list, please install npm globally'));
      return false; // Return false to be safe
    }

    try {
      const { err, stdout } = await exec('npm list', { cwd: path });
      return true
    } catch (err) {
      return false
    }
  }
}

module.exports = NpmCommands;
