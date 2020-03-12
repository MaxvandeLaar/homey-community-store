import {ipcMain} from 'electron';
const AthomApi = require('homey').AthomApi;
const AthomSettings = require('homey').Settings;

ipcMain.on('login-user', async (event, args) => {
  AthomApi._api = null;
  await AthomApi._initApi();
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

ipcMain.on('is-user-authenticated', async (event, args) => {
  if (!AthomApi._api){
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

async function getProfile() {
  AthomApi._api = null;
  return await AthomApi.getProfile();
}
