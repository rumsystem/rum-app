import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import ago from 'utils/ago';
import { GroupStatus, IGroup } from 'apis/group';
import { Tooltip } from '@material-ui/core';
import { i18n } from 'store/i18n';
import { lang } from 'utils/lang';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import { render, unmountComponentAtNode } from 'react-dom';
import { action } from 'mobx';
import { IUser } from 'hooks/useDatabase/models/person';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';
import MiddleTruncate from 'components/MiddleTruncate';
import copy from 'copy-to-clipboard';

export const groupInfo = async (group: IGroup) => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <GroupInfo
            group={group}
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});


interface Props {
  group: IGroup
  rs: () => unknown
}

const GroupInfo = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    loading: true,
    open: true,
    owner: {} as IUser,
  }));
  const database = useDatabase();
  const { snackbarStore } = useStore();

  const handleClose = action(() => {
    state.open = false;
    props.rs();
  });

  const status = {
    [GroupStatus.IDLE]: lang.idle,
    [GroupStatus.SYNCING]: lang.syncing,
    [GroupStatus.SYNC_FAILED]: lang.syncFailed,
  };
  const width = i18n.state.lang === 'cn' ? 'w-20' : 'w-32';

  React.useEffect(() => {
    (async () => {
      const db = database;
      const user = await PersonModel.getUser(db, {
        GroupId: props.group.group_id,
        Publisher: props.group.owner_pubkey,
      });
      state.owner = user;
      state.loading = false;
    })();
  }, []);

  return (
    <Dialog
      open={state.open}
      onClose={handleClose}
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-0 p-8">
        <div className="pt-2 px-6 pb-5">
          <div className="text-18 font-bold text-gray-700 text-center pb-5">
            {lang.groupInfo}
          </div>
          <div className="p-6 text-gray-88 text-13 border border-gray-d8 rounded-0 shadow">
            <div className="flex items-center">
              <span className={width}>{lang.name}：</span>
              <span className="text-gray-4a opacity-90">
                {props.group.group_name}
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className={width}>ID：</span>
              <span className="text-gray-4a opacity-90">
                {props.group.group_id}
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className={width}>{lang.highestBlockId}：</span>
              <span className="text-gray-4a opacity-90">
                {props.group.highest_block_id}
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className={width}>{lang.owner}：</span>
              {!state.loading && (
                <div
                  className="text-gray-4a opacity-90"
                >
                  {state.owner.profile.name}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center">
              <span className={width}>公钥：</span>
              <span
                className="text-gray-4a opacity-90"
                onClick={() => {
                  copy(props.group.user_pubkey);
                  snackbarStore.show({
                    message: lang.copied,
                  });
                }}
              >
                <MiddleTruncate string={props.group.user_pubkey} length={15} />
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className={width}>ETH地址：</span>
              <span
                className="text-gray-4a opacity-90"
                onClick={() => {
                  copy(props.group.user_eth_addr);
                  snackbarStore.show({
                    message: lang.copied,
                  });
                }}
              >
                <MiddleTruncate string={props.group.user_eth_addr} length={15} />
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className={width}>{lang.highestHeight}：</span>
              <span className="text-gray-4a opacity-90">
                {props.group.highest_height}
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className={width}>{lang.lastUpdated}：</span>
              <span className="text-gray-4a opacity-90">
                {ago(props.group.last_updated)}
              </span>
            </div>
            <div className="mt-4 flex items-center">
              <span className={width}>{lang.status}：</span>
              <span className="text-gray-4a opacity-90">
                <Tooltip title={props.group.group_status} placement="right">
                  <span>
                    {status[props.group.group_status]}
                  </span>
                </Tooltip>
              </span>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
});
