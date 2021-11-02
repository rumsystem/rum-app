import React from 'react';
import { getPageElement } from 'utils';

interface IProps {
  threshold?: number;
  callback?: (yes: boolean) => void;
}

export default (props?: IProps) => {
  const [scrollTop, setScrollTop] = React.useState(0);

  React.useEffect(() => {
    const scrollElement: any = getPageElement();
    const callback = () => {
      if (props && props.callback && props.threshold) {
        props.callback(scrollElement.scrollTop >= props.threshold);
      }
      setScrollTop(scrollElement.scrollTop);
    };
    scrollElement.addEventListener('scroll', callback);

    return () => {
      scrollElement.removeEventListener('scroll', callback);
    };
  }, [props]);

  return scrollTop;
};
