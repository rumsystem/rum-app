import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import { MdDone } from 'react-icons/md';

interface IProps {
  size?: number;
  color?: string;
  isDoing: boolean;
  isDone?: boolean;
  noMargin?: boolean;
}

interface IState {
  isShowDone: boolean;
}

export default class ButtonProgress extends React.Component<IProps, IState> {
  private isShowDoneTimer = 0;
  constructor(props: any) {
    super(props);
    this.state = {
      isShowDone: false,
    };
  }

  componentWillReceiveProps(nextProps: any) {
    const isDoneChangedFromFalseToTrue = !this.props.isDone && nextProps.isDone;
    if (isDoneChangedFromFalseToTrue) {
      this.setState({ isShowDone: true });
      this.isShowDoneTimer = window.setTimeout(() => {
        this.setState({ isShowDone: false });
      }, 1500);
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.isShowDoneTimer);
  }

  render() {
    const { isDoing, color = 'text-white', size = 12 } = this.props;
    const { isShowDone } = this.state;
    if (isDoing) {
      return (
        <span className={`flex justify-center items-center ${color} ml-1`}>
          <CircularProgress size={size} color="inherit" />
        </span>
      );
    }
    if (isShowDone) {
      return (
        <span className={`ml-1 font-bold`}>
          <MdDone className={`${color}"`} />
        </span>
      );
    }
    return null;
  }
}
