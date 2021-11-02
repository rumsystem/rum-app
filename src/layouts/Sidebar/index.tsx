import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { MdSwapHoriz } from 'react-icons/md';
import { BiUser, BiChevronRight, BiCircle } from 'react-icons/bi';
import { AiOutlineNodeIndex } from 'react-icons/ai';
// import { AiOutlineLineChart } from 'react-icons/ai';
import { useLocation, Link } from 'react-router-dom';
import classNames from 'classnames';
import { useStore } from 'store';
import Button from 'components/Button';
import { PrsAtm } from 'utils';
import { remote } from 'electron';
import Tooltip from '@material-ui/core/Tooltip';
import AccountManagerModal from './AccountManagerModal';

export default observer(() => {
  const { accountStore, modalStore } = useStore();
  const { isLogin, isDeveloper } = accountStore;
  const location = useLocation();
  const state = useLocalStore(() => ({
    version: '',
    openAccountManagerModal: false,
  }));
  const baseClassName =
    'px-3 py-2 mb-1 flex items-center rounded-md cursor-pointer hover:bg-opacity-25 hover:bg-indigo-300 hover:text-indigo-400';
  const activeClassName = 'bg-opacity-25 bg-indigo-300 text-indigo-400';
  const useContrastBg = location.pathname === '/group';

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
    <div
      className={classNames(
        {
          'bg-gray-f7 opacity-[0.65]': useContrastBg,
        },
        'px-4 border-r border-gray-f2 h-screen w-50 box-border flex flex-col justify-between'
      )}
    >
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
                {isDeveloper ? '开发者账号' : '我的账号'}
              </div>
            </Link>
          )}
          {!isDeveloper && (
            <div>
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
              <Link to="/group">
                <div
                  className={classNames(
                    {
                      [activeClassName]: location.pathname === '/group',
                    },
                    baseClassName
                  )}
                >
                  <BiCircle className="mr-2 text-22" />
                  圈子
                </div>
              </Link>
              {/* <Link to="/chaindata">
                <div
                  className={classNames(
                    {
                      [activeClassName]: location.pathname === '/chaindata',
                    },
                    baseClassName
                  )}
                >
                  <AiOutlineLineChart className="mr-2 text-22" />
                  链上数据
                </div>
              </Link> */}
            </div>
          )}
        </div>
      </div>
      <div className="pb-3">
        {accountStore.isLogin && (
          <div className="flex items-center justify-between pl-1">
            <div className="text-center flex items-center text-gray-70 font-bold">
              <BiUser className="mr-1 text-20" />
              {accountStore.account.account_name}
            </div>
            <div
              className="cursor-pointer text-gray-9b text-12 mt-4-px flex items-center -mr-1"
              onClick={() => {
                state.openAccountManagerModal = true;
              }}
            >
              管理 <BiChevronRight className="-ml-2-px text-18" />
            </div>
            <AccountManagerModal
              open={state.openAccountManagerModal}
              onClose={() => (state.openAccountManagerModal = false)}
            />
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
