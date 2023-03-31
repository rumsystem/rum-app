import React, { useMemo } from 'react';
import { CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

export default (props: { size?: number, color?: string }) => {
  const { size } = props;

  const Bottom = useMemo(() => styled(CircularProgress)({
    color: props.color,
    opacity: 0.3,
  }), [props.color]);

  const Top = useMemo(() => styled(CircularProgress)({
    color: props.color,
    animationDuration: '550ms',
    position: 'absolute',
    left: 0,
  }), [props.color]);

  return (
    <div className="flex items-start justify-center">
      <div className="flex items-start relative">
        <Bottom
          className="relative"
          size={size || 22}
          variant="determinate"
          value={100}
        />
        <Top
          className="loading-top-circle absolute"
          size={size || 22}
          disableShrink
        />
      </div>
      <style>{`
        .loading-top-circle circle {
          stroke-linecap: round;
        }
      `}</style>
    </div>
  );
};
