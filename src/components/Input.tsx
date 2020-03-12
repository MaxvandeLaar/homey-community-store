import React from "react";

interface InputProps {
  placeholder?: string;
  value?: string;
  style?: React.CSSProperties;
}

const defaultStyle = {
  border: 'none',
  borderBottom: '1px solid',
  fontSize: '1.5em',
  outline: 'none !important',
  ':hover': {
    color: 'green'
  }
} as React.CSSProperties;

function Input({placeholder, value, style = {}}: InputProps) {
  return (
    <input style={{...defaultStyle, ...style}} placeholder={placeholder} value={value}/>
  )
}

export default Input;
