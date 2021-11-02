import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Button from 'components/Button';
import { useStore } from 'store';
import TextareaAutosize from 'react-textarea-autosize';
import GroupApi from 'apis/group';
import classNames from 'classnames';
import { sleep } from 'utils';
import useHasPermission from 'store/deriveHooks/useHasPermission';
import Loading from 'components/Loading';
import Tooltip from '@material-ui/core/Tooltip';

export default observer(() => {
  const { snackbarStore, activeGroupStore, groupStore, nodeStore } = useStore();
  const activeGroup = groupStore.map[activeGroupStore.id];
  const hasPermission = useHasPermission();
  const state = useLocalStore(() => ({
    content: '',
    loading: false,
    activeKeyA: false,
    activeKeyB: false,
  }));

  const startCheckJob = async (txId: string) => {
    let stop = false;
    let count = 1;
    while (!stop) {
      try {
        const contents = await GroupApi.fetchContents(activeGroupStore.id);
        const syncedContent =
          contents && contents.find((c) => c.TrxId === txId);
        if (syncedContent) {
          activeGroupStore.addContent(syncedContent);
          activeGroupStore.deletePendingContents([txId]);
          stop = true;
          if (
            syncedContent.TimeStamp >
            groupStore.latestContentTimeStampMap[activeGroupStore.id]
          ) {
            groupStore.setLatestContentTimeStamp(
              activeGroupStore.id,
              syncedContent.TimeStamp
            );
          }
          continue;
        }
        if (count === 6) {
          stop = true;
          activeGroupStore.markAsFailed(txId);
        } else {
          await sleep(Math.round(Math.pow(1.5, count) * 1000));
          count++;
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const submit = async () => {
    if (!state.content || state.loading) {
      return;
    }
    if (!hasPermission) {
      snackbarStore.show({
        message: '群组管理员已禁止你发布内容',
        type: 'error',
        duration: 2500,
      });
      return;
    }
    if (state.content.length > 5000) {
      snackbarStore.show({
        message: '内容不能多余 5000 字',
        type: 'error',
        duration: 2500,
      });
      return;
    }
    if (activeGroup.GroupStatus === 'GROUP_SYNCING') {
      snackbarStore.show({
        message: '等节点同步完成之后，才能发布内容哦',
        type: 'error',
        duration: 2500,
      });
      return;
    }
    state.loading = true;
    try {
      const payload = {
        type: 'Add',
        object: {
          type: 'Note',
          content: state.content,
          name: '',
        },
        target: {
          id: activeGroupStore.id,
          type: 'Group',
        },
      };
      const res = await GroupApi.postContent(payload);
      activeGroupStore.setJustAddedContentTrxId(res.trx_id);
      await sleep(800);
      const newContent = {
        TrxId: res.trx_id,
        Publisher: nodeStore.info.node_id,
        Content: {
          type: payload.object.type,
          content: payload.object.content,
        },
        TimeStamp: Date.now() * 1000000,
        Publishing: true,
      };
      activeGroupStore.addContent(newContent);
      activeGroupStore.addPendingContent(newContent);
      state.loading = false;
      state.content = '';
      startCheckJob(res.trx_id);
    } catch (err) {
      state.loading = false;
      console.error(err);
      snackbarStore.show({
        message: '貌似出错了',
        type: 'error',
      });
    }
  };

  return (
    <div className="rounded-12 bg-white pt-5 pb-4 px-6 w-full box-border">
      <div className="relative">
        <TextareaAutosize
          className="w-full textarea-autosize"
          placeholder="有什么想法？"
          minRows={2}
          value={state.content}
          onChange={(e) => {
            state.content = e.target.value;
          }}
          onKeyDown={(e: any) => {
            if ([91, 17, 18, 11].includes(e.keyCode)) {
              state.activeKeyA = true;
            } else if (e.keyCode === 13) {
              state.activeKeyB = true;
            }
            if (state.activeKeyA && state.activeKeyB) {
              state.activeKeyA = false;
              state.activeKeyB = false;
              submit();
            }
          }}
          onKeyUp={(e: any) => {
            if ([91, 17, 18, 11].includes(e.keyCode)) {
              state.activeKeyA = false;
            } else if (e.keyCode === 13) {
              state.activeKeyB = false;
            }
          }}
        />
        {state.loading && (
          <div className="absolute top-0 left-0 w-full z-10 bg-white opacity-60 flex items-center justify-center h-full">
            <div className="-mt-1">
              <Loading size={20} />
            </div>
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-end">
        <Tooltip
          enterDelay={1500}
          enterNextDelay={1500}
          placement="left"
          title="快捷键：Ctrl + Enter 或 Cmd + Enter"
          arrow
          interactive
        >
          <div>
            <Button
              size="small"
              className={classNames({
                'opacity-30': !state.content || state.loading,
              })}
              onClick={submit}
            >
              发布
            </Button>
          </div>
        </Tooltip>
      </div>
      <style jsx global>{`
        .textarea-autosize {
          color: rgba(0, 0, 0, 0.87);
          font-size: 14px;
          padding: 14px;
          font-weight: normal;
          border: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-radius: 4px;
          resize: none;
        }
        .textarea-autosize:focus {
          border-color: #333 !important;
          outline: none;
        }
      `}</style>
    </div>
  );
});
