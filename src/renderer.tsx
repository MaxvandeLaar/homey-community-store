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
import log from 'electron-log';
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

ipcRenderer.on('check-for-update-completed', (event, args) => {
  log.info('An update is available for the store, ask if the user wants to install it');
  const result = confirm('An update for the community store is available! You should restart the app after the update is completed.\n\nWould you like to install the update?');
  log.info('Update the store to a newer version?', result);
  if (result === true) {
    ipcRenderer.send('update-store');
  }
});
ipcRenderer.send('check-for-update');

ipcRenderer.on('update-store-finished', (event, args) => {
  log.info('Store update is complete', args);
  if (args.success) {
    alert({
      title: 'Store update completed',
      text: 'The store is updated to a new version. Please restart the Homey Community Store to use the new update!',
      type: 'success',
    });
    alert({
      title: 'Store update completed',
      text: 'The store is updated to a new version. Please restart the Homey Community Store to use the new update!',
      type: 'success',
      modules: new Map([
        ...[],
        [PNotifyDesktop, {
          title: `Homey Community Store update completed!`,
          text: `The store is updated to a new version. Please restart the Homey Community Store to use the new update!`
        }]
      ])
    });
  } else {
    alert({
      title: 'Store update failed',
      text: args.error,
      type: 'error',
    });
    alert({
      title: 'Store update failed',
      text: args.error,
      type: 'error',
      modules: new Map([
        ...[],
        [PNotifyDesktop, {
          title: `Homey Community Store update failed!`,
          text: args.error
        }]
      ])
    });
  }
});

ipcRenderer.on('check-for-updates', (event, data) => {
  ipcRenderer.send('check-for-update');
});

ReactDOM.render(<AppContainer />, document.getElementById('root'));

function AppContainer() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [activeHomey, setActiveHomey] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [waitingForLogin, setWaitingForLogin] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);

  ipcRenderer.on('error', (event, args) => {
    log.error('Received error from server', args);
    alert({
      title: args.title,
      text: args.message,
      type: 'error'
    });
  });

  useEffect(() => {
    log.debug('Has permission to show desktop notifications?', Notification.permission);
    if (Notification.permission !== "denied") {
      log.debug('Ask for desktop notification permission');
      Notification.requestPermission().then(function (permission) {
        log.debug('Desktop notification answer', permission);
      });
    }

    if ((!loggedIn || !userProfile) && !waitingForAuth) {
      setWaitingForAuth(true);
      log.debug('User not found, check authentication');
      isAuthenticated();
    }
  }, [loggedIn, userProfile, activeHomey]);


  function isAuthenticated() {
    log.debug('Check if user is authenticated');
    ipcRenderer.once('user-authenticated', (event, args) => {
      setWaitingForAuth(false);
      log.debug('User authentication check finished', args);
      const {loggedIn, profile, activeHomey} = args;
      setLoggedIn(loggedIn);
      if (loggedIn && profile) {
        log.debug('User profile', profile);
        setUserProfile(profile);
      }
      if (loggedIn && activeHomey) {
        log.debug('Active Homey', activeHomey);
        setActiveHomey(activeHomey);
      }
    });
    ipcRenderer.send('is-user-authenticated');
  }

  function loginUser() {
    log.debug('Login user');
    setWaitingForLogin(true);
    ipcRenderer.once('user-logged-in', (event, args) => {
      log.debug('Login user completed');
      setWaitingForLogin(false);
      isAuthenticated();
    });
    ipcRenderer.send('login-user');
  }

  function logoutUser() {
    log.debug('Logout user');
    ipcRenderer.once('user-logged-out', (event, args) => {
      log.debug('Logout user completed');
      isAuthenticated();
    });
    ipcRenderer.send('logout-user');
  }

  function changeSearchValue(value: string) {
    setSearchValue(value);
  }

  function setActiveHomeyFunc(homey: Homey) {
    log.debug('Set active homey', homey);
    ipcRenderer.once('active-homey-set', (event, args) => {
      log.debug('Set active homey completed', args);
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
              waitingForAuth={waitingForLogin}
              setActiveHomeyFunc={setActiveHomeyFunc}
      />
      <Container className={'mt-5'}>
        <Content loggedIn={loggedIn} searchValue={searchValue} />
      </Container>
      <Container>
        <Row>
          <Col className={'text-center small'}>
            <span>Version {version}<br />Created by <a href={'#'}
                                                       onClick={() => shell.openExternal('https://github.com/MaxvandeLaar')}>{author.name}</a></span>
          </Col>
        </Row>
      </Container>
    </>
  );
}
