import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Button from 'components/Button';
import { useStore } from 'store';
import TextareaAutosize from 'react-textarea-autosize';
import GroupApi from 'apis/group';
import classNames from 'classnames';
import { sleep } from 'utils';

export default observer(() => {
  const { snackbarStore, groupStore } = useStore();
  const state = useLocalStore(() => ({
    content: '',
    loading: false,
  }));

  const submit = async () => {
    if (!state.content || state.loading) {
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
          id: groupStore.id,
          type: 'Group',
        },
      };
      const res = await GroupApi.postContent(payload);
      groupStore.setJustAddedContentTrxId(res.trx_id);
      let stop = false;
      let count = 1;
      let syncedContent = null;
      while (!stop && !syncedContent) {
        try {
          const contents = await GroupApi.fetchContents(groupStore.id);
          syncedContent =
            contents && contents.find((c) => c.TrxId === res.trx_id);
          if (syncedContent) {
            groupStore.addContents([syncedContent]);
            stop = true;
            continue;
          }
          if (count === 3) {
            stop = true;
          } else {
            await sleep(1000);
            count++;
          }
        } catch (err) {
          console.log(err.message);
        }
      }
      if (!syncedContent) {
        const cachedNewContent = {
          TrxId: res.trx_id,
          Publisher: '',
          Content: {
            type: payload.object.type,
            content: payload.object.content,
          },
          TimeStamp: Date.now() * 1000000,
        };
        groupStore.saveCachedNewContentToStore(cachedNewContent);
        groupStore.addContents([cachedNewContent]);
      }
      state.loading = false;
      state.content = '';
    } catch (err) {
      state.loading = false;
      console.log(err.message);
      snackbarStore.show({
        message: '貌似出错了',
        type: 'error',
      });
    }
  };

  return (
    <div className="rounded-12 bg-white px-8 pt-5 pb-4 w-[600px] box-border">
      <TextareaAutosize
        className="w-full textarea-autosize"
        placeholder="有什么想法？"
        minRows={2}
        value={state.content}
        autoFocus={true}
        onChange={(e) => {
          state.content = e.target.value;
        }}
      />
      <div className="mt-1 flex justify-end">
        <Button
          size="small"
          className={classNames({
            'opacity-50': !state.content,
          })}
          isDoing={state.loading}
          onClick={submit}
        >
          发布
        </Button>
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
          border-color: #7f9cf5 !important;
          outline: none;
        }
      `}</style>
    </div>
  );
});
