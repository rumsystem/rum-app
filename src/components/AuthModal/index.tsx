import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { useStore } from 'store';
import { BiChevronRight } from 'react-icons/bi';
import Login from './Login';
import Signup from './Signup';

interface IProps {
  type: string;
  setType: (type: string) => void;
}

const Auth = (props: IProps) => {
  const { type } = props;
  const state = useLocalStore(() => ({
    accountType: 'user',
  }));

  return (
    <div>
      {type === 'entry' && (
        <div className="p-8 relative">
          <div className="w-60">
            <div
              className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
              onClick={() => {
                state.accountType = 'user';
                props.setType('signup');
              }}
            >
              <div>
                <div className="text-indigo-400">创建账号</div>
                <div className="text-gray-af text-12">第一次使用</div>
              </div>
              <BiChevronRight className="text-gray-bd text-20" />
            </div>
            <div
              className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
              onClick={() => {
                props.setType('login');
              }}
            >
              <div>
                <div className="text-indigo-400">登录账号</div>
                <div className="text-gray-af text-12">已经拥有账号</div>
              </div>
              <BiChevronRight className="text-gray-bd text-20" />
            </div>
            {/* <div
              className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
              onClick={() => {
                state.accountType = 'developer';
                props.setType('signup');
              }}
            >
              <div>
                <div className="text-indigo-400">创建开发者账号</div>
                <div className="text-gray-af text-12">在 PRS 链上开发应用</div>
              </div>
              <BiChevronRight className="text-gray-bd text-20" />
            </div> */}
          </div>
        </div>
      )}

      {type === 'signup' && (
        <Signup
          accountType={state.accountType}
          toLogin={() => {
            props.setType('login');
          }}
        />
      )}
      {type === 'login' && <Login />}
    </div>
  );
};

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.auth;
  const state = useLocalStore(() => ({
    type: 'entry',
  }));

  React.useEffect(() => {
    if (!open) {
      state.type = 'entry';
    }
  }, [open]);

  return (
    <Dialog
      hideCloseButton={state.type === 'entry'}
      disableBackdropClick={state.type === 'signup' || state.type === 'login'}
      open={open}
      onClose={() => {
        modalStore.auth.hide();
        state.type = 'entry';
      }}
      transitionDuration={{
        enter: 300,
      }}
    >
      <Auth type={state.type} setType={(type) => (state.type = type)} />
    </Dialog>
  );
});
