import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
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

export default observer((props: IProps) => (
  <div className="flex cursor-pointer text-12 mx-4 mb-2 border border-gray-ec rounded">
    <div
      className={classNames({
        'bg-gray-f2 text-gray-af': props.listType !== ListType.icon,
        'text-gray-33': props.listType === ListType.icon,
      }, 'flex-1 h-[24px] flex items-center justify-center')}
      onClick={() => props.setListType(ListType.icon)}
    >
      <BiGridAlt className="text-14 mr-1" />
      {lang.sidebarIconStyleMode}
    </div>
    <div
      className={classNames({
        'bg-gray-f2 text-gray-af': props.listType !== ListType.text,
        'text-gray-33': props.listType === ListType.text,
      }, 'flex-1 h-[24px] flex items-center justify-center')}
      onClick={() => props.setListType(ListType.text)}
    >
      <BiListUl className="text-16 mr-1" />
      {lang.sidebarListStyleMode}
    </div>
  </div>
));
