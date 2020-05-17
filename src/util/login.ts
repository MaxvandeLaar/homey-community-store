import {ipcMain} from 'electron';

const AthomApi = require('homey').AthomApi;
const AthomSettings = require('homey').Settings;
import log from 'electron-log';

ipcMain.on('login-user', async (event, args) => {
  AthomApi._api = null;
  log.info('Login user');
  try {
    log.debug('Initialising Athom API');
    await AthomApi._initApi();
    log.info('User login success');
  } catch (e) {
    log.error(e);
    event.reply('error', {title: e.name, message: e.message});
  }
  event.reply('user-logged-in');
});

ipcMain.on('logout-user', (event, args) => {
  log.info('Logout user');
  AthomApi._api.logout();
  AthomApi._api = null;
  AthomApi.logout();
  AthomApi._activeHomey = null;
  AthomSettings.set('activeHomey', null);
  log.info('Logout user success');
  event.reply('user-logged-out');
});

ipcMain.on('is-user-authenticated', async (event, args) => {
  log.info('Is user authenticated?');
  if (!AthomApi._api) {
    AthomApi._createApi();
  }
  const loggedIn = await AthomApi._api.isLoggedIn();
  log.info('Check if user is authenticated');
  const profile = loggedIn ? await getProfile() : null;
  log.debug('Set active Homey');
  let activeHomey = AthomApi._activeHomey || await AthomSettings.get('activeHomey');
  if (profile && !activeHomey) {
    if (profile.homeys.length > 0) {
      await AthomApi.setActiveHomey(profile.homeys[0]).catch(log.error);
    }
  }
  activeHomey = AthomApi._activeHomey || await AthomSettings.get('activeHomey');
  log.info('Check user authenticated completed');
  log.debug('User authenticated', {loggedIn, profile, activeHomey});
  event.reply('user-authenticated', {loggedIn, profile, activeHomey});
});

ipcMain.on('set-active-homey', async (event, args) => {
  log.info('Set active Homey');
  const homey = args.homey;
  try {
    await AthomApi.setActiveHomey(homey);
    const activeHomey = AthomApi._activeHomey || await AthomSettings.get('activeHomey');
    log.info('Active Homey set');
    log.debug('New active Homey', activeHomey);
    event.reply('active-homey-set', {homey: activeHomey});
  } catch (e) {
    log.error(e);
    event.reply('error', {title: e.name, message: e.message});
  }
});

async function getProfile() {
  log.info('Getting user profile');
  return await AthomApi.getProfile();
}
