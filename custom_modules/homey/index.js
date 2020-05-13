'use strict';

const pkg = require('./package.json');
const figures = require('figures');
const log = require('electron-log');

module.exports.Log = (...props) => {
  console.log(figures(...props));
  log.info(...props);
};
module.exports.Settings = new (require('./lib/Settings'))();
module.exports.AthomApi = new (require('./lib/AthomApi'))();
module.exports.AthomMessage = new (require('./lib/AthomMessage'))();
module.exports.App = require('./lib/App');
module.exports.Animation = require('./lib/Animation');
