import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import MiddleTruncate from 'components/MiddleTruncate';
import ago from 'utils/ago';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { GroupStatus } from 'apis/group';
import { Tooltip } from '@material-ui/core';
import { i18n } from 'store/i18n';
import { lang } from 'utils/lang';

interface IProps {
  open: boolean
  onClose: () => void
}

const GroupInfo = observer(() => {
  const activeGroup = useActiveGroup();
  const status = {
    [GroupStatus.IDLE]: lang.idle,
    [GroupStatus.SYNCING]: lang.syncing,
    [GroupStatus.SYNC_FAILED]: lang.syncFailed,
  };
  const width = i18n.state.lang === 'cn' ? 'w-20' : 'w-32';

  return (
    <div className="bg-white rounded-0 p-8">
      <div className="pt-2 px-6 pb-5">
        <div className="text-18 font-bold text-gray-700 text-center pb-5">
          {lang.groupInfo}
        </div>
        <div className="p-6 text-gray-88 text-13 border border-gray-d8 rounded-0 shadow">
          <div className="flex items-center">
            <span className={width}>{lang.name}：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.group_name}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className={width}>ID：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.group_id}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className={width}>{lang.owner}：</span>
            <div className="text-gray-4a opacity-90">
              <MiddleTruncate string={activeGroup.owner_pubkey} length={15} />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={width}>{lang.highestBlockId}：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.highest_block_id}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className={width}>{lang.highestHeight}：</span>
            <span className="text-gray-4a opacity-90">
              {activeGroup.highest_height}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className={width}>{lang.lastUpdated}：</span>
            <span className="text-gray-4a opacity-90">
              {ago(activeGroup.last_updated)}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className={width}>{lang.status}：</span>
            <span className="text-gray-4a opacity-90">
              <Tooltip title={activeGroup.group_status} placement="right">
                <span>
                  {status[activeGroup.group_status]}
                </span>
              </Tooltip>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose()}
    transitionDuration={{
      enter: 300,
    }}
  >
    <GroupInfo />
  </Dialog>
));
