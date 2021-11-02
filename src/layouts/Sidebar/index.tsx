import React from 'react';
import { observer } from 'mobx-react-lite';
import { BiWallet, BiListUl, BiUser } from 'react-icons/bi';
import { MdSwapHoriz } from 'react-icons/md';
import { AiOutlineNodeIndex } from 'react-icons/ai';
import { useLocation, Link } from 'react-router-dom';
import classNames from 'classNames';

export default observer(() => {
  const location = useLocation();
  const baseClassName =
    'px-3 py-2 mb-1 flex items-center rounded cursor-pointer hover:bg-opacity-25 hover:bg-indigo-300 hover:text-indigo-500';
  const activeClassName = 'bg-opacity-25 bg-indigo-300 text-indigo-500';

  return (
    <div className="px-4 bg-gray-f7 border-r border-gray-f2 h-screen w-50 box-border flex flex-col justify-between">
      <div>
        <div className="flex items-center pt-4 px-2-px h-20">
          <img
            src="https://i.xue.cn/a19f111.jpg?image=&action=resize:w_100"
            alt="logo"
            width={36}
            className="rounded-full"
          />
          <div className="font-bold text-18 ml-3 text-gray-700">PRS ATM</div>
        </div>
        <div className="mt-4 text-gray-70">
          <Link to="/">
            <div
              className={classNames(
                {
                  [activeClassName]: location.pathname === '/',
                },
                baseClassName
              )}
            >
              <AiOutlineNodeIndex className="mr-2 text-22" />
              节点列表
            </div>
          </Link>
          <Link to="/exchange">
            <div
              className={classNames(
                {
                  [activeClassName]: location.pathname === '/exchange',
                },
                baseClassName
              )}
            >
              <MdSwapHoriz className="mr-2 text-22" />
              币种兑换
            </div>
          </Link>
          <Link to="/balance">
            <div
              className={classNames(
                {
                  [activeClassName]: location.pathname === '/balance',
                },
                baseClassName
              )}
            >
              <BiWallet className="mr-2 text-22" />
              我的余额
            </div>
          </Link>
          <Link to="/transaction">
            <div
              className={classNames(
                {
                  [activeClassName]: location.pathname === '/transaction',
                },
                baseClassName
              )}
            >
              <BiListUl className="mr-2 text-22" />
              交易记录
            </div>
          </Link>
          <Link to="/account">
            <div
              className={classNames(
                {
                  [activeClassName]: location.pathname === '/account',
                },
                baseClassName
              )}
            >
              <BiUser className="mr-2 text-22" />
              我的账号
            </div>
          </Link>
        </div>
      </div>
      <div className="pb-4">
        <div className="flex items-center justify-between pl-3 pr-2">
          <div className="text-center flex items-center text-gray-70">
            <BiUser className="mr-1 text-22" />华
          </div>
          <div className="cursor-pointer text-gray-9b">退出</div>
        </div>
      </div>
    </div>
  );
});
