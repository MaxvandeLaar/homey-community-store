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
import {version, author} from '../package.json';
import {Container, Row, Col} from 'react-bootstrap';
// @ts-ignore
import {alert, defaultModules, defaults, Stack} from '@pnotify/core';
// @ts-ignore
import * as PNotifyDesktop from '@pnotify/desktop/dist/PNotifyDesktop';
import {Homey} from './interfaces/Homey';

const myStack = new Stack({
  dir1: 'up',
  dir2: 'left',
  firstpos1: 25,
  firstpos2: 25,
  push: 'top',
  maxStrategy: 'close',
  maxOpen: 1,
  modal: 'ish',
  context: document.getElementById('root')
});
defaults.stack = myStack;

library.add(faDownload, faSignInAlt, faSpinner, faAsterisk);

ipcRenderer.once('check-for-update-completed', (event, data) => {
  const result = confirm('Update for the community store is available! Please download the update from github!');
  if (result === true) {
    shell.openExternal('https://github.com/MaxvandeLaar/homey-community-store/releases');
  }
});
ipcRenderer.send('check-for-update');

ipcRenderer.on('check-for-updates', (event, data) => {
  ipcRenderer.send('check-for-update');
});

ReactDOM.render(<AppContainer />, document.getElementById('root'));

function AppContainer() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [activeHomey, setActiveHomey] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [waitingForAuth, setWaitingForAuth] = useState(false);

  ipcRenderer.on('error', (event, args) => {
    alert({
      title: args.title,
      text: args.message,
      type: 'error'
    });
  });

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
    setWaitingForAuth(true);
    ipcRenderer.once('user-logged-in', (event, args) => {
      setWaitingForAuth(false);
      isAuthenticated();
    });
    ipcRenderer.send('login-user');
  }

  function logoutUser() {
    ipcRenderer.once('user-logged-out', (event, args) => {
      isAuthenticated();
    });
    ipcRenderer.send('logout-user');
  }

  function changeSearchValue(value: string) {
    setSearchValue(value);
  }

  function setActiveHomeyFunc(homey: Homey) {
    ipcRenderer.once('active-homey-set', (event, args) => {
      setActiveHomey(args.homey);
    });
    ipcRenderer.send('set-active-homey', {homey});
  }

  return (
    <>
      <TopBar loggedIn={loggedIn} searchValueChange={changeSearchValue} loginFunc={loginUser}
              profile={userProfile}
              activeHomey={activeHomey}
              logoutFunc={logoutUser}
              waitingForAuth={waitingForAuth}
              setActiveHomeyFunc={setActiveHomeyFunc}
      />
      <Container className={'mt-5'}>
        <Content loggedIn={loggedIn} searchValue={searchValue} />
      </Container>
      <Container>
        <Row>
          <Col className={'text-center small'}>
            <span>Version {version}<br />Created by <a href={'#'} onClick={() => shell.openExternal('https://github.com/MaxvandeLaar')}>{author.name}</a></span>
          </Col>
        </Row>
      </Container>
    </>
  );
}
