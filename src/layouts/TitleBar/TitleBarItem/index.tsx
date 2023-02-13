import React from 'react';
import classNames from 'classnames';
import { observer } from 'mobx-react-lite';
import { MenuItem,
  MenuList,
  Popover,
  Tooltip } from '@material-ui/core';
import IconCheck from 'assets/check.svg';

interface Props {
  menu: MenuItem
}

interface MenuItem {
  text: string
  action?: () => unknown
  children?: Array<MenuItem>
  hidden?: boolean
  icon?: string
  checked?: boolean
  classNames?: string
}

export const TitleBarItem = observer((props: Props) => {
  const { menu: v } = props;
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        className={classNames(
          'px-4 mx-1 cursor-pointer flex items-center focus:bg-gray-4a',
          open && 'bg-gray-4a',
        )}
        onClick={v.action ?? (() => setOpen(true))}
        ref={buttonRef}
      >
        {v.icon ? (
          <Tooltip
            placement="bottom"
            title={v.text}
          >
            <img src={v.icon || ''} alt="" />
          </Tooltip>
        ) : v.text}
      </button>

      {!!v.children && (
        <Popover
          open={open}
          onClose={() => setOpen(false)}
          anchorEl={buttonRef.current}
          style={{ zIndex: 1000000001 }}
          PaperProps={{
            className: 'bg-black text-white',
            square: true,
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
          <MenuList>
            {v.children.filter((v) => !v.hidden).map((v, i) => (
              <MenuItem
                className={classNames(
                  'hover:bg-gray-4a duration-0 relative',
                  v.classNames || '',
                )}
                onClick={() => {
                  v.action?.();
                  setOpen(false);
                }}
                key={'menu-right-item-' + i}
              >
                {v.checked && (
                  <span className="absolute left-0"><img src={IconCheck} alt="" /></span>
                )}
                {v.text}
              </MenuItem>
            ))}
          </MenuList>
        </Popover>
      )}
    </>
  );
});
