import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import Switch from '@material-ui/core/Switch';

export default () => {
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
          <BetaFeaturesModal
            rs={() => {
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
};

const BetaFeaturesModal = observer((props: any) => {
  const state = useLocalObservable(() => ({
    open: true,
  }));
  const { betaFeatureStore } = useStore();

  const handleClose = (result: any) => {
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
      <div className="bg-white rounded-0 py-10">
        <div className="px-14 text-center">
          <div className="text-18 font-bold text-gray-700 flex items-center justify-center">Rum 实验室</div>
        </div>
        <div className="w-120 text-gray-9c px-12 pt-5 max-h-[60vh]">
          <div>
            欢迎体验实验中的新功能，可能会出现 Bug 请谨慎开启。
          </div>
          <div className="mt-2">
            欢迎加入种子网络：
            <span>xxx</span>
            帮助我们完善 Rum
          </div>
          <div className="pt-2 pb-6">
            <div className="flex justify-between items-center border border-gray-bf rounded mt-3 p-3">
              <div>
                <div className="text-gray-88 font-bold">支付功能</div>
                <div className="mt-1">开启可以建立收费种子网络</div>
              </div>
              <Switch
                checked={betaFeatureStore.betaFeatures.includes('PAID_GROUP')}
                color='primary'
                onClick={() => {
                  betaFeatureStore.toggle('PAID_GROUP');
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
