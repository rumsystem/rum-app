import React from 'react';
import classNames from 'classnames';
import { toJS, action } from 'mobx';
import { MdArrowDropDown, MdArrowDropUp } from 'react-icons/md';
import { RiCheckboxBlankLine, RiCheckboxFill, RiCheckboxIndeterminateLine, RiCheckLine } from 'react-icons/ri';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Popover } from '@material-ui/core';
import { lang } from 'utils/lang';
import Button from 'components/Button';

interface Props {
  className?: string
  options: Array<any>
  selected: Array<string>
  onFilter: (value: Array<string>) => unknown
}

export default observer((props: Props) => {
  const state = useLocalObservable(() => ({
    showMenu: false,
    selected: [] as string[],
  }));

  const {
    className,
    options,
    selected,
    onFilter,
  } = props;

  const selector = React.useRef<HTMLDivElement>(null);

  const handleMenuClose = action(() => { state.showMenu = false; });

  const handleSelect = action((value: string) => {
    if (state.selected.includes(value)) {
      state.selected = state.selected.filter((item: string) => item !== value);
    } else {
      state.selected = [...state.selected, value];
    }
  });

  const handleSelectAll = action(() => {
    if (state.selected.length !== options.length) {
      state.selected = options.map((option) => option.value);
    } else {
      state.selected = [];
    }
  });

  const handleSelectReverse = action(() => {
    state.selected = options.map((option) => option.value).filter((item) => !state.selected.includes(item));
  });

  const handleSubmit = action(() => {
    onFilter(toJS(state.selected));
    handleMenuClose();
  });

  React.useEffect(action(() => {
    if (state.showMenu) {
      state.selected = selected;
    }
  }), [state.showMenu]);

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
            <div onClick={handleSelectAll}>
              {
                state.selected.length === options.length && state.selected.length !== 0 && <RiCheckboxFill className="text-16 text-producer-blue cursor-pointer" />
              }
              {
                state.selected.length === 0 && <RiCheckboxBlankLine className="text-16 text-producer-blue cursor-pointer" />
              }
              {
                state.selected.length > 0 && state.selected.length < options.length && <RiCheckboxIndeterminateLine className="text-16 text-producer-blue cursor-pointer" />
              }
            </div>
            {lang.selectAll}
          </div>
          <div
            className="current-pointer rounded border px-2.5 flex items-center justify-center cursor-pointer"
            onClick={handleSelectReverse}
          >{lang.selectReverse}</div>
        </div>
        {
          options.map((option) => (
            <div
              key={option.value}
              className={classNames(
                'px-3 py-2 flex items-center rounded border gap-x-3 cursor-pointer',
                state.selected.includes(option.value) && 'bg-gray-f2',
              )}
              onClick={() => handleSelect(option.value)}
            >
              <RiCheckLine
                className={classNames(
                  'bg-white text-15 border rounded',
                  state.selected.includes(option.value) ? 'text-gray-af border-gray-f2' : 'text-white border-gray-af',
                )}
              />
              <div className="text-gray-4a">{option.name}</div>
            </div>
          ))
        }
        <Button
          className="mt-2 w-full h-7 rounded flex items-center justify-center"
          onClick={handleSubmit}
        >{lang.yes}</Button>
      </Popover>
    </>
  );
});
