import React from 'react';
import { debounce } from 'lodash';
import { sleep, getPageElement } from 'utils';

interface IProps {
  loading: boolean;
  hasNextPage: boolean;
  threshold: number;
  onLoadMore: () => void;
  disabled?: boolean;
}

export default (props: IProps) => {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (props.disabled) {
      return;
    }
    const scrollElement: any = getPageElement();
    const debounceScroll = debounce(async () => {
      if (props.loading) {
        await sleep(200);
        return;
      }
      if (!props.hasNextPage) {
        return;
      }
      const { scrollTop } = scrollElement;
      const isBottom =
        scrollTop + window.innerHeight + (props.threshold || 350) >
        scrollElement.offsetHeight;
      if (isBottom) {
        props.onLoadMore();
      }
    }, 1);
    scrollElement.addEventListener('scroll', debounceScroll);

    return () => {
      scrollElement.removeEventListener('scroll', debounceScroll);
    };
  }, [props]);

  return ref;
};
