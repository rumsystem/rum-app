import React from 'react';
import { IProfile } from 'store/group';
import { CircularProgress } from '@material-ui/core';

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
          <div className="absolute rounded-full bg-opacity-30 bg-gray-4a flex flex-center inset-0 pointer-events-none">
            <CircularProgress
              size={size * 0.5}
            />
          </div>
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
