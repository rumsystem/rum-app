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
    (element || getPageElement()).scroll(0, 0);
  };

  const scrollTop = useScroll({
    element,
  });

  if (scrollTop < window.innerHeight / 2) {
    return null;
  }

  return (
    <div
      className="cursor-pointer"
      onClick={back}
    >
      <div className="rounded-full flex items-center justify-center leading-none w-8 h-8 border border-gray-af text-gray-af">
        <div className="text-16">
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
