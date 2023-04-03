import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { TextField } from '@mui/material';
import { action } from 'mobx';
import { lang } from 'utils/lang';
import ProducerApi from 'apis/producer';
import { useStore } from 'store';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useCanIPost from 'hooks/useCanIPost';

interface IProps {
  open: boolean
  onClose: () => void
}

const Announce = observer((props: IProps) => {
  const { activeGroupStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    loading: false,
    isApprovedProducer: false,
    memo: '',
  }));
  const pollingTimerRef = React.useRef(0);
  const canIPost = useCanIPost();

  const handleSubmit = async () => {
    try {
      if (!state.memo) {
        snackbarStore.show({
          message: lang.input(lang.reason),
          type: 'error',
        });
        return;
      }
      await canIPost(activeGroupStore.id);
      if (state.loading) {
        return;
      }
      state.loading = true;
      const res = await ProducerApi.announce({
        group_id: activeGroupStore.id,
        action: state.isApprovedProducer ? 'remove' : 'add',
        type: 'producer',
        memo: state.memo,
      });
      console.log('[producer]: after announce', { res });
      pollingAfterAnnounce();
    } catch (err) {
      state.loading = false;
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
        const producers = await ProducerApi.fetchApprovedProducers(activeGroupStore.id) || [];
        state.isApprovedProducer = !!producers.find((producer) => producer.ProducerPubkey === activeGroup.user_pubkey);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const pollingAfterAnnounce = () => {
    pollingTimerRef.current = setInterval(async () => {
      try {
        const producers = await ProducerApi.fetchAnnouncedProducers(activeGroupStore.id);
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
        <div className="text-18 font-bold text-gray-700">{state.isApprovedProducer ? lang.announceToExit : lang.announceToBeProducer}</div>
        {state.isApprovedProducer && (
          <div className="pt-6 text-red-400 leading-loose">
            {lang.isProducer}<br />{lang.confirmToAnnounceExit}
          </div>
        )}
        <div className="pt-5">
          <TextField
            className="w-full"
            placeholder={lang.reason}
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
    transitionDuration={300}
  >
    <Announce {...props} />
  </Dialog>
));
