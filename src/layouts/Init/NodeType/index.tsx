import React from 'react';
import { BiChevronRight } from 'react-icons/bi';
import { lang } from 'utils/lang';

interface Props {
  onSelect: (v: 'login' | 'signup' | 'proxy' | 'wasm') => unknown
}

export const NodeType = (props: Props) => (
  <div className="p-8 relative">
    <div className="w-60 flex flex-col gap-y-4">
      {([
        { type: 'signup', text1: lang.signupNode, text2: lang.signupNodeTip },
        { type: 'login', text1: lang.loginNode, text2: lang.loginNodeTip },
        { type: 'proxy', text1: lang.externalNode, text2: lang.externalNodeTip },
        { type: 'wasm', text1: 'wasm', text2: 'wasm' },
      ] as const).map((v) => (
        <div
          className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer"
          key={v.type}
          onClick={() => props.onSelect(v.type)}
        >
          <div>
            <div className="text-gray-6d font-bold">{v.text1}</div>
            <div className="text-gray-af text-12 mt-[3px] tracking-wide">{v.text2}</div>
          </div>
          <BiChevronRight className="text-gray-bd text-20" />
        </div>
      ))}
    </div>
  </div>
);
