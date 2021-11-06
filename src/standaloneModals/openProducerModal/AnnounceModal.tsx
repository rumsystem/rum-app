import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField } from '@material-ui/core';
import { action } from 'mobx';
import { lang } from 'utils/lang';
import GroupApi from 'apis/group';
import { useStore } from 'store';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useGroupStatusCheck from 'hooks/useGroupStatusCheck';

interface IProps {
  open: boolean
  onClose: () => void
}

const Announce = observer((props: IProps) => {
  const { activeGroupStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const groupStatusCheck = useGroupStatusCheck();
  const state = useLocalObservable(() => ({
    loading: false,
    isApprovedProducer: false,
    memo: '',
  }));
  const pollingTimerRef = React.useRef(0);

  const handleSubmit = async () => {
    try {
      if (!groupStatusCheck(activeGroupStore.id)) {
        return;
      }
      if (state.loading) {
        return;
      }
      state.loading = true;
      const res = await GroupApi.announce({
        group_id: activeGroupStore.id,
        action: state.isApprovedProducer ? 'remove' : 'add',
        type: 'producer',
        memo: state.memo,
      });
      console.log('[producer]: after announce', { res });
      pollingAfterAnnounce();
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  React.useEffect(() => {
    (async () => {
      try {
        const producers = await GroupApi.fetchApprovedProducers(activeGroupStore.id);
        state.isApprovedProducer = !!producers.find((producer) => producer.ProducerPubkey === activeGroup.user_pubkey);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const pollingAfterAnnounce = () => {
    pollingTimerRef.current = setInterval(async () => {
      try {
        const producers = await GroupApi.fetchAnnouncedProducers(activeGroupStore.id);
        console.log('[producer]: pollingAfterAnnounce', { producers, groupId: activeGroupStore.id });
        const isAnnouncedProducer = !!producers.find((producer) => producer.AnnouncedPubkey === activeGroup.user_pubkey && producer.Result === 'ANNOUNCED' && producer.Action === (state.isApprovedProducer ? 'REMOVE' : 'ADD'));
        if (isAnnouncedProducer) {
          clearInterval(pollingTimerRef.current);
          state.loading = false;
          props.onClose();
        }
      } catch (err) {
        console.error(err);
      }
    }, 1000) as any;
  };

  React.useEffect(() => () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }
  }, []);

  return (
    <div className="bg-white text-center py-8 px-12">
      <div className="w-60">
        <div className="text-18 font-bold text-gray-700">{state.isApprovedProducer ? '申请退出' : '申请成为出块节点'}</div>
        {state.isApprovedProducer && (
          <div className="pt-6 text-red-400 leading-loose">
            您当前是出块节点<br />想要申请退出吗？
          </div>
        )}
        <div className="pt-5">
          <TextField
            className="w-full"
            placeholder="理由（可选）"
            size="small"
            multiline
            minRows={3}
            value={state.memo}
            onChange={action((e) => { state.memo = e.target.value; })}
            margin="dense"
            variant="outlined"
            type="memo"
          />
        </div>
        <div className="mt-6" onClick={handleSubmit}>
          <Button fullWidth isDoing={state.loading}>{lang.yes}</Button>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={props.onClose}
    transitionDuration={{
      enter: 300,
    }}
  >
    <Announce {...props} />
  </Dialog>
));
