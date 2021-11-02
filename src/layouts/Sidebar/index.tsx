import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { MdSwapHoriz } from 'react-icons/md';
import { BiUser } from 'react-icons/bi';
import { AiOutlineNodeIndex } from 'react-icons/ai';
import { BsClipboardData } from "react-icons/bs";
import { useLocation, Link, useHistory } from 'react-router-dom';
import classNames from 'classnames';
import { useStore } from 'store';
import Button from 'components/Button';
import { PrsAtm } from 'utils';
import { remote } from 'electron';
import Tooltip from '@material-ui/core/Tooltip';

export default observer(() => {
  const { accountStore, modalStore, confirmDialogStore } = useStore();
  const { isLogin } = accountStore;
  const location = useLocation();
  const history = useHistory();
  const state = useLocalStore(() => ({
    version: '',
  }));
  const baseClassName =
    'px-3 py-2 mb-1 flex items-center rounded-md cursor-pointer hover:bg-opacity-25 hover:bg-indigo-300 hover:text-indigo-400';
  const activeClassName = 'bg-opacity-25 bg-indigo-300 text-indigo-400';

  React.useEffect(() => {
    (async () => {
      const version = await PrsAtm.fetch({
        actions: ['getVersion'],
        logging: true,
      });
      state.version = version as string;
    })();
  }, []);

  return (
    <div className="px-4 border-r border-gray-f2 h-screen w-50 box-border flex flex-col justify-between">
      <div>
        <div className="pt-5 flex justify-center">
          <img
            src="https://i.xue.cn/48ef28.png?image=&action=resize:w_144"
            alt="logo"
            width={72}
          />
        </div>
        <div className="pt-3 mt-2-px">
          <Tooltip
            placement="bottom"
            title={`App 版本：${remote.app.getVersion()}，Lib 版本：${
              state.version
            }`}
            arrow
          >
            <div>
              <div className="flex justify-center">
                <img
                  src="https://i.xue.cn/f23728.png?image=&action=resize:w_168"
                  alt="logo"
                  width={80}
                />
              </div>
              <div className="text-12 text-gray-af mt-6-px flex justify-center">
                <span>{remote.app.getVersion()}</span>
              </div>
            </div>
          </Tooltip>
        </div>
        <div className="mt-10 text-gray-70">
          {isLogin && (
            <Link to="/dashboard">
              <div
                className={classNames(
                  {
                    [activeClassName]: location.pathname === '/dashboard',
                  },
                  baseClassName
                )}
              >
                <BiUser className="mr-2 text-22" />
                我的账号
              </div>
            </Link>
          )}
          <Link to="/producer">
            <div
              className={classNames(
                {
                  [activeClassName]: location.pathname === '/producer',
                },
                baseClassName
              )}
            >
              <AiOutlineNodeIndex className="mr-2 text-22" />
              节点投票
            </div>
          </Link>
          <Link to="/swap">
            <div
              className={classNames(
                {
                  [activeClassName]: location.pathname === '/swap',
                },
                baseClassName
              )}
            >
              <MdSwapHoriz className="mr-2 text-22" />
              币币兑换
            </div>
          </Link>
          <Link to="/chaindata">
            <div
              className={classNames(
                {
                  [activeClassName]: location.pathname === '/data',
                },
                baseClassName
              )}
            >
              <BsClipboardData className="mr-2 text-22" />
              链上数据
            </div>
          </Link>
        </div>
      </div>
      <div className="pb-3">
        {accountStore.isLogin && (
          <div className="flex items-center justify-between pl-2 pr-1">
            <div className="text-center flex items-center text-gray-70">
              <BiUser className="mr-1 text-20" />
              {accountStore.account.account_name}
            </div>
            <div
              className="cursor-pointer text-gray-9b text-12 mt-4-px"
              onClick={() => {
                confirmDialogStore.show({
                  contentClassName: 'text-left',
                  content:
                    '务必妥善备份并保管你的私钥文件、账号名及密码等；如你不慎遗失或泄露，将无法找回！<br /><br />请不要使用公共电脑登入。使用个人电脑登入时，最好经常退出再登入，以检查你是否妥善保管好了登录信息。',
                  okText: '确认退出',
                  isDangerous: true,
                  ok: () => {
                    confirmDialogStore.hide();
                    accountStore.removeAccount();
                    history.replace('/producer');
                  },
                });
              }}
            >
              退出
            </div>
          </div>
        )}
        {!accountStore.isLogin && (
          <div className="flex justify-center">
            <Button fullWidth onClick={() => modalStore.auth.show()}>
              登录账号
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
