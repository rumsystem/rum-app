import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Button from 'components/Button';
import { shell } from 'electron';
import Dialog from 'components/Dialog';
import { useStore } from 'store';

export default observer(() => {
  const { modalStore, accountStore } = useStore();
  const { account, publicKey } = accountStore;
  const state = useLocalStore(() => ({
    openKeyModal: false,
    privateKey: '',
  }));

  return (
    <div className="py-6 px-8">
      <div>
        <div className="font-bold text-16 text-gray-700">API 密钥</div>
        <div className="mt-2 pl-5 flex items-center">
          密钥：
          <Button
            size="mini"
            className="ml-2-px"
            onClick={() => {
              modalStore.verification.show({
                strict: true,
                pass: async (privateKey: string) => {
                  state.privateKey = privateKey;
                  state.openKeyModal = true;
                },
              });
            }}
          >
            查看
          </Button>
        </div>
        <Dialog
          maxWidth="xl"
          open={state.openKeyModal}
          onClose={() => {
            state.openKeyModal = false;
            state.privateKey = '';
          }}
          transitionDuration={{
            enter: 300,
          }}
        >
          <div className="bg-white rounded-12 p-8 pb-10">
            <div className="text-18 font-bold">API 密钥</div>
            <div className="bg-indigo-100 rounded p-5 mt-3">
              <pre>
                {'{\n'}
                {'  '}"accountName": "{account.account_name}",{'\n'}
                {'  '}"publicKey": "{publicKey}",{'\n'}
                {'  '}"privateKey": "{state.privateKey}"{'\n}'}
              </pre>
            </div>
          </div>
        </Dialog>
      </div>
      <div className="pt-6">
        <div className="font-bold text-16 text-gray-700">配置文件生成器</div>
        <div className="mt-2 pl-5 flex items-center">
          飞帖配置文件：
          <Button size="mini" className="ml-2-px">
            点击生成
          </Button>
        </div>
      </div>
      <div className="pt-6">
        <div className="font-bold text-16 text-gray-700">开发文档</div>
        <div className="mt-2 pl-5 flex items-center">
          查看如何使用 PRS API 开发应用：
          <Button
            size="mini"
            className="ml-2-px"
            onClick={() => {
              shell.openExternal('https://docs.prsdev.club/#/flying-pub/');
            }}
          >
            打开文档
          </Button>
        </div>
      </div>
      <div className="pt-6">
        <div className="font-bold text-16 text-gray-700">我的 API</div>
        <div className="pl-5">
          <div className="mt-3 flex items-center">
            从链上读取用户列表：
            <span
              className="text-indigo-400 cursor-pointer"
              onClick={() => {
                shell.openExternal(
                  `https://prs-bp1.press.one/api/pip2001?topic=${account.account_name}&count=10`
                );
              }}
            >
              https://prs-bp1.press.one/api/pip2001?topic=
              {account.account_name}&count=10
            </span>
          </div>
          <div className="mt-2 flex items-center">
            从链上读取文章列表：
            <span
              className="text-indigo-400 cursor-pointer"
              onClick={() => {
                shell.openExternal(
                  `https://prs-bp1.press.one/api/pip2001?topic=${account.account_name}&count=10`
                );
              }}
            >
              https://prs-bp1.press.one/api/pip2001?topic=
              {account.account_name}&count=10
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
