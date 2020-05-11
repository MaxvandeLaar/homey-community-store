/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import {ipcRenderer, shell} from 'electron';
import React, {useEffect, useState} from 'react';
import * as ReactDOM from 'react-dom';
import TopBar from "./components/TopBar/TopBar";
import Content from "./components/Content/Content";
import {library} from '@fortawesome/fontawesome-svg-core'
import {faAsterisk, faDownload, faSignInAlt, faSpinner} from '@fortawesome/free-solid-svg-icons'
import './style/style.scss';
import {Container, Row, Col} from 'react-bootstrap';

library.add(faDownload, faSignInAlt, faSpinner, faAsterisk);

ipcRenderer.once('check-for-update-completed', (event, data) => {
  console.log('VERSION CHECK RESPONSE', data);

  const result = confirm('Update for the community store is available! Please download the update from github!');
  if (result === true) {
    shell.openExternal('https://github.com/MaxvandeLaar/homey-community-store/releases');
  }
});
ipcRenderer.send('check-for-update');

ReactDOM.render(<AppContainer />, document.getElementById('root'));

function AppContainer() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [activeHomey, setActiveHomey] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {


    if (Notification.permission !== "denied") {
      Notification.requestPermission().then(function (permission) {

      });
    }

    if (!loggedIn || !userProfile) {
      isAuthenticated();
    }
  }, [loggedIn, userProfile, activeHomey]);


  function isAuthenticated() {
    ipcRenderer.once('user-authenticated', (event, {loggedIn, profile, activeHomey}) => {
      setLoggedIn(loggedIn);
      if (loggedIn && profile) {
        setUserProfile(profile);
        console.log('Profile', profile);
      }
      if (loggedIn && activeHomey) {
        setActiveHomey(activeHomey);
      }
    });
    ipcRenderer.send('is-user-authenticated');
  }

  function loginUser() {
    ipcRenderer.once('user-logged-in', (event, args) => {
      isAuthenticated();
    });
    ipcRenderer.send('login-user');
  }

  function changeSearchValue(value: string) {
    setSearchValue(value);
  }

  return (
    <>
      <TopBar loggedIn={loggedIn} searchValueChange={changeSearchValue} loginFunc={loginUser}
              profile={userProfile}
              activeHomey={activeHomey}
      />
      <Container className={'mt-5'}>
        <Content loggedIn={loggedIn} searchValue={searchValue} />
      </Container>
    </>

  );
}
