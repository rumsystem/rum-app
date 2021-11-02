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
        <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center snackbar-container">
          <div
            className={classNames(
              {
                'py-6 md:py-8': isLarge,
              },
              'bg-black p-5 rounded-12 text-white mask'
            )}
          >
            <div
              className={classNames(
                {
                  'text-42': isLarge,
                },
                'text-32 flex items-center justify-center pt-1'
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
                'mt-3 text-15 md:text-16 text-center content md:px-2 md:box-border'
              )}
            >
              {snackbarStore.message}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .snackbar-container {
          z-index: 999999;
        }
        .content {
          max-width: 150px;
          min-width: 98px;
        }
        .content.md {
          max-width: 200px;
        }
        .mask {
          background-color: rgba(0, 0, 0, 0.88);
        }
      `}</style>
    </div>
  );
});
