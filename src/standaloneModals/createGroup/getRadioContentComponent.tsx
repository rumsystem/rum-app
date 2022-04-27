import React from 'react';

export default (Icon: any, name: string, label?: string) => () => (
  (
    <div className="leading-none w-[174px] h-32 flex flex-col flex-center">
      <div className="-mt-2 h-[58px] flex flex-center overflow-hidden">
        <div className="transform scale-75">
          <Icon />
        </div>
      </div>
      <div className="mt-2 text-gray-6f font-bold">
        {name}
      </div>
      {label && (
        <div className="mt-2 text-gray-9c text-12">
          {label}
        </div>
      )}
    </div>
  )
);
