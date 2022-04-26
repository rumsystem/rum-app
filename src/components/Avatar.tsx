import React from 'react';
import { IProfile } from 'store/group';

interface IProps {
  profile: IProfile
  size?: number
  className?: string
  onClick?: () => void
}

export default (props: IProps) => (
  <div>
    <img
      className={`rounded-full border-shadow overflow-hidden ${
        props.className || ''
      }`}
      src={props.profile.avatar}
      alt={props.profile.name}
      width={props.size || 42}
      height={props.size || 42}
      onClick={() => {
        props.onClick?.();
      }}
    />
    <style jsx>{`
        .border-shadow {
          border: 2px solid hsl(212, 12%, 90%);
        }
      `}</style>
  </div>
);
