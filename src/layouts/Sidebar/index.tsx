import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { BiUser } from 'react-icons/bi';
import { MdSwapHoriz } from 'react-icons/md';
import { AiOutlineNodeIndex } from 'react-icons/ai';
import { useLocation, Link, useHistory } from 'react-router-dom';
import classNames from 'classNames';
import { useStore } from 'store';
import Button from 'components/Button';
import { PrsAtm } from 'utils';

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
        id: 'getVersion',
        actions: ['getVersion'],
      });
      state.version = version as string;
    })();
  }, []);

  return (
    <div className="px-4 border-r border-gray-f2 h-screen w-50 box-border flex flex-col justify-between">
      <div>
        <div className="flex items-center pt-4 px-2-px h-20">
          <img
            src="https://i.xue.cn/a19f111.jpg?image=&action=resize:w_100"
            alt="logo"
            width={38}
            className="rounded-full"
          />
          <div className="ml-3">
            <div className="font-bold text-18 text-gray-700">PRS ATM</div>
            <div className="text-12 text-gray-af -mt-3-px">{state.version}</div>
          </div>
        </div>
        <div className="mt-4 text-gray-70">
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
        </div>
      </div>
      <div className="pb-3">
        {accountStore.isLogin && (
          <div className="flex items-center justify-between pl-2 pr-1">
            <div className="text-center flex items-center text-gray-70">
              <BiUser className="mr-1 text-20" />华
            </div>
            <div
              className="cursor-pointer text-gray-9b text-12 mt-4-px"
              onClick={() => {
                confirmDialogStore.show({
                  contentClassName: 'text-left',
                  content:
                    '退出账号后将删除临时保存的账号数据，请务必确保你的私钥文件已经备份保存好，以便下次可以正常登陆',
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
