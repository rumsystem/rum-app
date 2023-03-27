import React from 'react';
import { createRoot } from 'react-dom/client';
import classNames from 'classnames';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import { MdInfo } from 'react-icons/md';
import Loading from 'components/Loading';
import { isWindow } from 'utils/env';

interface IProps {
  url: string
}

export default async (props: IProps) => new Promise<any>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const root = createRoot(div);
  const unmount = () => {
    root.unmount();
    div.remove();
  };
  root.render(
    <ThemeRoot>
      <StoreProvider>
        <MixinPayModal
          url={props.url}
          rs={(v: any) => {
            rs(v);
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
});

interface IMixinPayProps extends IProps {
  rs: any
}

const MixinPayModal = observer((props: IMixinPayProps) => {
  const state = useLocalObservable(() => ({
    open: true,
    iframeLoading: true,
    buttonLoading: false,
  }));

  const handleClose = (isSuccess?: boolean) => {
    props.rs(isSuccess);
    state.open = false;
  };

  return (
    <Dialog
      maxWidth={false}
      open={state.open}
      onClose={() => handleClose()}
      transitionDuration={300}
    >
      <div className="bg-white rounded-0 text-center">
        <div className="py-8 px-14 text-center">
          <div className="text-18 font-bold text-gray-700 flex items-center justify-center">Mixin 扫码充币</div>
          <div className="relative overflow-hidden">
            {props.url && (
              <div
                className={classNames(
                  {
                    hidden: state.iframeLoading,
                  },
                  'w-70 h-80',
                )}
              >
                <iframe
                  src={props.url}
                  onLoad={() => {
                    setTimeout(() => {
                      state.iframeLoading = false;
                    }, 2000);
                  }}
                />
                <style jsx>{`
                  iframe {
                    height: 450px;
                    width: 800px;
                    position: absolute;
                    top: -266px;
                    left: 17px;
                    margin-left: ${isWindow ? '-265px' : '-272px'};
                    transform: scale(1.5);
                  }
                `}</style>
              </div>
            )}
            {state.iframeLoading && (
              <div className="w-64 h-64 flex items-center justify-center">
                <Loading size={30} />
              </div>
            )}
          </div>
          <div className="flex justify-center mt-2">
            <Button
              outline
              fullWidth
              onClick={() => {
                handleClose();
              }}
              className="mr-6"
            >
              {lang.cancel}
            </Button>
            <Button
              fullWidth
              isDoing={state.buttonLoading}
              onClick={() => {
                handleClose(true);
              }}
            >
              已支付
            </Button>
          </div>
          <div className="flex justify-center items-center mt-5 text-gray-400 text-12">
            <span className="flex items-center mr-1">
              <MdInfo className="text-16" />
            </span>
            {lang.noMixinOnYourPhone}
            <a
              className="text-gray-700 ml-1"
              href="https://mixin.one/messenger"
              target="_blank"
              rel="noopener noreferrer"
            >
              {lang.toDownload}
            </a>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
