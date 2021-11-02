import React from 'react';
import { MdArrowUpward } from 'react-icons/md';
import { getPageElement } from 'utils';
import useScroll from 'hooks/useScroll';

export default () => {
  const backToTop = () => {
    try {
      getPageElement().scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } catch (e) {
      getPageElement().scroll(0, 0);
    }
  };

  const scrollTop = useScroll();

  if (scrollTop < window.innerHeight / 2) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 right-0 mb-3 mr-2 cursor-pointer root "
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
