import React, {useState, useEffect} from 'react';
import {Colors} from "../../style/colors";
import './Button.scss';

interface ButtonProps {
  title?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  children?: any
}

const defaultStyle = {
  padding: '1em',
  backgroundColor: Colors.primary,
  border: 'none',
  color: Colors.white,
  fontSize: '0.8em',
  fontWeight: 'bold',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.5)',
  cursor: 'pointer'
} as React.CSSProperties;
function Button({title = '', style = {}, onClick, children}: ButtonProps) {
  const [theStyle, setTheStyle] = useState(defaultStyle);
  useEffect(() => {

  }, [theStyle]);

  // function mouseEnter(){
  //   setTheStyle({...defaultStyle, ...hoverStyle});
  // }
  //
  // function mouseLeave() {
  //   setTheStyle(defaultStyle);
  // }

  return (
    <button style={{...theStyle, ...style}} onClick={onClick}>{children}</button>
  )
}

export default Button;
