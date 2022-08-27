import React from 'react';
import classNames from 'classnames';

export enum ListType {
  text = 'text',
  icon = 'icon',
}

interface IProps {
  listType: ListType
  setListType: (type: ListType) => void
}

export default (props: IProps) => (
  <div className="flex cursor-pointer text-12">
    <div
      className={classNames({
        'bg-gray-f2': props.listType !== ListType.icon,
      }, 'flex-1 h-[28px] flex items-center justify-center')}
      onClick={() => props.setListType(ListType.icon)}
    >
      图标模式
    </div>
    <div
      className={classNames({
        'bg-gray-f2': props.listType !== ListType.text,
      }, 'flex-1 h-[28px] flex items-center justify-center')}
      onClick={() => props.setListType(ListType.text)}
    >
      列表模式
    </div>
  </div>
);
