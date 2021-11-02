import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  root: {
    position: 'relative',
  },
  bottom: {
    color: '#bee3f8',
    opacity: 0.4,
  },
  top: {
    color: '#63b3ed',
    animationDuration: '550ms',
    position: 'absolute',
    left: 0,
  },
  circle: {
    strokeLinecap: 'round',
  },
}));

export default (props: { size?: number }) => {
  const { size } = props;
  const classes = useStyles();
  return (
    <div className="flex items-start justify-center">
      <div className="flex items-start relative">
        <CircularProgress
          size={size || 26}
          className={classes.bottom}
          variant="determinate"
          value={100}
        />
        <CircularProgress
          size={size || 26}
          disableShrink
          className={classes.top}
          classes={{
            circle: classes.circle,
          }}
        />
      </div>
    </div>
  );
};
