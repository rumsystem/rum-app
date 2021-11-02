import React from 'react';
import { MdArrowUpward } from 'react-icons/md';
import { getPageElement } from 'utils';

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

  return (
    <div
      className="fixed bottom-0 right-0 mb-3 mr-2 cursor-pointer root "
      onClick={backToTop}
    >
      <div className="rounded-full flex items-center justify-center leading-none w-8 h-8 bg-indigo-300 text-white">
        <div className="text-18">
          <MdArrowUpward />
        </div>
      </div>
    </div>
  );
};
