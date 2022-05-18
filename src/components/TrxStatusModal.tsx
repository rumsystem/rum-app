import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import PubQueueApi, { IPubQueueTrx } from 'apis/pubQueue';
import ago from 'utils/ago';

interface IProps {
  trxId: string
  open: boolean
  onClose: () => void
}

const Trx = observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    pubQueueTrx: {} as IPubQueueTrx,
    isFetched: false,
    notFound: false,
  }));
  const { snackbarStore, activeGroupStore } = useStore();

  React.useEffect(() => {
    (async () => {
      try {
        const ret = await PubQueueApi.fetchTrxFromPubQueue(activeGroupStore.id, props.trxId);
        if (ret.Data && ret.Data[0]) {
          state.pubQueueTrx = ret.Data[0];
        } else {
          state.notFound = true;
        }
        state.isFetched = true;
        console.log({ ret });
      } catch (err) {
        console.error(err);
        snackbarStore.show({
          message: lang.failToLoad,
          type: 'error',
        });
      }
    })();
  }, [props.trxId]);

  if (!state.isFetched) {
    return null;
  }

  if (state.isFetched && state.notFound) {
    return (
      <div className="bg-white rounded-0 p-8">
        <div className="p-10 text-center text-14 text-gray-400">
          {lang.notFound(lang.block.toLocaleUpperCase())}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-0 p-8">
      <div className="pt-2 px-6 pb-5">
        <div className="text-18 font-bold text-gray-700 text-center pb-5">
          {lang.blockStatus}
        </div>
        <div className="p-6 text-gray-88 text-13 border border-gray-d8 rounded-0 shadow">
          <div className="flex items-center">
            <span className="w-22">ID：</span>
            <span className="text-gray-4a opacity-90">{state.pubQueueTrx.Trx.TrxId}</span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">{lang.status}：</span>
            <span className="text-gray-4a opacity-90">
              {state.pubQueueTrx.State === 'PENDING' && (
                <span>
                  {lang.pending}
                </span>
              )}
              {state.pubQueueTrx.State === 'FAIL' && (
                <span className="text-red-400">
                  {lang.fail}
                </span>
              )}
            </span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">{lang.retryCount}：</span>
            <span className="text-gray-4a opacity-90">{state.pubQueueTrx.RetryCount}</span>
          </div>
          <div className="mt-4 flex items-center">
            <span className="w-22">{lang.updateAt}：</span>
            <span className="text-gray-4a opacity-90">
              {ago(state.pubQueueTrx.UpdateAt)}
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
    <Trx {...props} />
  </Dialog>
));
