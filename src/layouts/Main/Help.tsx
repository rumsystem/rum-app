import React from 'react';
import { IoIosHelp } from 'react-icons/io';
import { shell } from 'electron';

export default () => (
  <div className="fixed bottom-0 right-0 mb-6 pb-4 mr-10 cursor-pointer">
    <div
      className="rounded-full flex items-center justify-center leading-none w-10 h-10 border border-gray-af text-gray-af"
      onClick={() => {
        shell.openExternal('https://docs.prsdev.club/#/rum-app/');
      }}
    >
      <div className="text-40">
        <IoIosHelp />
      </div>
    </div>
  </div>
);
