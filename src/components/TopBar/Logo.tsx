import React from 'react';
import './Logo.scss'

export default function Logo({width, height, classes} : {classes?: string; width: string; height: string}) {
  return (
    <svg width={width} height={height} viewBox="0 0 126 125" version="1.1" className={classes || ''}>
      <title>Community Store Logo</title>
      <desc>Created with Sketch.</desc>
      <defs>
        <linearGradient x1="98.8650343%" y1="58.2945338%" x2="5.20957203%" y2="60.824743%" id="linearGradient-1">
          <stop stopColor="#FFE709" offset="0%"></stop>
          <stop stopColor="#B9DA06" offset="50%"></stop>
          <stop stopColor="#67CB02" offset="100%"></stop>
          <stop stopColor="#5DC901" offset="100%"></stop>
        </linearGradient>
        <linearGradient x1="100%" y1="56.3398015%" x2="7.33093942%" y2="62.6063558%" id="linearGradient-2">
          <stop stopColor="#5DC901" offset="0%"></stop>
          <stop stopColor="#32D974" offset="50%"></stop>
          <stop stopColor="#01EBFA" offset="100%"></stop>
        </linearGradient>
        <linearGradient x1="100%" y1="56.1608022%" x2="8.29187783%" y2="62.1944682%" id="linearGradient-3">
          <stop stopColor="#23ADF9" offset="0%"></stop>
          <stop stopColor="#466FF8" offset="50%"></stop>
          <stop stopColor="#FF40F7" offset="100%"></stop>
        </linearGradient>
        <linearGradient x1="58.9854652%" y1="0%" x2="61.9555219%" y2="93.1232037%" id="linearGradient-4">
          <stop stopColor="#FF40F7" offset="0%"></stop>
          <stop stopColor="#E22840" offset="50%"></stop>
          <stop stopColor="#F08625" offset="100%"></stop>
        </linearGradient>
        <path d="M63,38 C76.8071187,38 88,49.1928813 88,63 C88,76.8071187 76.8071187,88 63,88 C49.1928813,88 38,76.8071187 38,63 C38,49.1928813 49.1928813,38 63,38 Z M63,48 C54.7157288,48 48,54.7157288 48,63 C48,71.2842712 54.7157288,78 63,78 C71.2842712,78 78,71.2842712 78,63 C78,54.7157288 71.2842712,48 63,48 Z" id="path-5"></path>
        <filter x="-4.0%" y="-4.0%" width="108.0%" height="108.0%" filterUnits="objectBoundingBox" id="filter-6">
          <feGaussianBlur stdDeviation="1.5" in="SourceAlpha" result="shadowBlurInner1"></feGaussianBlur>
          <feOffset dx="0" dy="1" in="shadowBlurInner1" result="shadowOffsetInner1"></feOffset>
          <feComposite in="shadowOffsetInner1" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowInnerInner1"></feComposite>
          <feColorMatrix values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.5 0" type="matrix" in="shadowInnerInner1"></feColorMatrix>
        </filter>
      </defs>
      <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
        <g id="Artboard" transform="translate(-1561.000000, -935.000000)">
          <g id="Community-Store-Logo-Copy" transform="translate(1561.000000, 935.000000)">
            <g id="Group">
              <path d="M62.5,125 C97.0177969,125 125,97.0177969 125,62.5 C125,27.9822031 97.0177969,0 62.5,0 C43.5472051,0 26.5647695,8.43611116 15.1028639,21.7581629 C5.68976235,32.6989113 0,46.934998 0,62.5 C0,97.0177969 27.9822031,125 62.5,125 Z" id="background" fill=""></path>
              <path d="M62.0945356,125 C70.5686084,125 78.6487836,123.313524 86.017735,120.257898 C93.6569134,117.09022 100.531749,112.451134 106.288709,106.694174 C113.828893,99.1539902 99.2641684,84.5892656 62.5945356,63 C25.2582361,84.5892656 10.3601782,99.1539902 17.9003618,106.694174 C23.6573223,112.451134 30.5321578,117.09022 38.1713362,120.257898 C45.5402876,123.313524 53.6204628,125 62.0945356,125 Z" id="Bottom" fill="url(#linearGradient-1)"></path>
              <path d="M31.0945356,93.108864 C39.5686084,93.108864 47.6487836,91.422388 55.017735,88.3667624 C62.6569134,85.1990839 69.5317489,80.5599983 75.2887094,74.8030378 C82.828893,67.2628542 68.2641684,52.6981296 31.5945356,31.108864 C-5.74176388,52.6981296 -20.6398218,67.2628542 -13.0996382,74.8030378 C-7.34267768,80.5599983 -0.467842166,85.1990839 7.17133619,88.3667624 C14.5402876,91.422388 22.6204628,93.108864 31.0945356,93.108864 Z" id="Left" fill="url(#linearGradient-2)" transform="translate(31.108864, 62.108864) rotate(90.000000) translate(-31.108864, -62.108864) "></path>
              <path d="M63.0945356,62 C71.5686084,62 79.6487836,60.3135241 87.017735,57.2578985 C94.6569134,54.09022 101.531749,49.4511344 107.288709,43.6941738 C114.828893,36.1539902 100.264168,21.5892656 63.5945356,0 C26.2582361,21.5892656 11.3601782,36.1539902 18.9003618,43.6941738 C24.6573223,49.4511344 31.5321578,54.09022 39.1713362,57.2578985 C46.5402876,60.3135241 54.6204628,62 63.0945356,62 Z" id="Top" fill="url(#linearGradient-3)" transform="translate(63.108864, 31.000000) rotate(180.000000) translate(-63.108864, -31.000000) "></path>
              <path d="M63.108864,62.5143284 C84.6981296,25.8446955 99.2628542,11.2799709 106.803038,18.8201545 C112.559998,24.5771151 117.199084,31.4519506 120.366762,39.0911289 C123.422388,46.4600804 125.108864,54.5402556 125.108864,63.0143284 C125.108864,71.4884011 123.422388,79.5685764 120.366762,86.9375278 C117.199084,94.5767061 112.559998,101.451542 106.803038,107.208502 C105.945273,108.066267 104.996603,108.633655 103.957027,108.910667 C104.752695,108.191397 105.5304,107.452483 106.288709,106.694174 C113.745323,99.2375606 99.5843044,84.9112541 63.8056548,63.7152544 L63.7544346,63.6276859 L63.7544346,63.6276859 Z" id="Combined-Shape" fill="url(#linearGradient-4)"></path>
            </g>
            {/*<g id="Combined-Shape">*/}
            {/*  <use fill="#FFFFFF" fillRule="evenodd" xlinkHref="#path-5"></use>*/}
            {/*  <use fill="black" fill-opacity="1" filter="url(#filter-6)" xlinkHref="#path-5"></use>*/}
            {/*</g>*/}
          </g>
        </g>
      </g>
    </svg>
  );
}
