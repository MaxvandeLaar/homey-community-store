import React, {useEffect} from "react";
// import Image from "../Image";
import {Profile} from "../../interfaces/Profile";
// import Button from "../Button/Button";


import Logo from './Logo';
import Input from "../Input";
import './TopBar.scss';
import {Form, Nav, Navbar, FormControl, Button, Image, Dropdown, NavDropdown} from "react-bootstrap";
import {Homey} from "../../interfaces/Homey";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

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

  function setActiveHomey(homey: Homey) {
    //call to set active homey
  }

  return (
    <Navbar variant="light" sticky="top" className={'container mt-3'}>
      <Navbar.Brand><Logo width={'40px'} height={'40px'} /></Navbar.Brand>
      <div className={'search-container'}>
        <FormControl type="text" placeholder="Search..." className="mr-sm-2" onChange={onChange} />
        <div className="input-focus-bar" />
      </div>
      {loggedIn && profile ? (
        <Nav className={'ml-3'}>
          <NavDropdown title={activeHomey?.name || 'Select your Homey'} id="homey-dropdown" className={'mr-2'}>
            {profile?.homeys.map((homey: Homey) => (
              <NavDropdown.Item key={homey.id} onClick={() => setActiveHomey(homey)}>{homey.name}</NavDropdown.Item>
            ))}
          </NavDropdown>
          <Image width={'40px'} height={'40px'} src={profile?.avatar.small} roundedCircle />
        </Nav>
      ): (
        <Nav className={'ml-3'}>
          <Button onClick={login} className={'login-btn'}>Sign in <FontAwesomeIcon icon={'sign-in-alt'} /> Athom</Button>
        </Nav>
      )}
    </Navbar>
  );
}


export default TopBar;
