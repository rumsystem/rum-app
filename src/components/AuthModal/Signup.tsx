import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { TextField } from '@material-ui/core';
import { useStore } from 'store';
import { MdInfo } from 'react-icons/md';
import Button from 'components/Button';
import Loading from 'components/Loading';
import Fade from '@material-ui/core/Fade';
import { remote } from 'electron';
import fs from 'fs';
import util from 'util';
import { sleep, PrsAtm, Finance, isWindow } from 'utils';
import classNames from 'classnames';

const pWriteFile = util.promisify(fs.writeFile);

interface IProps {
  toLogin: () => void;
}

export default observer((props: IProps) => {
  const { snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    step: 1,
    accountName: '',
    password: '',
    confirmedPassword: '',
    loading: false,
    done: false,
    keystore: null as any,
    paymentUrl: '',
    iframeLoading: false,
    submittedPendingText: '请稍候，正在确认支付结果...',
  }));

  React.useEffect(() => {
    return () => {
      PrsAtm.tryCancelPolling();
    };
  }, []);

  const Step1 = () => {
    return (
      <div className="p-8">
        <div className="w-62">
          <div className="text-gray-9b text-center mt-1">
            <div>创建一个账号只需要三个步骤</div>
            <div className="mt-2">第一步：设置账户名和密码</div>
            <div className="mt-2">第二步：下载私钥文件</div>
            <div className="mt-2">第三步：支付 8 PRS 开通账户</div>
          </div>
          <div className="mt-4">
            <Button
              fullWidth
              onClick={() => {
                state.step = 2;
              }}
            >
              我知道了，开始创建账号
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const Step2 = () => {
    const submit = async () => {
      if (!state.accountName) {
        snackbarStore.show({
          message: '请输入用户名',
          type: 'error',
        });
        return;
      }
      if (state.accountName.length > 12) {
        snackbarStore.show({
          message: '用户名不能超过12位',
          type: 'error',
        });
        return;
      }
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
      try {
        state.keystore = await PrsAtm.fetch({
          id: 'createKeystore',
          actions: ['wallet', 'createKeystore'],
          args: [state.password],
        });
        const resp: any = await PrsAtm.fetch({
          id: 'openAccount',
          actions: ['atm', 'openAccount'],
          args: [state.accountName, state.keystore.publickey],
        });
        state.paymentUrl = resp.paymentUrl;
      } catch (err) {
        console.log(err);
        if (err.message.includes('Invalid account name')) {
          snackbarStore.show({
            message: '账户名只能包含字母和数字1-5，比如 ab12345',
            type: 'error',
            duration: 3000,
          });
        }
        if (err.message.includes('Account name already exists')) {
          snackbarStore.show({
            message: '账户名已存在',
            type: 'error',
          });
        }
        state.loading = false;
        return;
      }
      state.loading = false;
      state.done = true;
      await sleep(1000);
      state.done = false;
      state.step = 3;
    };
    return (
      <div className="p-8 px-12">
        <div className="w-65">
          <div className="text-gray-9b">
            <div className="text-gray-700 font-bold text-18 text-center">
              设置账户名和密码
            </div>
            <div className="mt-4 text-gray-9b">
              密码将用来生成私钥文件，密码越复杂，安全性越高。我们不会储存密码，也无法帮你找回，请务必妥善保管密码
            </div>
          </div>
          <div className="mt-2">
            <TextField
              className="w-full"
              placeholder="用户名，只能包含字母和数字1-5"
              size="small"
              value={state.accountName}
              onChange={(e) => {
                state.accountName = e.target.value.toLocaleLowerCase();
              }}
              margin="dense"
              variant="outlined"
            />
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
              onKeyDown={(e: any) => {
                if (e.keyCode === 13) {
                  e.preventDefault();
                  e.target.blur();
                  submit();
                }
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
              onClick={() => submit()}
            >
              生成私钥文件
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const Step3 = () => {
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
                  const file = await remote.dialog.showSaveDialog({
                    defaultPath: 'keystore.json',
                  });
                  if (!file.canceled && file.filePath) {
                    await pWriteFile(
                      file.filePath.toString(),
                      JSON.stringify(state.keystore)
                    );
                    await sleep(300);
                    state.step = 4;
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

  const Step4 = () => {
    return (
      <div className="p-8">
        <div className="w-62">
          <div className="text-gray-9b">
            <div className="text-gray-700 font-bold text-18 text-center">
              开通账户
            </div>
            <div className="mt-4 text-gray-9b py-2 text-center">
              离创建成功仅剩最后一步
              <div className="mt-2" />
              请支付 8 PRS 以开通账户
            </div>
          </div>
          <div className="mt-5">
            <Button
              fullWidth
              onClick={() => {
                state.step = 5;
                state.iframeLoading = true;
              }}
            >
              去支付
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const Step5 = () => {
    return (
      <div className="py-8 px-12 text-center">
        <div className="text-18 font-bold text-gray-700">Mixin 扫码支付</div>
        <div className="relative overflow-hidden">
          {state.paymentUrl && (
            <div
              className={classNames(
                {
                  hidden: state.iframeLoading,
                },
                'w-64 h-64'
              )}
            >
              <iframe
                onLoad={() => {
                  setTimeout(() => {
                    state.iframeLoading = false;
                  }, 1000);
                }}
                title="Mixin 扫码支付"
                src={Finance.replaceMixinDomain(state.paymentUrl)}
              />
              <style jsx>{`
                iframe {
                  height: 506px;
                  width: 800px;
                  position: absolute;
                  top: -238px;
                  left: 0;
                  margin-left: ${isWindow ? '-265px' : '-272px'};
                  transform: scale(0.9);
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
            className="mr-4"
            onClick={async () => {
              state.step = 4;
            }}
          >
            取消
          </Button>
          <Button
            fullWidth
            onClick={async () => {
              state.step = 6;
              (async () => {
                await sleep(3000);
                state.submittedPendingText = '正在开户...';
                await sleep(4000);
                state.submittedPendingText = '把你的账户提交到 PRS 链上...';
                await sleep(8000);
                state.submittedPendingText = '正在确认上链结果...';
              })();
              await PrsAtm.polling(async () => {
                try {
                  await PrsAtm.fetch({
                    id: 'getAccount',
                    actions: ['atm', 'getAccount'],
                    args: [state.accountName],
                  });
                  return true;
                } catch (_err) {
                  return false;
                }
              }, 1000);
              state.step = 7;
            }}
          >
            我已支付
          </Button>
        </div>
        <div className="flex justify-center items-center mt-5 text-gray-500 text-12">
          <span className="flex items-center mr-1">
            <MdInfo className="text-16" />
          </span>
          手机还没有安装 Mixin ?
          <a
            className="text-indigo-400 ml-1"
            href="https://mixin.one/messenger"
            target="_blank"
            rel="noopener noreferrer"
          >
            前往下载
          </a>
        </div>
      </div>
    );
  };

  const Step6 = () => {
    return (
      <div className="p-8">
        <div className="w-64">
          <div className="text-gray-9b text-center">
            <div className="text-gray-700 font-bold text-18">
              Mixin 扫码支付
            </div>
            <div className="py-12 flex items-center justify-center">
              <Loading size={30} />
            </div>
            <div className="text-gray-9b text-center">
              {state.submittedPendingText}
            </div>
            <div className="mt-2 text-xs text-gray-bd">
              你取消了支付？请
              <span
                className="text-indigo-400 cursor-pointer"
                onClick={() => {
                  state.step = 5;
                  state.iframeLoading = true;
                }}
              >
                返回
              </span>
              上一步
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Step7 = () => {
    return (
      <div className="p-8">
        <div className="w-64">
          <div className="text-gray-9b">
            <div className="text-gray-700 font-bold text-18 text-center">
              账号开通成功！
            </div>
            <div className="mt-4 text-gray-9b py-2 text-center">
              你的账号已经开通成功
              <div className="mt-2" />
              去登录你的账号吧
            </div>
          </div>
          <div className="mt-5">
            <Button
              fullWidth
              onClick={() => {
                props.toLogin();
              }}
            >
              前往登录
            </Button>
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
      {state.step === 6 && (
        <Fade in={true} timeout={500}>
          <div>{Step6()}</div>
        </Fade>
      )}
      {state.step === 7 && (
        <Fade in={true} timeout={500}>
          <div>{Step7()}</div>
        </Fade>
      )}
    </div>
  );
});
