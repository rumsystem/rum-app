import React from 'react';
import { MdArrowUpward } from 'react-icons/md';
import useScroll from 'hooks/useScroll';
import { getPageElement } from 'utils';

interface IProps {
  element?: HTMLElement;
}

export default (props?: IProps) => {
  const backToTop = () => {
    try {
      ((props && props.element) || getPageElement()).scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (e) {
      ((props && props.element) || getPageElement()).scroll(0, 0);
    }
  };

  const scrollTop = useScroll({
    element: props && props.element,
  });

  if (scrollTop < window.innerHeight / 2) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 right-0 mb-6 pb-4 mr-5 cursor-pointer"
      onClick={backToTop}
    >
      <div className="rounded-full flex items-center justify-center leading-none w-10 h-10 bg-indigo-300 text-white">
        <div className="text-20">
          <MdArrowUpward />
        </div>
      </div>
    </div>
  );
};
