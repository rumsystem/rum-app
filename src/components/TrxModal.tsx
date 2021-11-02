import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import MiddleTruncate from 'components/MiddleTruncate';
import { useStore } from 'store';
import GroupApi, { ITrx } from 'apis/group';

interface IProps {
  trxId: string
  open: boolean
  onClose: () => void
}

const Trx = observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    trx: {} as ITrx,
  }));
  const { snackbarStore, activeGroupStore } = useStore();

  React.useEffect(() => {
    (async () => {
      try {
        state.trx = await GroupApi.fetchTrx(activeGroupStore.id, props.trxId);
      } catch (err) {
        console.error(err);
        snackbarStore.show({
          message: '加载失败',
          type: 'error',
        });
      }
    })();
  }, [props.trxId]);

  return (
    <div className="bg-white rounded-12 p-8">
      <div className="pt-2 px-6 pb-5">
        <div className="text-18 font-bold text-gray-700 text-center pb-5">
          交易详情
        </div>
        <div className="p-6 text-gray-88 text-13 border border-gray-d8 rounded-12 shadow">
          <div className="flex items-center">
            <span className="w-22">ID：</span>
            <span className="text-gray-4a opacity-90">{state.trx.TrxId}</span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">群组 ID：</span>
            <span className="text-gray-4a opacity-90">{state.trx.GroupId}</span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">发送人：</span>
            <span className="text-gray-4a opacity-90">
              <MiddleTruncate string={state.trx.SenderPubkey} length={15} />
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">数据：</span>
            <span className="text-gray-4a opacity-90">
              <MiddleTruncate string={state.trx.Data} length={15} />
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">签名：</span>
            <span className="text-gray-4a opacity-90">
              <MiddleTruncate string={state.trx.SenderSign} length={15} />
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">时间戳：</span>
            <span className="text-gray-4a opacity-90">
              {state.trx.TimeStamp}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">版本：</span>
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
