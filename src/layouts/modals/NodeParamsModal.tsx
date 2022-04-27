import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import copy from 'copy-to-clipboard';
import { lang } from 'utils/lang';
import { clipboard } from '@electron/remote';
import sleep from 'utils/sleep';
import Loading from 'components/Loading';

interface IProps {
  open: boolean
  onClose: () => void
}

const MyNodeInfo = observer(() => {
  const state = useLocalObservable(() => ({
    loading: true,
  }));
  const {
    nodeStore,
    snackbarStore,
  } = useStore();
  const { cert, port } = nodeStore.apiConfig;

  const handleCopy = () => {
    clipboard.writeText(cert);
    snackbarStore.show({
      message: lang.copied,
    });
  };

  React.useEffect(() => {
    (async () => {
      await sleep(500);
      state.loading = false;
    })();
  }, []);

  return (
    <div className="bg-white rounded-0 p-8">
      <div className="w-72 relative">
        {state.loading && (
          <div className="flex items-center justify-center absolute inset-0 bg-white z-10">
            <Loading size={18} />
          </div>
        )}
        <div className="text-18 font-bold text-gray-700 text-center">
          {lang.nodeParams}
        </div>
        <div className="mt-6">
          <div className="text-gray-500 font-bold opacity-90">{lang.port}</div>
          <div className="flex mt-2">
            <div className="p-2 pl-3 border border-gray-200 text-gray-500 bg-gray-100 text-12 truncate flex-1 rounded-l-0 border-r-0">
              {port}
            </div>
            <Button
              className="rounded-r-0"
              size="small"
              onClick={() => {
                copy(String(port));
                snackbarStore.show({
                  message: lang.copied,
                });
              }}
            >
              {lang.copy}
            </Button>
          </div>
          <div className="mt-6">
            <div className="text-gray-500 font-bold opacity-90">{lang.tslCert}</div>
            <div className="relative">
              <div className="mt-2 text-12 text-gray-500 bg-gray-100 border border-gray-200 py-4 px-4 break-words h-50 overflow-y-auto">
                {cert}
              </div>
              <div className="absolute top-0 right-0 bg-black text-white p-1 px-[18px] text-12 cursor-pointer" onClick={handleCopy}>
                {lang.copied}
              </div>
            </div>
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
    <MyNodeInfo />
  </Dialog>
));
