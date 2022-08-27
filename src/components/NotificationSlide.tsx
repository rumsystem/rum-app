import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import classNames from 'classnames';
import { AiFillCheckCircle, AiOutlineCloseCircle, AiFillCloseCircle } from 'react-icons/ai';
import { shell } from '@electron/remote';
import Loading from 'components/Loading';

export default observer(() => {
  const { notificationSlideStore } = useStore();
  const { open, message, link, type } = notificationSlideStore;

  return (
    <div className={classNames({
      'translate-x-[-240px]': open,
    }, 'w-[230px] right-[-230px] fixed top-[120px] bg-white transition-all ease-in duration-300 px-4 py-3 rounded-12 flex items-center justify-between shadow-lg border border-gray-c4 z-[9999]')}
    >
      <div className="flex items-center">
        {type === 'pending' && (
          <div className="text-gray-700 text-24">
            <Loading size={24} />
          </div>
        )}
        {type === 'success' && (
          <div className="text-green-400 text-24">
            <AiFillCheckCircle />
          </div>
        )}
        {type === 'failed' && (
          <div className="text-red-400 text-24">
            <AiFillCloseCircle />
          </div>
        )}
        <div className="ml-[14px]">
          <div className={classNames({
            'text-gray-700': type === 'pending',
            'text-green-500': type === 'success',
            'text-red-400': type === 'failed',
          })}
          >
            {message}
          </div>
          {link.text && (
            <div
              className="mt-1 text-blue-400 text-12 cursor-pointer"
              onClick={() => {
                shell.openExternal(link.url);
              }}
            >
              {link.text}
            </div>
          )}
        </div>
      </div>
      <div
        className="text-gray-400 text-24 cursor-pointer"
        onClick={() => {
          notificationSlideStore.close();
        }}
      >
        <AiOutlineCloseCircle />
      </div>
    </div>
  );
});
