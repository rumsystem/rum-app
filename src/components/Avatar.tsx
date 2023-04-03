import React, { useMemo } from 'react';
import Loading from 'components/Loading';
import { Tooltip } from '@mui/material';
import defaultAvatar from 'assets/default_avatar.png';
import Base64 from 'utils/base64';

interface IProps {
  avatar?: string | { mediaType: string, content: string }
  size?: number
  className?: string
  loading?: boolean
  onClick?: () => void
  'data-test-id'?: string
}

export default (props: IProps) => {
  const size = props.size || 42;
  const url = useMemo(() => {
    if (!props.avatar) { return defaultAvatar; }
    if (typeof props.avatar === 'string') {
      return props.avatar;
    }
    return Base64.getUrl(props.avatar);
  }, [props.avatar]);
  return (
    <div
      className={props.className}
      style={{
        height: size,
        width: size,
      }}
      onClick={props.onClick}
      data-test-id={props['data-test-id']}
    >
      <div className="relative w-full h-full">
        <img
          className="rounded-full border-shadow overflow-hidden w-full h-full"
          src={url}
          alt="avatar"
        />
        {props.loading && (
          <Tooltip
            placement={size > 50 ? 'top' : 'bottom'}
            title="正在同步个人资料"
            arrow
            disableInteractive
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
