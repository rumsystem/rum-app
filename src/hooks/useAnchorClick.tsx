import React from 'react';
import { shell } from 'electron';

export default () => {
  React.useEffect(() => {
    const body = document.querySelector('body')!;
    if (body) {
      body.onclick = (e) => {
        const target = e.target as HTMLElement;
        if (target && target.tagName === 'A') {
          e.preventDefault();
          const href = target.getAttribute('href');
          if (href && href.startsWith('http')) {
            shell.openExternal(href);
          }
        }
      };
    }
  }, []);
};
