import React from 'react';
import classNames from 'classnames';
import ButtonProgress from 'components/ButtonProgress';

interface Props {
  className?: string
  onClick?: () => unknown
  fullWidth?: boolean
  size?: 'x-large' | 'large' | 'normal' | 'small' | 'mini' | 'tiny'
  color?: 'primary' | 'gray' | 'red' | 'green' | 'white' | 'yellow' | 'orange'
  disabled?: boolean
  children?: React.ReactNode
  outline?: boolean
  isDoing?: boolean
  isDone?: boolean
  hideText?: boolean
  fixedDone?: boolean
  noRound?: boolean
  'data-test-id'?: string
}

export default (props: Props) => {
  const {
    className,
    onClick,
    fullWidth = false,
    size = 'normal',
    color = 'primary',
    disabled,
    outline = false,
    isDoing = false,
    isDone = false,
    fixedDone = false,
    hideText = false,
    noRound = true,
    'data-test-id': testId,
  } = props;

  return (
    <button
      className={classNames(
        'button button-comp',
        className,
        {
          'w-full': fullWidth,
          [size]: size,
          'bg-gray-33 text-white': !outline && color === 'primary',
          'bg-gray-d8 text-white': !outline && color === 'gray',
          'bg-emerald-400 text-white': !outline && color === 'green',
          'bg-red-400 text-white': !outline && color === 'red',
          'bg-[#ff931e] text-white': !outline && color === 'yellow',
          'bg-[#f1973f] text-white': !outline && color === 'orange',
          'border-gray-33 text-black border outline':
            outline && color === 'primary',
          'border-red-400 text-red-400 border outline':
            outline && color === 'red',
          'border-emerald-500 text-emerald-500 border outline':
            outline && color === 'green',
          'border-white text-white border outline':
            outline && color === 'white',
          'border-gray-9b text-gray-9b border outline':
            outline && color === 'gray',
          'border-[#ff931e] text-[#ff931e] border outline':
            outline && color === 'yellow',
          'border-[#f1973f] text-[#f1973f] border outline':
            outline && color === 'orange',
          'rounded-full': !noRound,
        },
        'outline-none leading-none',
      )}
      onClick={() => {
        onClick?.();
      }}
      disabled={disabled}
      data-test-id={testId}
    >
      <div className="flex justify-center items-center">
        {!hideText && props.children}
        <ButtonProgress
          isDoing={isDoing}
          isDone={isDone}
          fixedDone={fixedDone}
          color={outline ? 'text-gray-33' : 'text-white'}
          size={hideText ? 15 : 12}
        />
      </div>
      <style>{`
        .button-comp.tiny {
          min-width: 45px;
          font-size: 12px;
          padding: 5px 7px;
        }
        .button-comp.tiny.outline {
          padding: 4px 6px;
        }
        .button-comp.mini {
          min-width: 45px;
          font-size: 12px;
          padding: 6px 12px;
        }
        .button-comp.mini.outline {
          padding: 5px 11px;
        }
        .button-comp.small {
          min-width: 60px;
          font-size: 13px;
          padding: 7px 14px;
        }
        .button-comp.small.outline {
          padding: 6px 13px;
        }
        .button-comp.normal {
          font-size: 14px;
          padding: 9px 24px;
        }
        .button-comp.normal.w-full {
          font-size: 15px;
          padding: 11px 24px;
        }
        .button-comp.normal.outline {
          padding: 8px 23px;
        }
        .button-comp.large {
          font-size: 15px;
          padding: 11px 24px;
        }
        .button-comp.large.w-full {
          font-size: 16px;
          padding: 11px 24px;
        }
        .button-comp.large.outline {
          padding: 10px 23px;
        }
        .button-comp.x-large {
          font-size: 16px;
          padding: 11px 24px;
        }
        .button-comp.x-large.w-full {
          font-size: 17px;
          padding: 11px 24px;
        }
        .button-comp.x-large.outline {
          padding: 10px 23px;
        }
        .button-comp[disabled] {
          color: rgba(0, 0, 0, 0.45);
          background-color: rgba(0, 0, 0, 0.12);
          border-color: rgba(0, 0, 0, 0.12);
        }
      `}</style>
    </button>
  );
};
