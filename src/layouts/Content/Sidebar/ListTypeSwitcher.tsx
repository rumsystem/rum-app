import React from 'react';
import classNames from 'classnames';
import { lang } from 'utils/lang';
import { BiGridAlt, BiListUl } from 'react-icons/bi';

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
        'bg-gray-f2 text-gray-88': props.listType !== ListType.icon,
      }, 'flex-1 h-[28px] flex items-center justify-center')}
      onClick={() => props.setListType(ListType.icon)}
    >
      <BiGridAlt className="text-14 mr-1" />
      {lang.sidebarIconStyleMode}
    </div>
    <div
      className={classNames({
        'bg-gray-f2 text-gray-88': props.listType !== ListType.text,
      }, 'flex-1 h-[28px] flex items-center justify-center')}
      onClick={() => props.setListType(ListType.text)}
    >
      <BiListUl className="text-16 mr-1" />
      {lang.sidebarListStyleMode}
    </div>
  </div>
);
