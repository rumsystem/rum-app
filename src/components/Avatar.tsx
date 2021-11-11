import React from 'react';
import { IProfile } from 'store/group';
import Loading from 'components/Loading';
import { Tooltip } from '@material-ui/core';

interface IProps {
  profile: IProfile
  size?: number
  className?: string
  loading?: boolean
  onClick?: () => void
}

export default (props: IProps) => {
  const size = props.size || 42;
  return (
    <div
      className={props.className}
      style={{
        height: size,
        width: size,
      }}
      onClick={props.onClick}
    >
      <div className="relative w-full h-full">
        <img
          className="rounded-full border-shadow overflow-hidden w-full h-full"
          src={props.profile.avatar}
          alt={props.profile.name}
        />
        {props.loading && (
          <Tooltip
            placement="bottom"
            title="正在同步个人资料"
            arrow
          >
            <div className="absolute top-[-4px] right-[-7px] rounded-full bg-black bg-opacity-70 flex flex-center p-[3px] z-10">
              <Loading size={size > 50 ? 16 : 12} color="#fff" />
            </div>
          </Tooltip>
        )}
        <style jsx>{`
          .border-shadow {
            border: 2px solid hsl(212, 12%, 90%);
          }
        `}</style>
      </div>
    </div>
  );
};
