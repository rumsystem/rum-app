import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import sleep from 'utils/sleep';
import Loading from 'components/Loading';
import BackToTop from 'components/BackToTop';

export default observer((props: {
  open: boolean
  children: React.ReactNode
  onClose: () => void
  bottomElement?: () => React.ReactNode
}) => {
  const state = useLocalObservable(() => ({
    loading: true,
  }));
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    (async () => {
      await sleep(400);
      state.loading = false;
    })();
  }, []);

  return (
    <div>
      <Fade in={props.open} timeout={300}>
        <div className="fixed top-[150px] left-[280px] bottom-0 right-[10px] bg-gray-f7 flex justify-center py-8 z-10">
          <div className="flex flex-col w-full bg-white rounded-sm overflow-y-auto lg:w-[650px] box-border pt-7 px-11" ref={scrollRef}>
            {state.loading && (
              <div className="pt-16">
                <Loading size={18} />
              </div>
            )}
            {!state.loading && props.children}
            <div
              className="fixed top-[182px] left-0 ml-[276px] hidden lg:block xl:left-[50%] xl:ml-[-315px] cursor-pointer bg-white rounded-0 py-2"
              onClick={props.onClose}
            >
              <div className="flex items-center justify-center text-gray-88 px-7 py-2 relative leading-none">返回</div>
            </div>
            {!state.loading && props.bottomElement && props.bottomElement()}
          </div>
          <BackToTop rootRef={scrollRef} />
        </div>
      </Fade>
    </div>
  );
});
