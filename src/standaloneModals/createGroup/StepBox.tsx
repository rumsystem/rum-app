import classNames from 'classnames';
import React from 'react';

interface Props {
  className?: string
  total: number
  value: number
  onSelect?: (i: number) => unknown
}

export const StepBox = (props: Props) => (
  <div
    className={
      classNames(
        'flex justify-center items-center gap-x-6',
        props.className,
      )
    }
  >
    {Array(props.total).fill(0).map((_, i) => (
      <div
        className={classNames(
          'rounded-full border border-black w-4 h-4 cursor-pointer',
          props.value === i && 'bg-black',
          props.value !== i && 'bg-white',
        )}
        onClick={() => props.onSelect?.(i)}
        key={i}
      />
    ))}
  </div>
);
