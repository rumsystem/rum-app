import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Dialog } from '@material-ui/core';
import { useStore } from 'store';
import { BiChevronRight } from 'react-icons/bi';
import Login from './Login';
import Signup from './Signup';

const Auth = observer(() => {
  const state = useLocalStore(() => ({
    type: 'entry',
  }));

  return (
    <div>
      {state.type === 'entry' && (
        <div className="p-8">
          <div className="w-60">
            <div
              className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
              onClick={() => {
                state.type = 'signup';
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
                state.type = 'login';
              }}
            >
              <div>
                <div className="text-indigo-400">导入账号</div>
                <div className="text-gray-af text-12">已经拥有账号</div>
              </div>
              <BiChevronRight className="text-gray-bd text-20" />
            </div>
          </div>
        </div>
      )}

      {state.type === 'signup' && (
        <Signup
          toLogin={() => {
            state.type === 'login';
          }}
        />
      )}
      {state.type === 'login' && <Login />}
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.auth;

  return (
    <Dialog
      open={open}
      onClose={() => modalStore.auth.hide()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <Auth />
    </Dialog>
  );
});
