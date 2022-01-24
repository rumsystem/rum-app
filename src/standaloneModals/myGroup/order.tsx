import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { MdArrowDropDown, MdArrowDropUp } from 'react-icons/md';
import { observer } from 'mobx-react-lite';

interface Props {
  className?: string
  order: string | undefined | null
  onClick?: (order: string) => unknown
  // fullWidth?: boolean
  // size?: 'large' | 'normal' | 'small' | 'mini' | 'tiny'
  // color?: 'primary' | 'gray' | 'red' | 'green' | 'white' | 'yellow'
  // disabled?: boolean
  // children?: React.ReactNode
  // outline?: boolean
  // isDoing?: boolean
  // isDone?: boolean
  // hideText?: boolean
  // fixedDone?: boolean
  // noRound?: boolean
}

export default observer((props: Props) => {
  const {
    onClick,
    className,
    order,
  } = props;

  const handleClick = action(() => {
    if (!onClick && typeof onClick !== 'function') {
      return;
    }
    if (order === 'desc') {
      onClick('asc');
    } else if (order === 'asc') {
      onClick('');
    } else {
      onClick('desc');
    }
  });

  return (
    <div
      className={classNames(
        className,
        'cursor-pointer',
      )}
      onClick={handleClick}
    >
      <MdArrowDropUp
        className={classNames(
          'translate-y-1/3',
          order === 'desc' && 'text-gray-9c',
        )}
      />
      <MdArrowDropDown
        className={classNames(
          '-translate-y-1/3',
          order === 'asc' && 'text-gray-9c',
        )}
      />
    </div>
  );
});
