import React from "react";
import apps from '../data/apps.json';
import {Colors} from "../style/colors";
import Button from "./Button/Button";
import {ipcRenderer, shell} from 'electron';

export default function Content({loggedIn = false}) {
  console.log(apps);

  function install(app: any) {
    ipcRenderer.once('installation-finished', (event, args) => {
      alert('App installation finished: ' + args.app.name);
    });
    console.log(app);
    ipcRenderer.send('install', {repo: app.latest.repo, homeyApp: app});
  }

  function openLink(url: string) {
    shell.openExternal(url);
  }

  return (
    <div style={styles.container}>{
      apps.map((app) => (
        <div style={styles.card} key={app.id}>
          <div style={styles.cardHeader}>
            <h2 style={styles.cardTitle}>{app.name}</h2>
            <Button title={`Install ${app.latest.version}`} onClick={() => install(app)}/>
          </div>
          <img style={styles.cardImage} src={app.avatar ? app.avatar : `https://via.placeholder.com/150/?text=${app.name}`} />
          <div style={styles.cardFooter}>
            <p>Author: {app.author}</p>
            <Button title={'More info'} onClick={() => openLink(app.latest.repo)} style={{fontWeight: 'normal', padding: '0.3em', height: '3em'}} />
          </div>
        </div>
      ))
    }</div>
  )
}

const styles = {
  container: {
    flex: 1,
    marginTop: '2em',
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap'
  } as React.CSSProperties,
  card: {
    backgroundColor: Colors.white,
    padding: '1em',
    margin: '1em',
    flex: 1,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  } as React.CSSProperties,
  cardTitle: {
    marginRight: '2em'
  } as React.CSSProperties,
  cardImage: {
    objectFit: 'cover',
    height: '150px'
  } as React.CSSProperties,
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  } as React.CSSProperties
};
