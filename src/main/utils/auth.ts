import {ipcMain} from 'electron';

const AthomApi = require('../homey').AthomApi;
const AthomSettings = require('../homey').Settings;
import {info, debug, error} from 'electron-log';
import {Profile} from "../../interfaces/Profile";
import fetch from "node-fetch";
export const apiKey = 'SDWbf1vtYq4qwOgl69uk693GqJgCrnez6PndlePL';

ipcMain.on('sign-in', async (event) => {
  info('Sign in user');
  let profile: any;
  let activeHomey = null;
  AthomApi._api = null;
  try {
    debug('Initialising Athom API');
    await AthomApi._initApi();
    profile = await getProfile();
    debug('Initialising Athom APi finished');
    debug('Set active Homey');
    activeHomey = await getActiveHomey(profile).catch(error);
  } catch (err) {
    error(err);
    event.reply('error', {error: err});
  }
  const authenticated = !!profile;
  event.reply('sign-in-complete', {authenticated, profile, activeHomey});
});

ipcMain.on('sign-out', (event, args) => {
  info('Sign out user');
  AthomApi._api.logout();
  AthomApi._api = null;
  AthomApi.logout();
  AthomApi._activeHomey = null;
  AthomSettings.set('activeHomey', null);
  info('Sign out user success');
  event.reply('sign-out-complete');
});

ipcMain.on('authentication-check', async (event) => {
  info('Check if the user is signed in');
  if (!AthomApi._api) {
    AthomApi._createApi();
  }
  const authenticated = await AthomApi._api.isLoggedIn();
  info('Check if user is authenticated');
  const profile = authenticated ? await getProfile() : null;
  debug('Set active Homey');
  const activeHomey = await getActiveHomey(profile).catch(error);
  info('Check user authenticated completed');
  debug('User authenticated', {authenticated, profile, activeHomey});
  event.reply('authentication-check-complete', {authenticated, profile, activeHomey});
});

ipcMain.on('set-homey', async (event, args) => {
  info('Set active Homey');
  const homey = args.homey;
  try {
    await AthomApi.setActiveHomey(homey);
    const activeHomey = AthomApi._activeHomey || await AthomSettings.get('activeHomey');
    info('Active Homey set');
    debug('New active Homey', activeHomey);
    event.reply('set-homey-complete', {homey: activeHomey});
  } catch (e) {
    error(e);
    event.reply('error', {error: e});
  }
});

async function getActiveHomey(profile: Profile){
  let activeHomey = AthomApi._activeHomey || await AthomSettings.get('activeHomey');
  if (profile && !activeHomey) {
    if (profile.homeys.length > 0) {
      await AthomApi.setActiveHomey(profile.homeys[0]).catch(error);
    }
  }
  return AthomApi._activeHomey || await AthomSettings.get('activeHomey');
}

function getProfile(){
  return AthomApi.getProfile();
}

export async function apiAccess(): Promise<any> {
  return new Promise((resolve, reject) => {
    fetch('https://4c23v5xwtc.execute-api.eu-central-1.amazonaws.com/production/auth', {
      headers: {
        'x-api-key': apiKey
      }
    })
      .then(res => res.json()) // expecting a json response
      .then((res) => {
        resolve({credentials: {
            accessKeyId: res.body.k.a,
            secretAccessKey: res.body.k.b
          }});
      })
      .catch(reject);
  });
}
