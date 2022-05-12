import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import sleep from 'utils/sleep';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import usePrevious from 'hooks/usePrevious';
import Tooltip from '@material-ui/core/Tooltip';
import { RiCheckDoubleFill, RiCheckLine } from 'react-icons/ri';
import { lang } from 'utils/lang';

interface IProps {
  status: ContentStatus
  SyncedComponent?: any
  positionClassName?: string
  alwaysShow?: boolean
}

export default observer((props: IProps) => {
  const { status, SyncedComponent } = props;
  const prevStatus = usePrevious(status);
  const state = useLocalObservable(() => ({
    showSuccessChecker: false,
  }));

  React.useEffect(() => {
    if (
      prevStatus === ContentStatus.syncing
      && status === ContentStatus.synced
    ) {
      (async () => {
        state.showSuccessChecker = true;
        await sleep(3000);
        state.showSuccessChecker = false;
      })();
    }
  }, [prevStatus, status]);

  return (
    <div className="h-[14px] overflow-hidden">
      {status === ContentStatus.syncing && (
        <Tooltip placement="top" title={lang.syncingContentTip2} arrow>
          <div
            className={`${
              props.positionClassName || 'mt-[-2px]'
            } rounded-full text-gray-af text-12 leading-none font-bold tracking-wide`}
          >
            <RiCheckLine className="text-18" />
          </div>
        </Tooltip>
      )}
      {state.showSuccessChecker && (
        <div
          className={`${
            props.positionClassName || 'mt-[-2px]'
          } rounded-full text-green-400 opacity-80  text-12 leading-none font-bold tracking-wide`}
        >
          <RiCheckDoubleFill className="text-18" />
        </div>
      )}
      {status === ContentStatus.synced
        && !state.showSuccessChecker
        && SyncedComponent && (
        <div className={props.alwaysShow ? '' : 'invisible group-hover:visible'}>
          <SyncedComponent />
        </div>
      )}
    </div>
  );
});
