import React, {useState, useEffect} from "react";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {ipcRenderer, shell} from 'electron';
import {AppInfo} from "../../interfaces/App";
import SvgLogo from "../Svg/SvgLogo";
import './Content.scss';
import AppModal from "../AppModal/AppModal";
import {Card, Col, Button, ListGroup, Row} from "react-bootstrap";
import Fuse from "fuse.js";

// @ts-ignore
import {alert, defaultModules, defaults, Stack} from '@pnotify/core';
// @ts-ignore
import * as PNotifyDesktop from '@pnotify/desktop/dist/PNotifyDesktop';

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

export default function Content({loggedIn = false, searchValue = ''}) {
  const [apps, setApps] = useState(null);
  const [startApps, setStartApps] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);
  const [fuse, setFuse] = useState(null);
  const [searchTerm, setSearchTerm] = useState(null);
  const [categories, setCategories] = useState(null);
  const [installList, setInstallList] = useState<AppInfo[]>([]);
  const [listeners, setListeners] = useState(false);


  if (searchTerm !== searchValue) {
    setSearchTerm(searchValue);
    if (fuse) {
      const result = fuse.search(searchValue);
      if (!searchValue) {
        setApps(startApps);
      } else {
        setApps(result.map((item: any) => item.item));
      }
    }
  }

  useEffect(() => {
    if (apps === null) {
      ipcRenderer.once('retrieve-apps-finished', (event, args) => {
        setApps(args.apps);
        setStartApps(args.apps);
        setCategories(args.categories);

        const options = {
          keys: ['id', 'name.en', 'description.en', 'author.name', 'tags.en'],
          includeScore: true,
        };
        setFuse(new Fuse(args.apps, options));
      });
      ipcRenderer.send('retrieve-apps');
    }

    ipcRenderer.on('installation-progress', (event, args) => {
      console.log('Progress ' + args.app.name.en, args.progress);
    });

    // function cleanup() {
    //   ipcRenderer.removeAllListeners('installation-finished');
    //   ipcRenderer.removeAllListeners('installation-progress');
    //   ipcRenderer.removeAllListeners('installation-failed');
    // }
  }, [apps, startApps]);

  if (!listeners) {
    setListeners(true);

  }

  function removeFromList(app: AppInfo) {
    if (localStorage.getItem(app.id)) {
      localStorage.removeItem(app.id);
    }
  }


  function install(app: AppInfo) {
    // localStorage.setItem(app.id, 'true');
    ipcRenderer.send('install', {repo: app.repo, homeyApp: app});
  }

  function openLink(url: string) {
    shell.openExternal(url);
  }

  function openModal(app: AppInfo) {
    setSelectedApp(app);
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    setSelectedApp(null);
    document.body.style.overflow = null;
  }

  return (
    <>
      <Row>
        {categories?.length && categories.map((category: string, index: number) =>
          <List installList={installList} onInstall={install} category={category} apps={apps?.length ? apps : []}
                key={index} onClickApp={setSelectedApp} />
        )}
      </Row>
      <AppModal app={selectedApp} onClose={closeModal} />
    </>
  )
}

function List({installList, onInstall, category, apps, onClickApp}: { installList: AppInfo[]; onInstall: (app: AppInfo) => void; onClickApp: (app: AppInfo) => void; category: string; apps: AppInfo[] }) {
  const appList = apps.filter(app => app.category?.includes(category));

  function install(app: AppInfo) {
    onInstall(app);
    // ipcRenderer.send('install', {repo: app.repo, homeyApp: app});
  }

  function isInstalling(app: AppInfo) {
    return localStorage.getItem(app.id) && localStorage.getItem(app.id) === 'true';
  }

  return (
    <>
      {
        appList.length > 0 && (
          <Col lg={4}>
            <Card>
              <Card.Body>
                <Card.Title>{category.substr(0, 1).toUpperCase()}{category.substr(1)}</Card.Title>
                <ListGroup variant="flush">
                  {appList.map((app) => (
                    <App key={app.id} app={app} onClickApp={onClickApp} onInstall={onInstall} />
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        )
      }
    </>
  );
}

function App({onClickApp, onInstall, app}: { onClickApp: (app: AppInfo) => void; onInstall: (app: AppInfo) => void; app: AppInfo }) {
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    ipcRenderer.removeAllListeners(`installation-finished-${app.id}`);

    ipcRenderer.on(`installation-finished-${app.id}`, (event, args) => {
      setIsInstalling(false);
      if (args.error) {
        alert({
          title: app.name.en,
          text: JSON.parse(args.error) || args.error,
          type: 'error'
        });
      } else {
        alert({
          title: app.name.en,
          text: `Thank you for choosing ${app.name.en}. The app is installed!`,
          type: 'notice',
          modules: new Map([
            ...[],
            [PNotifyDesktop, {
              title: `HCS: ${app.name.en}`,
              text: `Finished installing ${app.name.en}`,
              icon: app.images?.small || ''
            }]
          ])
        });
      }
    });
  }, [app]);

  function install() {
    setIsInstalling(true);
    ipcRenderer.send('install', {repo: app.repo, homeyApp: app});
    alert({
      title: app.name.en,
      text: `${app.name.en} will be installed as soon as possible, please keep the store running!`,
      type: 'notice'
    });
    // onInstall(app);
  }


  return (
    <ListGroup.Item as={'div'} key={app.id}>
      <SvgLogo className={'action'} onClick={() => onClickApp(app)}
               backgroundColor={app.brandColor || '#000'} svg={app.icon} />
      <Row className={'ml-1 mr-1'}>
        <Col xs={12}><span className={'app-title action'}
                           onClick={() => onClickApp(app)}>{app.name.en}</span> <span
          className={'app-author'}>{app.author.name}</span></Col>
        <Col xs={12}><span
          className={'app-desc'}>{typeof app.description === 'object' ? app.description.en : app.description}</span></Col>
      </Row>
      <Button className={`install-button ml-auto ${isInstalling ? ' installing' : ''}`}
              onClick={install}
              variant={isInstalling ? 'outline-secondary' : 'outline-success'}
              disabled={isInstalling}>
        <FontAwesomeIcon icon={isInstalling ? 'asterisk' : 'download'} spin={isInstalling} />
        <span>v{app.version}</span>
      </Button>
      <span>{app.progress?.message}</span>
    </ListGroup.Item>
  );
}
