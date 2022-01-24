import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import { lang } from 'utils/lang';
import classNames from 'classnames';

const SizeMap: any = {
  '12': lang.smallSizeFont,
  '14': lang.normalSizeFont,
  '16': lang.largeSizeFont,
  '18': lang.extraLargeSizeFont,
};

export const changeFontSize = async () => new Promise<void>((rs) => {
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
          <ChangeFontSize
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

interface Props { rs: () => unknown }

const ChangeFontSize = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: true,
    selected: '14',
  }));

  const {
    fontStore,
  } = useStore();

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  const handleSubmit = action(() => {
    fontStore.setFontSize(state.selected);
    handleClose();
  });

  React.useEffect(action(() => {
    state.selected = fontStore.fontSize;
  }), []);

  return (
    <Dialog
      open={state.open}
      maxWidth={false}
      onClose={handleClose}
      transitionDuration={300}
    >
      <div className="relative bg-white rounded-0 py-10 px-15 max-w-[500px] w-[400px] flex flex-col items-center">
        <div className="text-16 font-medium text-gray-4a break-all">
          {lang.changeFontSize}
        </div>

        <div
          style={{ lineHeight: '100%' }}
          className={classNames(
            'mt-5 w-70 h-10 rounded text-gray-4a border border-gray-af flex items-center justify-center font-normal',
            state.selected ? 'text-' + state.selected : 'text-14',
          )}
        >
          {lang.youSelected}{SizeMap[state.selected]}
        </div>

        <div className="mt-7 w-33 border-t border-black flex justify-between">
          <div
            className={classNames('w-3 h-3 rounded-full border border-black -translate-y-1/2 -translate-x-full cursor-pointer', state.selected === '12' ? 'bg-black' : 'bg-white')}
            onClick={() => { state.selected = '12'; }}
          />
          <div
            className={classNames('w-3 h-3 rounded-full border border-black -translate-y-1/2 -translate-x-1/3 cursor-pointer', state.selected === '14' ? 'bg-black' : 'bg-white')}
            onClick={() => { state.selected = '14'; }}
          />
          <div
            className={classNames('w-3 h-3 rounded-full border border-black -translate-y-1/2 translate-x-1/3 cursor-pointer', state.selected === '16' ? 'bg-black' : 'bg-white')}
            onClick={() => { state.selected = '16'; }}
          />
          <div
            className={classNames('w-3 h-3 rounded-full border border-black -translate-y-1/2 translate-x-full cursor-pointer', state.selected === '18' ? 'bg-black' : 'bg-white')}
            onClick={() => { state.selected = '18'; }}
          />
        </div>

        <div className="w-36 relative">
          <div className="absolute left-0 text-12 text-gray-9c -translate-x-1/2">{lang.small}</div>
          <div className="absolute left-1/2 text-14 text-gray-9c -translate-x-1/2">{lang.normal}</div>
          <div className="absolute right-0 text-18 text-gray-9c translate-x-1/2">{lang.large}</div>
        </div>

        <Button className="mt-14 w-36 h-10 text-16" onClick={handleSubmit}>
          {lang.yes}
        </Button>
      </div>
    </Dialog>
  );
});
