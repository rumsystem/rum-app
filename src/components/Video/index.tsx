import React from 'react';
import classNames from 'classnames';
import { action, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { IoMdClose } from 'react-icons/io';
import { lang, sleep } from 'utils';

import Plyr from './Plyr';

interface IProps {
  url: string
  poster: string
  width: number
  height: number
  duration: string
}

export const Video = observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    start: false,
    hasError: false,
    isFullscreen: false,
  }));

  const getPlyr = React.useCallback((plyr: Plyr) => {
    plyr.on('enterfullscreen', action(() => {
      state.isFullscreen = true;
    }));
    plyr.on('exitfullscreen', action(() => {
      state.isFullscreen = false;
    }));
  }, []);

  return (
    <div
      className={classNames(
        'relative rounded-12 overflow-hidden rect-md square-md',
        !state.isFullscreen && 'plyr-container',
        // 'rect-md': !isMobile && props.width > props.height,
        // 'rect': isMobile && props.width > props.height,
        // 'square-md': !isMobile && props.width <= props.height,
        // 'square': isMobile && props.width <= props.height,
      )}
      onClick={async () => {
        await sleep(100);
        if (document.querySelector('.plyr__control--pressed')) {
          runInAction(() => {
            state.start = true;
          });
        }
      }}
    >
      <Plyr
        src={props.url}
        poster={props.poster}
        width={props.width}
        height={props.height}
        getPlyr={getPlyr}
      />
      <div className={`${state.start ? 'hidden' : ''} absolute bottom-2 right-2 py-1 px-2 text-12 md:text-13 bg-black/70 text-white/80 tracking-wide rounded-12 leading-none`}>
        {props.duration}
      </div>
      {state.hasError && (
        <div className="absolute inset-0 z-20 bg-gray-600 text-white/80 flex items-center justify-center rounded-12">
          <div className="flex items-center">
            <IoMdClose className="text-20 mr-1" />
            {lang.videoCannotBePlayed}
          </div>
        </div>
      )}
    </div>
  );
});
