import React from 'react';
import { BiChevronRight } from 'react-icons/bi';
import { lang } from 'utils/lang';
import { exportKeyData } from 'standaloneModals/exportKeyData';
import { importKeyData } from 'standaloneModals/importKeyData';

type NodeType = 'login' | 'signup' | 'proxy' | 'wasm';

interface Props {
  onSelect: (v: NodeType) => unknown
}

export const NodeType = (props: Props) => {
  const list = [
    !!process.env.IS_ELECTRON && { type: 'signup', text1: lang.signupNode, text2: lang.signupNodeTip },
    !!process.env.IS_ELECTRON && { type: 'login', text1: lang.loginNode, text2: lang.loginNodeTip },
    !!process.env.IS_ELECTRON && { type: 'proxy', text1: lang.externalNode, text2: lang.externalNodeTip },
    !process.env.IS_ELECTRON && { type: 'wasm', text1: lang.wasmNode, text2: lang.wasmNodeTip },
  ].filter(<T extends unknown>(v: T | false): v is T => !!v);

  const list2 = [
    !!process.env.IS_ELECTRON && { action: importKeyData, text1: lang.importKey },
    !!process.env.IS_ELECTRON && { action: exportKeyData, text1: lang.exportKey },
  ].filter(<T extends unknown>(v: T | false): v is T => !!v);

  return (
    <div className="p-8 relative">
      <div className="w-60 flex flex-col gap-y-4">
        {list.map((v) => (
          <div
            className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer"
            key={v.type}
            onClick={() => props.onSelect(v.type as NodeType)}
          >
            <div>
              <div className="text-gray-6d font-bold">{v.text1}</div>
              <div className="text-gray-af text-12 mt-[3px] tracking-wide">{v.text2}</div>
            </div>
            <BiChevronRight className="text-gray-bd text-20" />
          </div>
        ))}
        <div className="w-full border-t" />
        {list2.map((v) => (
          <div
            className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer"
            onClick={v.action}
          >
            <div>
              <div className="text-gray-6d font-bold">{v.text1}</div>
            </div>
            <BiChevronRight className="text-gray-bd text-20" />
          </div>
        ))}
      </div>
    </div>
  );
};
