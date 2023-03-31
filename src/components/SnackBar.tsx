import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import classNames from 'classnames';

export default observer(() => {
  const { snackbarStore } = useStore();
  const isLarge = (snackbarStore.message || '').length >= 10;

  return (
    <div>
      {snackbarStore.open && (
        <div
          className="fixed top-[40px] left-0 w-screen h-screen flex items-center justify-center"
          style={{
            zIndex: 9999,
          }}
        >
          <div
            className={classNames(
              {
                'py-6 md:py-8': isLarge,
              },
              'bg-black p-5 rounded-0 text-white mask',
            )}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.88)',
            }}
          >
            <div
              className={classNames(
                {
                  'text-42': isLarge,
                },
                'text-32 flex items-center justify-center pt-1',
              )}
            >
              {snackbarStore.type === 'error' ? (
                <FaTimesCircle />
              ) : (
                <FaCheckCircle />
              )}
            </div>
            <div
              className={classNames(
                {
                  'box-content mt-4 px-1 md:mt-5 md:px-3 md': isLarge,
                },
                'mt-3 text-15 md:text-16 text-center content md:px-2 md:box-border',
              )}
              style={{
                maxWidth: isLarge ? '200px' : '150px',
                minWidth: '98px',
              }}
            >
              {snackbarStore.message}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
