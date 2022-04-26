import React from 'react';
import { BiChevronRight } from 'react-icons/bi';
import { lang } from 'utils/lang';

interface Props {
  onSelect: (v: 'login' | 'signup' | 'proxy') => unknown
}

export const NodeType = (props: Props) => (
  <div className="p-8 relative">
    <div className="w-60">
      <div
        className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer"
        onClick={() => props.onSelect('signup')}
      >
        <div>
          <div className="text-gray-6d font-bold">{lang.signupNode}</div>
          <div className="text-gray-af text-12 mt-[3px] tracking-wide">{lang.signupNodeTip}</div>
        </div>
        <BiChevronRight className="text-gray-bd text-20" />
      </div>
      <div
        className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer"
        onClick={() => props.onSelect('login')}
      >
        <div>
          <div className="text-gray-6d font-bold">{lang.loginNode}</div>
          <div className="text-gray-af text-12 mt-[3px] tracking-wide">{lang.loginNodeTip}</div>
        </div>
        <BiChevronRight className="text-gray-bd text-20" />
      </div>
      <div
        className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer"
        onClick={() => props.onSelect('proxy')}
      >
        <div>
          <div className="text-gray-6d font-bold">{lang.externalNode}</div>
          <div className="text-gray-af text-12 mt-[3px] tracking-wide">{lang.externalNodeTip}</div>
        </div>
        <BiChevronRight className="text-gray-bd text-20" />
      </div>
    </div>
  </div>
);
