import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import sleep from 'utils/sleep';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import usePrevious from 'hooks/usePrevious';
import Tooltip from '@material-ui/core/Tooltip';
import { RiCheckDoubleFill, RiCheckLine } from 'react-icons/ri';

interface IProps {
  status: ContentStatus
  SyncedComponent?: any
  positionClassName?: string
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
    <div>
      {status === ContentStatus.syncing && (
        <Tooltip placement="top" title="正在同步到其他节点" arrow>
          <div
            className={`${
              props.positionClassName || ''
            } rounded-full text-gray-af text-12 leading-none font-bold tracking-wide`}
          >
            <RiCheckLine className="text-20" />
          </div>
        </Tooltip>
      )}
      {state.showSuccessChecker && (
        <div
          className={`${
            props.positionClassName || ''
          } rounded-full text-green-400 opacity-80  text-12 leading-none font-bold tracking-wide`}
        >
          <RiCheckDoubleFill className="text-20" />
        </div>
      )}
      {status === ContentStatus.synced
        && !state.showSuccessChecker
        && SyncedComponent && <SyncedComponent />}
    </div>
  );
});
