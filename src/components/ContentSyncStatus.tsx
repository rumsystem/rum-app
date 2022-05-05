import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import sleep from 'utils/sleep';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import usePrevious from 'hooks/usePrevious';
import Tooltip from '@material-ui/core/Tooltip';
import { RiCheckDoubleFill, RiCheckLine } from 'react-icons/ri';
import { lang } from 'utils/lang';
import TrxStatusModal from 'components/TrxStatusModal';

interface IProps {
  groupId: string
  trxId: string
  status: ContentStatus
  SyncedComponent?: any
  positionClassName?: string
  alwaysShow?: boolean
}

export default observer((props: IProps) => {
  const { trxId, status, SyncedComponent } = props;
  const prevStatus = usePrevious(status);
  const state = useLocalObservable(() => ({
    showSuccessChecker: false,
    showTrxStatusModal: false,
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
        <Tooltip placement="top" title={lang.syncingContentTip2} arrow>
          <div
            className={`${
              props.positionClassName || 'mt-[-2px]'
            } rounded-full text-gray-af text-12 leading-none font-bold tracking-wide cursor-default`}
            onClick={() => {
              state.showTrxStatusModal = true;
            }}
          >
            <RiCheckLine className="text-18" />
          </div>
        </Tooltip>
      )}
      {state.showSuccessChecker && (
        <div
          className={`${
            props.positionClassName || 'mt-[-2px]'
          } rounded-full text-emerald-400 opacity-80  text-12 leading-none font-bold tracking-wide`}
        >
          <RiCheckDoubleFill className="text-18" />
        </div>
      )}
      {status === ContentStatus.synced
        && !state.showSuccessChecker
        && SyncedComponent && (
        <div
          className={props.alwaysShow ? '' : 'invisible group-hover:visible'}
          data-test-id="synced-timeline-item-menu"
        >
          <SyncedComponent />
        </div>
      )}
      <TrxStatusModal
        groupId={props.groupId}
        trxId={trxId}
        open={state.showTrxStatusModal}
        onClose={() => {
          state.showTrxStatusModal = false;
        }}
      />
    </div>
  );
});
