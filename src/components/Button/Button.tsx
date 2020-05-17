import React, {useState, useEffect} from 'react';
import {Colors} from "../../style/colors";
import './Button.scss';

interface ButtonProps {
  title?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
  children?: any;
  className?: string;
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
function Button({title = '', style = {}, onClick, children, className}: ButtonProps) {
  const [theStyle, setTheStyle] = useState(defaultStyle);
  useEffect(() => {

  }, [theStyle]);

  return (
    <button style={{...theStyle, ...style}} onClick={onClick} className={className}>{children}</button>
  )
}

export default Button;
