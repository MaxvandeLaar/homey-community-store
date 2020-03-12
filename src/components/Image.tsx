import React from "react";

interface ImageProps {
  style?: React.CSSProperties
  src: string;
  height?: string;
}

const defaultStyle = {
  borderRadius: '100%',
  objectFit: 'cover'
} as React.CSSProperties;

function Image({src, style = {} }: ImageProps) {
  return (
    <img src={src} style={{...defaultStyle, ...style}}/>
  )
}

export default Image;
