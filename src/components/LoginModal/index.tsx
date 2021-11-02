import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Dialog, TextField } from '@material-ui/core';
import { useStore } from 'store';
import { BiChevronRight } from 'react-icons/bi';
import Button from 'components/Button';
import Fade from '@material-ui/core/Fade';
import { remote } from 'electron';
import fs from 'fs';
import util from 'util';
import { sleep, PrsAtm } from 'utils';

const pWriteFile = util.promisify(fs.writeFile);

const Login = observer(() => {
  const { snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    step: 1,
    password: '123123abc',
    confirmedPassword: '123123abc',
    loading: false,
    done: false,
    keystore: {} as any,
  }));

  const Step1 = () => {
    return (
      <div className="p-8">
        <div className="w-60">
          <div
            className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
            onClick={() => {
              state.step = 2;
            }}
          >
            <div>
              <div className="text-indigo-400">创建账号</div>
              <div className="text-gray-af text-12">第一次使用</div>
            </div>
            <BiChevronRight className="text-gray-bd text-20" />
          </div>
          <div className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer">
            <div>
              <div className="text-indigo-400">登录账号</div>
              <div className="text-gray-af text-12">已经拥有账号</div>
            </div>
            <BiChevronRight className="text-gray-bd text-20" />
          </div>
        </div>
      </div>
    );
  };

  const Step2 = () => {
    return (
      <div className="p-8">
        <div className="w-58">
          <div className="text-gray-9b text-center">
            <div>创建一个账号只需要两个步骤</div>
            <div className="mt-2">第1步：设置密码</div>
            <div className="mt-2">第2步：下载私钥文件</div>
            <div className="mt-2">
              然后你用<strong className="text-indigo-400">密码</strong>和
              <strong className="text-indigo-400">私钥文件</strong>即可登录
            </div>
          </div>
          <div className="mt-4">
            <Button
              fullWidth
              onClick={() => {
                state.step = 3;
              }}
            >
              我知道了，开始创建账号
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const Step3 = () => {
    return (
      <div className="p-8 px-12">
        <div className="w-65">
          <div className="text-gray-9b">
            <div className="text-gray-700 font-bold text-18 text-center">
              设置密码
            </div>
            <div className="mt-4 text-gray-9b">
              密码将用来生成私钥文件，密码越复杂，安全性越高。我们不会储存密码，也无法帮你找回，请务必妥善保管密码
            </div>
          </div>
          <div className="mt-2">
            <TextField
              className="w-full"
              type="password"
              placeholder="密码"
              size="small"
              value={state.password}
              onChange={(e) => {
                state.password = e.target.value;
              }}
              margin="dense"
              variant="outlined"
            />
            <TextField
              className="w-full"
              type="password"
              placeholder="重复输入密码"
              size="small"
              value={state.confirmedPassword}
              onChange={(e) => {
                state.confirmedPassword = e.target.value;
              }}
              margin="dense"
              variant="outlined"
            />
          </div>
          <div className="mt-5">
            <Button
              fullWidth
              isDoing={state.loading}
              isDone={state.done}
              onClick={async () => {
                if (!state.password) {
                  snackbarStore.show({
                    message: '请输入密码',
                    type: 'error',
                  });
                  return;
                }
                if (state.password.length < 8) {
                  snackbarStore.show({
                    message: '密码至少8位',
                    type: 'error',
                  });
                  return;
                }
                if (state.password !== state.confirmedPassword) {
                  snackbarStore.show({
                    message: '密码不一致',
                    type: 'error',
                  });
                  return;
                }
                state.loading = true;
                state.done = false;
                state.keystore = await PrsAtm.fetch({
                  id: 'createKeystore',
                  actions: ['wallet', 'createKeystore'],
                  args: [state.password],
                });
                state.loading = false;
                state.done = true;
                await sleep(1000);
                state.done = false;
                state.step = 4;
              }}
            >
              生成私钥文件
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const Step4 = () => {
    return (
      <div className="p-8">
        <div className="w-64">
          <div className="text-gray-9b">
            <div className="text-gray-700 font-bold text-18 text-center">
              下载私钥文件
            </div>
            <div className="mt-4 text-gray-9b">
              <strong>私钥文件（Keystore.json）</strong>
              是储存私钥的一个文件，我们不会储存这个私钥文件，也无法帮你找回，请务必妥善保管
            </div>
          </div>
          <div className="mt-5">
            <Button
              fullWidth
              onClick={async () => {
                try {
                  const { dialog } = remote;
                  const file = await dialog.showSaveDialog({
                    defaultPath: 'keystore.json',
                  });
                  if (!file.canceled && file.filePath) {
                    await pWriteFile(
                      file.filePath.toString(),
                      JSON.stringify(state.keystore)
                    );
                    await sleep(300);
                    state.step = 5;
                  }
                } catch (err) {
                  console.log(err);
                }
              }}
            >
              点击下载
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const Step5 = () => {
    return (
      <div className="p-8">
        <div className="w-64">
          <div className="text-gray-9b">
            <div className="text-gray-700 font-bold text-18 text-center">
              创建成功！
            </div>
            <div className="mt-4 text-gray-9b py-2 text-center">
              你的账号已经创建成功
              <div className="mt-2" />
              去使用<strong className="text-indigo-400">私钥文件</strong>和
              <strong className="text-indigo-400">密码</strong>
              登录吧
            </div>
          </div>
          <div className="mt-5">
            <Button fullWidth>前往登录</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {state.step === 1 && (
        <Fade in={true} timeout={500}>
          <div>{Step1()}</div>
        </Fade>
      )}
      {state.step === 2 && (
        <Fade in={true} timeout={500}>
          <div>{Step2()}</div>
        </Fade>
      )}
      {state.step === 3 && (
        <Fade in={true} timeout={500}>
          <div>{Step3()}</div>
        </Fade>
      )}
      {state.step === 4 && (
        <Fade in={true} timeout={500}>
          <div>{Step4()}</div>
        </Fade>
      )}
      {state.step === 5 && (
        <Fade in={true} timeout={500}>
          <div>{Step5()}</div>
        </Fade>
      )}
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.login;
  return (
    <Dialog
      open={open}
      onClose={() => modalStore.login.hide()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <Login />
    </Dialog>
  );
});
