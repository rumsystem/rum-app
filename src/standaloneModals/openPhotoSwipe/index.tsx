import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider } from 'store';
import { unmountComponentAtNode, render } from 'react-dom';
import { ThemeRoot } from 'utils/theme';
import { Dialog } from '@material-ui/core';
import { MdClose, MdKeyboardArrowLeft, MdKeyboardArrowRight } from 'react-icons/md';

interface IProps {
  image: string | Array<string>
  index?: number
}

export default async (props: IProps) => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <PhotoSwipeComponent
            {...props}
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

interface IPhotoSwipeProps extends IProps {
  rs: () => unknown
}

const PhotoSwipeComponent = observer((props: IPhotoSwipeProps) => {
  const state = useLocalObservable(() => ({
    open: true,
    currentIndex: props.index ?? 0,
    images: [props.image].flatMap((v) => v),
    maxSize: Math.min(window.innerHeight, window.innerWidth) - 100,
  }));

  const box = React.useRef<HTMLDivElement>(null);

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  const handleBoxClick = (e: React.MouseEvent) => {
    if (e.target === box.current) {
      handleClose();
    }
  };

  const handleChangeIndex = action((delta: number) => {
    let index = state.currentIndex + delta;
    if (index < 0) {
      index += props.image.length;
    }
    if (index >= props.image.length) {
      index -= props.image.length;
    }
    state.currentIndex = index;
  });

  React.useEffect(() => {
    const handleResize = action(() => {
      state.maxSize = Math.min(window.innerHeight, window.innerWidth) - 100;
    });
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  return (
    <Dialog
      classes={{
        container: 'bg-transparent',
        paper: 'bg-transparent',
      }}
      open={state.open}
      onClose={handleClose}
      fullScreen
    >
      <div
        className="flex flex-center relative bg-black bg-opacity-60 h-full w-full select-none"
        ref={box}
        onClick={handleBoxClick}
      >
        <div
          className={classNames(
            'absolute top-50 left-0 -translate-y-1/2 cursor-pointer py-2',
            'bg-black bg-opacity-0 hover:bg-opacity-50',
          )}
          onClick={() => handleChangeIndex(-1)}
        >
          <MdKeyboardArrowLeft className="text-[60px] text-white" />
        </div>
        <div
          className={classNames(
            'absolute top-50 right-0 -translate-y-1/2 cursor-pointer py-2',
            'bg-black bg-opacity-0 hover:bg-opacity-50',
          )}
          onClick={() => handleChangeIndex(1)}
        >
          <MdKeyboardArrowRight className="text-[60px] text-white" />
        </div>
        <div
          className={classNames(
            'absolute top-0 right-0 cursor-pointer p-2',
            'bg-black bg-opacity-0 hover:bg-opacity-50',
          )}
          onClick={handleClose}
        >
          <MdClose className="text-[40px] text-white" />
        </div>
        <div className="absolute top-0 left-0 p-2 text-white">
          {state.currentIndex + 1} / {props.image.length}
        </div>

        <img
          className="relative z-10"
          src={state.images[state.currentIndex]}
          style={{
            maxWidth: `${state.maxSize}px`,
            maxHeight: `${state.maxSize}px`,
          }}
          alt=""
          onClick={() => handleChangeIndex(-1)}
        />
      </div>
    </Dialog>
  );
});
