import React from 'react';
import { BsQuestion } from 'react-icons/bs';
import { shell } from 'electron';

export default () => (
  <div className="cursor-pointer">
    <div
      className="rounded-full flex items-center justify-center leading-none w-8 h-8 border border-gray-af text-gray-af"
      onClick={() => {
        shell.openExternal('https://docs.prsdev.club/#/rum-app/');
      }}
    >
      <div className="text-20">
        <BsQuestion />
      </div>
    </div>
  </div>
);
