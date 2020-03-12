import React, {useState, useEffect} from 'react';
import {Colors} from "../../style/colors";

function SvgLogo({svg, backgroundColor = Colors.primary}: { backgroundColor: string; svg: string; }) {
  const [mask, setMask] = useState(null);
  useEffect(() => {
    const str = 'data:image/svg+xml;charset=utf-8;base64,' + new Buffer(svg).toString('base64');
    setMask(str);
  }, [mask]);

  return (
    <div style={{
      width: '50px',
      height: '50px',
      borderRadius: '100%',
      padding: '1em',
      backgroundColor
    }}>
      {mask && (
        <div
          data-mask={mask}
             style={{
               width: '100%',
               height: '100%',
               backgroundColor: 'white',
               WebkitMaskImage: `url(${mask})`,
               WebkitMaskPosition: 'center center',
               display: 'block',
               WebkitMaskSize: 'contain',
               WebkitMaskRepeat: 'no-repeat'
             } as React.CSSProperties}
          // dangerouslySetInnerHTML={{__html: svg}}
        />
      )}

    </div>
  );
}

export default SvgLogo;
