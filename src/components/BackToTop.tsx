import React from 'react';
import { MdArrowUpward } from 'react-icons/md';
import useScroll from 'hooks/useScroll';
import { getPageElement } from 'utils/domSelector';
import { observer, useLocalObservable } from 'mobx-react-lite';

interface IProps {
  rootRef: React.RefObject<HTMLElement>
}

const BackToTop = (props: IProps) => {
  const element = props.rootRef.current;

  const back = () => {
    try {
      (element || getPageElement()).scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (e) {
      (element || getPageElement()).scroll(0, 0);
    }
  };

  const scrollTop = useScroll({
    element,
  });

  if (scrollTop < window.innerHeight / 2) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 right-0 mb-6 pb-4 mr-28 cursor-pointer"
      onClick={back}
    >
      <div className="rounded-full flex items-center justify-center leading-none w-10 h-10 border border-gray-af text-gray-af">
        <div className="text-20">
          <MdArrowUpward />
        </div>
      </div>
    </div>
  );
};

export default observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    pending: true,
  }));

  React.useEffect(() => {
    setTimeout(() => {
      state.pending = false;
    }, 500);
  }, [state]);

  if (state.pending) {
    return null;
  }

  return <BackToTop {...props} />;
});
