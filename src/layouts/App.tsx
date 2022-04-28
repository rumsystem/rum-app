import React from 'react';
import classNames from 'classnames';

import { useStore } from 'store';

import { loadInspect } from 'utils/inspect';
import { TitleBar } from './TitleBar';
import { Init } from './Init';
import Content from './Content';

export default () => {
  const store = useStore();
  const [initDone, setInitDone] = React.useState(false);
  const [show, setShow] = React.useState(false);

  React.useEffect(() => loadInspect(), []);

  return (
    <div className="flex flex-col h-screen w-screen">
      {initDone && (
        <TitleBar />
      )}

      <div
        className={classNames(
          'flex-1 h-0 relative',
          !show && 'hidden',
        )}
      >
        {!initDone && (
          <Init
            onInitSuccess={() => {
              setInitDone(true);
              store.nodeStore.setConnected(true);
            }}
            onInitCheckDone={() => setShow(true)}
          />
        )}
        {initDone && (
          <Content />
        )}
      </div>
    </div>
  );
};
