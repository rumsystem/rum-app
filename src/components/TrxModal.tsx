import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import MiddleTruncate from 'components/MiddleTruncate';
import { useStore } from 'store';
import TrxApi, { ITrx } from 'apis/trx';
import { lang } from 'utils/lang';

interface IProps {
  groupId: string
  trxId: string
  open: boolean
  onClose: () => void
}

const Trx = observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    trx: {} as ITrx,
  }));
  const { snackbarStore } = useStore();

  React.useEffect(() => {
    (async () => {
      try {
        state.trx = await TrxApi.fetchTrx(props.groupId, props.trxId);
      } catch (err) {
        console.error(err);
        snackbarStore.show({
          message: lang.failToLoad,
          type: 'error',
        });
      }
    })();
  }, [props.trxId]);

  return (
    <div className="bg-white rounded-0 p-8">
      <div className="pt-2 px-6 pb-5">
        <div className="text-18 font-bold text-gray-700 text-center pb-5">
          {lang.blockInfo}
        </div>
        <div className="p-6 text-gray-88 text-13 border border-gray-d8 rounded-0 shadow">
          <div className="flex items-center">
            <span className="w-22">ID：</span>
            <span className="text-gray-4a opacity-90">{state.trx.TrxId}</span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">{lang.group} ID：</span>
            <span className="text-gray-4a opacity-90">{state.trx.GroupId}</span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">{lang.sender}：</span>
            <span className="text-gray-4a opacity-90">
              <MiddleTruncate string={state.trx.SenderPubkey} length={15} />
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">{lang.data}：</span>
            <span className="text-gray-4a opacity-90">
              <MiddleTruncate string={state.trx.Data} length={15} />
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">{lang.sign}：</span>
            <span className="text-gray-4a opacity-90">
              <MiddleTruncate string={state.trx.SenderSign} length={15} />
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">{lang.timestamp}：</span>
            <span className="text-gray-4a opacity-90">
              {state.trx.TimeStamp}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">{lang.version}：</span>
            <span className="text-gray-4a opacity-90">{state.trx.Version}</span>
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
    <Trx {...props} />
  </Dialog>
));
