import {ipcMain} from 'electron';

const AthomApi = require('homey').AthomApi;
const AthomSettings = require('homey').Settings;

ipcMain.on('login-user', async (event, args) => {
  AthomApi._api = null;
  try {
    await AthomApi._initApi();
  } catch (e) {
    event.reply('error', {title: e.name, message: e.message});
  }
  event.reply('user-logged-in');

  // console.log(await AthomApi.getProfile());
  // if (AthomApi._activeHomey || await AthomSettings.get('activeHomey')) {
  //   console.log('HOMEY SELECTED');
  //   console.log(await AthomApi.getActiveHomey());
  // } else {
  //   console.log('No Homey Select');
  //   console.log(await AthomApi.setActiveHomey({id: '5d9dce9b41973e0e7bea3ee8', name: 'Homey Pro van Max'}));
  // }
});

ipcMain.on('logout-user', (event, args) => {
  AthomApi._api.logout();
  AthomApi._api = null;
  AthomApi.logout();
  AthomApi._activeHomey = null;
  AthomSettings.set('activeHomey', null);
  event.reply('user-logged-out');
});

ipcMain.on('is-user-authenticated', async (event, args) => {
  if (!AthomApi._api) {
    AthomApi._createApi();
  }
  const loggedIn = await AthomApi._api.isLoggedIn();
  const profile = loggedIn ? await getProfile() : null;
  let activeHomey = AthomApi._activeHomey || await AthomSettings.get('activeHomey');
  if (profile && !activeHomey) {
    if (profile.homeys.length > 0) {
      await AthomApi.setActiveHomey(profile.homeys[0]);
    }
  }
  activeHomey = AthomApi._activeHomey || await AthomSettings.get('activeHomey');
  event.reply('user-authenticated', {loggedIn, profile, activeHomey});
});

ipcMain.on('set-active-homey', async (event, args) => {
  const homey = args.homey;
  try {
    await AthomApi.setActiveHomey(homey);
    const activeHomey = AthomApi._activeHomey || await AthomSettings.get('activeHomey');
    event.reply('active-homey-set', {homey: activeHomey});
  } catch (e) {
    console.error(e);
    event.reply('error', {title: e.name, message: e.message});
  }
});

async function getProfile() {
  // AthomApi._api = null;
  return await AthomApi.getProfile();
}
