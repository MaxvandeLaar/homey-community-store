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
  searchValueChange?: (value: string) => void;
}

function TopBar({
                  profile,
                  loggedIn = false,
                  loginFunc,
                  activeHomey,
                  searchValueChange
                }: TopBarProps) {

  function login() {
    loginFunc();
  }

  function onChange(event: any) {
    searchValueChange(event.target.value);
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <Input style={{flex: 2}} placeholder={'Search...'} onChange={onChange} />
        {loggedIn ? (
          <>
            <span style={{...styles.flexChild}}>{activeHomey?.name}</span>
            <Image src={profile?.avatar.small} style={{...styles.flexChild, height: '40px'}} />
          </>
        ) : (
          <Button onClick={login}>Sign in @ Athom</Button>
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
    // borderRadius: '10px',
    borderRadius: '2px',
    // boxShadow: '0 2px 44px 0 rgba(45,45,45,.23),0 2px 4px 0 rgba(45,45,45,.05)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
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
