import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Fade } from '@material-ui/core';

import Loading from 'components/Loading';
import * as Quorum from 'utils/quorum';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';

const LoadingTexts = [
  lang.startingNodeTip1,
  lang.startingNodeTip2,
  lang.startingNodeTip3,
  lang.startingNodeTip4,
  lang.startingNodeTip5,
];

export const StartingTips = observer(() => {
  const state = useLocalObservable(() => ({
    text: '',
  }));

  React.useEffect(() => {
    let stop = false;
    let updatingCount = 0;
    const run = async () => {
      const start = Date.now();
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (stop) {
          return;
        }
        const status = await Quorum.getStatus();
        if (status.data.up) {
          return;
        }
        if (status.data.quorumUpdating) {
          updatingCount += 1;
        }
        if (status.data.quorumUpdating && updatingCount >= 10) {
          state.text = lang.updatingQuorum;
        } else {
          const loopInterval = 10000;
          const index = Math.min(
            Math.floor((Date.now() - start) / loopInterval),
            LoadingTexts.length - 1,
          );
          const loadingText = LoadingTexts[index];
          state.text = loadingText;
        }
        await sleep(500);
      }
    };
    run();
    return () => { stop = true; };
  }, []);

  return (
    <div className="flex bg-white h-full items-center justify-center">
      <Fade in={true} timeout={500}>
        <div className="-mt-16">
          <Loading />
          <div className="mt-6 text-15 text-gray-9b tracking-widest">
            {state.text}
          </div>
        </div>
      </Fade>
    </div>
  );
});
