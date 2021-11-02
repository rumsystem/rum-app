import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import { MdDone } from 'react-icons/md';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action } from 'mobx';

interface IProps {
  size?: number;
  color?: string;
  isDoing: boolean;
  isDone?: boolean;
  noMargin?: boolean;
  fixedDone?: boolean;
}

const ButtonProgress = observer((props: IProps) => {
  const state = useLocalObservable(() => ({
    isShowDone: false,
    isShowDoneTimer: 0,
  }));

  React.useEffect(action(() => {
    if (props.isDone) {
      state.isShowDone = true;
      if (!props.fixedDone) {
        state.isShowDoneTimer = window.setTimeout(action(() => {
          state.isShowDone = false;
        }), 1500);
      }
    }
  }), [props.isDone])

  React.useEffect(() => () => {
    window.clearTimeout(state.isShowDoneTimer);
  }, []);

  const { isDoing, color = 'text-white', size = 12 } = props;
  const { isShowDone } = state;

  if (isDoing) {
    return (
      <span className={`flex justify-center items-center ${color} w-5`}>
        <CircularProgress size={size} color="inherit" />
      </span>
    );
  }
  if (isShowDone) {
    return (
      <span
        className={`text-14 flex justify-center items-center w-5 mt-1-px ${color}`}
      >
        <MdDone className="ml-1-px" />
      </span>
    );
  }
  return null;
})

export default ButtonProgress;
