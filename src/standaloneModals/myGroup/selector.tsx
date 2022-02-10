import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { MdArrowDropDown, MdArrowDropUp } from 'react-icons/md';
import { RiCheckboxBlankLine, RiCheckboxFill, RiCheckboxIndeterminateLine, RiCheckLine } from 'react-icons/ri';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Popover } from '@material-ui/core';
import { lang } from 'utils/lang';
import Button from 'components/Button';

interface Props {
  className?: string
  onClick?: () => unknown
  fullWidth?: boolean
  size?: 'large' | 'normal' | 'small' | 'mini' | 'tiny'
  color?: 'primary' | 'gray' | 'red' | 'green' | 'white' | 'yellow'
  disabled?: boolean
  children?: React.ReactNode
  outline?: boolean
  isDoing?: boolean
  isDone?: boolean
  hideText?: boolean
  fixedDone?: boolean
  noRound?: boolean
}

export default observer((props: Props) => {
  const state = useLocalObservable(() => ({
    showMenu: false,
  }));

  const selector = React.useRef<HTMLDivElement>(null);

  const handleMenuClose = action(() => { state.showMenu = false; });

  const {
    className,
  } = props;

  return (
    <>
      <div
        className={classNames(
          className,
          'h-6 flex items-stretch bg-white rounded border cursor-pointer',
        )}
        onClick={() => {
          state.showMenu = !state.showMenu;
        }}
        ref={selector}
      >
        <div className="w-25 flex items-center justify-center text-12 text-gray-6f">全部类型</div>
        {
          state.showMenu ? (
            <div className="w-6 flex items-center justify-center text-24 text-producer-blue border rounded m-[-1px]"><MdArrowDropUp /></div>
          ) : (
            <div className="w-6 flex items-center justify-center text-24 text-gray-6f border rounded m-[-1px]"><MdArrowDropDown /></div>

          )
        }
      </div>
      <Popover
        open={state.showMenu}
        onClose={handleMenuClose}
        anchorEl={selector.current}
        PaperProps={{
          className: 'mt-0.5 px-4 py-3 flex flex-col items-stretch gap-y-2',
          elevation: 2,
        }}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        transformOrigin={{
          horizontal: 'center',
          vertical: 'top',
        }}
      >
        <div className="flex items-center justify-between text-12">
          <div className="flex items-start">
            <RiCheckboxBlankLine className="text-16 text-producer-blue cursor-pointer" />
            <RiCheckboxFill className="text-16 text-producer-blue cursor-pointer" />
            <RiCheckboxIndeterminateLine className="text-16 text-producer-blue cursor-pointer" />
            全选
          </div>
          <div className="current-pointer rounded border px-2.5 flex items-center justify-center">反选</div>
        </div>
        <div
          className={classNames(
            'px-3 py-2 flex items-center rounded border gap-x-3',
            false && 'bg-gray-f2',
          )}
        >
          <RiCheckLine
            className={classNames(
              'bg-white text-15 cursor-pointer border rounded',
              false ? 'text-gray-af border-gray-f2' : 'text-white border-gray-af',
            )}
          />
          <div className="text-gray-4a">{lang.sns}</div>
        </div>
        <div
          className={classNames(
            'px-3 py-2 flex items-center rounded border gap-x-3',
            true && 'bg-gray-f2',
          )}
        >
          <RiCheckLine
            className={classNames(
              'bg-white text-15 cursor-pointer border rounded',
              true ? 'text-gray-af border-gray-f2' : 'text-white border-gray-af',
            )}
          />
          <div className="text-gray-4a">{lang.forum}</div>
        </div>
        <Button className="mt-2 w-full h-7 rounded flex items-center justify-center">{lang.yes}</Button>
      </Popover>
    </>
  );
});
