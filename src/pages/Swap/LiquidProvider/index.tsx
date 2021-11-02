import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import classNames from 'classnames';
import In from './In';
import Out from './Out';
import { getQuery, removeQuery } from 'utils';
import { useHistory, useLocation } from 'react-router-dom';

export default observer(() => {
  const history = useHistory();
  const location = useLocation();
  const state = useLocalStore(() => ({
    type: getQuery('type') || 'in',
  }));

  React.useEffect(() => {
    if (getQuery('type')) {
      removeQuery('type');
      history.replace(location.pathname);
    }
  }, [state]);

  return (
    <div className="flex justify-center pt-10 exchanger">
      <div className="w-80 relative">
        <div className="flex items-center border-b border-gray-ec text-16 px-4 h-12 absolute top-0 left-0 z-20 w-full">
          <div
            className={classNames(
              {
                'font-bold text-indigo-400': state.type === 'in',
                'font-normal text-gray-bf': state.type !== 'in',
              },
              'py-2 px-4 cursor-pointer'
            )}
            onClick={() => {
              state.type = 'in';
            }}
          >
            注入
          </div>
          <div
            className={classNames(
              {
                'font-bold text-indigo-400': state.type === 'out',
                'font-normal text-gray-bf': state.type !== 'out',
              },
              'py-2 px-4 cursor-pointer'
            )}
            onClick={() => {
              state.type = 'out';
            }}
          >
            赎回
          </div>
        </div>
        {state.type === 'in' && <In />}
        {state.type === 'out' && <Out />}
      </div>
    </div>
  );
});
