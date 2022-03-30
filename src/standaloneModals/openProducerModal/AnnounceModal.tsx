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

interface IProps {
  open: boolean
  onClose: (effected?: boolean) => void
}

const Announce = observer((props: IProps) => {
  const { activeGroupStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    isApprovedProducer: false,
    memo: '',
  }));

  const handleSubmit = async () => {
    try {
      const res = await GroupApi.announce({
        group_id: activeGroupStore.id,
        action: state.isApprovedProducer ? 'remove' : 'add',
        type: 'producer',
        memo: state.memo,
      });
      console.log({ res });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    props.onClose(true);
  };

  React.useEffect(() => {
    (async () => {
      try {
        const producers = await GroupApi.fetchApprovedProducers(activeGroupStore.id);
        state.isApprovedProducer = producers.filter((producer) => producer.ProducerPubkey === activeGroup.user_pubkey).length > 0;
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  return (
    <div className="bg-white text-center py-8 px-12">
      <div className="w-60">
        <div className="text-18 font-bold text-gray-700">向群主发送申请</div>
        {state.isApprovedProducer && (
          <div className="pt-6 text-red-400 leading-loose">
            您当前是出块节点<br />想要退出吗？
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
          <Button fullWidth>{lang.yes}</Button>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose(false)}
    transitionDuration={{
      enter: 300,
    }}
  >
    <Announce {...props} />
  </Dialog>
));
