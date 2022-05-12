import React from 'react';
import { shell } from 'electron';

export default () => {
  React.useEffect(() => {
    const body = document.querySelector('body') as any;
    if (body) {
      body.onclick = (e: any) => {
        if (e.target && e.target.tagName === 'A') {
          e.preventDefault();
          const href = e.target.getAttribute('href');
          if (href && href.startsWith('http')) {
            shell.openExternal(href);
          }
        }
      };
    }
  }, []);
};
