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
import {ipcRenderer} from 'electron';
import React, {useEffect, useState} from 'react';
import * as ReactDOM from 'react-dom';
import TopBar from "./components/TopBar";
import Content from "./components/Content";
import { library } from '@fortawesome/fontawesome-svg-core'
import { faDownload } from '@fortawesome/free-solid-svg-icons'

library.add(faDownload);

ReactDOM.render(<Container />, document.getElementById('root'));

function Container() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [activeHomey, setActiveHomey] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
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

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      padding: '2em 3em'
    } as React.CSSProperties
  };

  return (
    <div style={styles.container}>
      <TopBar loggedIn={loggedIn} searchValueChange={changeSearchValue} loginFunc={loginUser} profile={userProfile} activeHomey={activeHomey}/>
      <Content loggedIn={loggedIn} searchValue={searchValue} />
    </div>
  );
}


//
//
// document.querySelector('#login').addEventListener(('click'), () => {
//   ipcRenderer.send('login');
// });
//
// document.querySelector('#download').addEventListener('click', () => {
//   ipcRenderer.send('download-zip', {options: {}, url: 'https://github.com/Rocodamelshe/com.roco.ancilla#alpha'});
// });
//
// ipcRenderer.on('download-complete', (event, arg) => {
//   console.log(arg) // prints "pong"
// });
//
// ipcRenderer.on('download-progress', (event, arg) => {
//   console.log(arg) // prints "pong"
// });


