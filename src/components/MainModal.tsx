import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Fade from '@material-ui/core/Fade';
import sleep from 'utils/sleep';
import Loading from 'components/Loading';
import BackToTop from 'components/BackToTop';
import { lang } from 'utils/lang';
import classNames from 'classnames';

export default observer((props: {
  open: boolean
  children: React.ReactNode
  onClose: () => void
  bottomElement?: () => React.ReactNode
  disableScroll?: boolean
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
        <div
          className={classNames(
            'fixed top-[112px] left-[280px] bottom-0 right-0 bg-gray-f7 flex pt-8 pb-5 z-10',
            props.disableScroll ? 'justify-center' : 'flex-col items-center overflow-y-auto',
          )}
        >
          <div
            className={classNames(
              'flex flex-col w-full bg-white rounded-sm lg:w-[650px] box-border pt-7 px-11',
              props.disableScroll && 'overflow-y-auto',
            )}
            ref={scrollRef}
          >
            {state.loading && (
              <div className="pt-16">
                <Loading size={18} />
              </div>
            )}
            {!state.loading && props.children}
            <div
              className="fixed top-[144px] left-0 ml-[276px] hidden lg:block xl:left-[50%] xl:ml-[-315px] cursor-pointer bg-white rounded-0 py-2"
              onClick={props.onClose}
            >
              <div className="flex items-center justify-center text-gray-88 px-7 py-2 relative leading-none">{lang.back}</div>
            </div>
            {!state.loading && props.bottomElement && props.bottomElement()}
          </div>
          <BackToTop rootRef={scrollRef} />
        </div>
      </Fade>
    </div>
  );
});
