import React from 'react';
import { BiChevronRight } from 'react-icons/bi';

interface Props {
  onSelect: (v: 'login' | 'signup') => unknown
}

export const NodeType = (props: Props) => (
  <div className="p-8 relative">
    <div className="w-60">
      <div
        className="border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer"
        onClick={() => props.onSelect('signup')}
      >
        <div>
          <div className="text-gray-6d font-bold">创建节点</div>
          <div className="text-gray-af text-12 mt-[3px] tracking-wide">第一次使用</div>
        </div>
        <BiChevronRight className="text-gray-bd text-20" />
      </div>
      <div
        className="mt-4 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-10 cursor-pointer"
        onClick={() => props.onSelect('login')}
      >
        <div>
          <div className="text-gray-6d font-bold">登录节点</div>
          <div className="text-gray-af text-12 mt-[3px] tracking-wide">已经拥有节点</div>
        </div>
        <BiChevronRight className="text-gray-bd text-20" />
      </div>
    </div>
  </div>
);
