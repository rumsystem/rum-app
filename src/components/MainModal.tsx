import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import sleep from 'utils/sleep';
import Loading from 'components/Loading';

export default observer((props: {
  open: boolean
  children: React.ReactNode
  onClose: () => void
}) => {
  const state = useLocalObservable(() => ({
    loading: true,
  }));

  React.useEffect(() => {
    (async () => {
      await sleep(600);
      state.loading = false;
    })();
  }, []);

  return (
    <div>
      <Fade in={props.open} timeout={300}>
        <div className="fixed top-[150px] left-[295px] bottom-0 right-[10px] bg-gray-f7 flex justify-center py-8 z-50">
          <div className="w-full bg-white rounded-sm overflow-y-auto lg:w-[700px] box-border pt-7 px-11">
            {state.loading && (
              <div className="pt-32">
                <Loading />
              </div>
            )}
            {!state.loading && props.children}
            <div
              className="fixed top-[182px] left-0 ml-[276px] hidden lg:block xl:left-[50%] xl:ml-[-340px] cursor-pointer bg-white rounded-12 py-2"
              onClick={props.onClose}
            >
              <div className="flex items-center justify-center text-gray-88 px-7 py-2 relative leading-none">返回</div>
            </div>
          </div>
        </div>
      </Fade>
    </div>
  );
});
