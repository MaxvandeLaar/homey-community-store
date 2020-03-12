import React, {useEffect} from "react";
import Image from "./Image";
import {Profile} from "../interfaces/Profile";
import Button from "./Button/Button";
import {Colors} from "../style/colors";
import Input from "./Input";


interface TopBarProps {
  profile: Profile | null;
  loggedIn: boolean;
  loginFunc: () => void;
  activeHomey: { id: string; name: string } | null;
}

function TopBar({
                  profile,
                  loggedIn = false,
                  loginFunc,
                  activeHomey
                }: TopBarProps) {

  function login() {
    loginFunc();
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        {loggedIn ? (
          <>
            <Input style={{flex: 2}} placeholder={'Search...'} />
            <span style={{...styles.flexChild}}>{activeHomey?.name}</span>
            <Image src={profile?.avatar.small} style={{...styles.flexChild, height: '40px'}} />
          </>
        ) : (
          <Button onClick={login} title={'Sign in @ Athom'}/>
        )}
      </div>
    </div>
  );
}


const styles = {
  container: {
    flex: 1,
    display: 'flex'
  },
  topBar: {
    backgroundColor: Colors.white,
    borderRadius: '10px',
    boxShadow: '0 2px 44px 0 rgba(45,45,45,.23),0 2px 4px 0 rgba(45,45,45,.05)',
    padding: '1em',
    flex: 1,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center'
  } as React.CSSProperties,
  flexChild: {
    marginLeft: '1em',
  }
};

export default TopBar;
