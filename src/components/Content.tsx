import React, {useState, useEffect} from "react";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {Colors} from "../style/colors";
import Button from "./Button/Button";
import {ipcRenderer, shell} from 'electron';
import {AppInfo} from "../interfaces/App";
import SvgLogo from "./Svg/SvgLogo";

export default function Content({loggedIn = false, searchValue = ''}) {
  const [apps, setApps] = useState(null);
  useEffect(() => {
    if (apps === null) {
      ipcRenderer.once('retrieve-apps-finished', (event, args) => {
        setApps(args.apps);
      });
      ipcRenderer.send('retrieve-apps');
    }
  }, [apps]);

  function install(app: any) {
    ipcRenderer.once('installation-finished', (event, args) => {
      alert('App installation finished: ' + args.app.name);
    });
    console.log(app);
    ipcRenderer.send('install', {repo: app.repo, homeyApp: app});
  }

  function openLink(url: string) {
    shell.openExternal(url);
  }

  return (
    <div style={styles.container}>{
      apps?.length && apps.filter((app: AppInfo) => app.name.en.toLowerCase().includes(searchValue.toLowerCase())).map((app: AppInfo) => (
        <div style={styles.card} key={app.id}>
          <div style={styles.cardHeader}>
            <div style={{display: 'flex', flexDirection: 'column'} as React.CSSProperties}>
              <h2 style={styles.cardTitle}>{app.name.en}</h2>
              <span style={{fontSize: '0.7em'}}>By {app.author.name}</span>
            </div>
            {loggedIn && (
              <Button style={{...styles.installButton, backgroundColor: app.brandColor || Colors.primary}}
                      onClick={() => install(app)}><span>{`v${app.version}`}</span><FontAwesomeIcon
                icon="download" /></Button>
            )}
          </div>
          {app.icon && (
            <SvgLogo svg={app.icon} backgroundColor={app.brandColor || Colors.primary}/>
          )}
          <img style={styles.cardImage}
               src={app.images?.small ? app.images.small : `https://via.placeholder.com/300/${app.brandColor?.replace('#', '') || 'ffffff'}/${app.brandColor ? 'ffffff' : '000000'}/?text=${app.name.en}`} />
          <div style={{flex: 1, alignContent: 'flex-start'}}>
            <p>{app.description?.en || app.description}</p>
          </div>
          <div style={styles.cardFooter}>
            <Button onClick={() => openLink(app.homepage || app.repo)}
                    style={{fontWeight: 'normal', padding: '0.3em', height: '3em'}}>More info</Button>
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
    marginLeft: '-10px',
    marginRight: '-10px',
    display: 'flex',
    justifyContent: 'center',
    flexWrap: 'wrap'
  } as React.CSSProperties,
  card: {
    backgroundColor: Colors.white,
    padding: '10px',
    margin: '10px',
    width: '320px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: '2px'
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  } as React.CSSProperties,
  cardTitle: {
    margin: '0'
  } as React.CSSProperties,
  cardImage: {
    objectFit: 'cover',
    height: '150px',
    marginTop: '1em',
    borderRadius: '2px'
  } as React.CSSProperties,
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  } as React.CSSProperties,
  installButton: {
    borderRadius: '100%',
    width: '60px',
    height: '60px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties
};
