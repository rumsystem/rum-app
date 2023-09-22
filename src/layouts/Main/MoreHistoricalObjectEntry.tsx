import React from 'react';
import Badge from '@material-ui/core/Badge';
import { FiChevronDown } from 'react-icons/fi';

interface IProps {
  fetchUnreadObjects: () => void
  unreadCount: number
}

export default (props: IProps) => (
  <div className="cursor-pointer">
    <div
      className="rounded-full flex items-center justify-center leading-none w-8 h-8 border border-gray-af text-gray-af relative"
      onClick={props.fetchUnreadObjects}
    >
      <Badge
        className="transform scale-90 absolute top-0 right-0"
        classes={{
          badge: 'bg-gray-70 text-white',
        }}
        badgeContent={props.unreadCount}
        variant="standard"
        max={9999}
      />
      <div className="text-22 mt-1">
        <FiChevronDown />
      </div>
    </div>
  </div>
);
