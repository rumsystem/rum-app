import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import { MdInfo } from 'react-icons/md';
import QrCode from 'react-qr-code';
import sleep from 'utils/sleep';

interface IProps {
  paymentUrl: string
  desc: string
}

export default async (props: IProps) => new Promise<boolean>((rs) => {
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
          <PayModal
            {...props}
            rs={(result: boolean) => {
              rs(result);
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

interface IPayModalProps extends IProps {
  rs: (result: boolean) => void
}

const PayModal = observer((props: IPayModalProps) => {
  const state = useLocalObservable(() => ({
    open: true,
    loading: false,
  }));

  const handleClose = (result: boolean) => {
    state.open = false;
    props.rs(result);
  };

  return (
    <Dialog
      open={state.open}
      onClose={() => {
        handleClose(false);
      }}
      hideCloseButton
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-0 text-center">
        <div className="py-8 px-14 text-center">
          <div className="text-18 font-bold text-gray-700 flex items-center justify-center">Mixin 扫码支付</div>
          <div className="text-13 mt-3 text-gray-6d">
            {props.desc}
          </div>
          <div className="relative overflow-hidden mt-5">
            <div className='w-64 h-64'>
              <QrCode value={props.paymentUrl} />
            </div>
          </div>
          <div className="flex justify-center mt-6">
            <Button
              outline
              fullWidth
              className="mr-4"
              onClick={() => {
                handleClose(false);
              }}
            >
              取消
            </Button>
            <Button
              fullWidth
              isDoing={state.loading}
              onClick={async () => {
                state.loading = true;
                await sleep(4000);
                handleClose(true);
              }}
            >
              {state.loading ? '核对中' : '我已支付'}
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
