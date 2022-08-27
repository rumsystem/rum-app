import classNames from 'classnames';
import React from 'react';

interface Props {
  className?: string
  total: number
  value: number
}

export const StepBox = (props: Props) => (
  <div
    className={
      classNames(
        'flex justify-center items-center',
        props.className,
      )
    }
  >
    {Array(props.total).fill(0).map((_, i) => (
      <div className="flex items-center" key={i}>
        <div
          className={classNames(
            'rounded-full border border-black w-4 h-4',
            props.value >= i && 'bg-black',
            props.value < i && 'bg-white',
          )}
        />
        {props.total - 1 !== i && (
          <div className="w-4 border-t border-black opacity-40" />
        )}
      </div>
    ))}
  </div>
);
