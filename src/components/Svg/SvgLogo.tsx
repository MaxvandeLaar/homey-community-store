import React, {useState, useEffect} from 'react';
import {Colors} from "../../style/colors";
import './SvgLogo.scss';

function SvgLogo({className, svg, backgroundColor = Colors.primary, onClick}: { className?: string; onClick?: () => void; backgroundColor: string; svg: string; }) {
  const [mask, setMask] = useState(null);
  useEffect(() => {
    const str = 'data:image/svg+xml;charset=utf-8;base64,' + new Buffer(svg).toString('base64');
    setMask(str);
  }, [mask]);

  return (
    <div style={{
      backgroundColor
    }}
         onClick={onClick}
         className={`icon-container ${className || ''}`}
    >
      {mask && (
        <div
          style={{
            WebkitMaskImage: `url(${mask})`,
          } as React.CSSProperties}
        />
      )}

    </div>
  );
}

export default SvgLogo;
