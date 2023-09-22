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
  className?: string
}

export interface MenuItem {
  text: string
  action?: () => unknown
  children?: Array<MenuItem>
  hidden?: boolean
  icon?: string
  iconText?: string
  checked?: boolean
  classNames?: string
  'data-test-id'?: string
}

export const DropdownMenu = observer((props: Props) => {
  const { menu: v, className } = props;
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <button
        className={classNames(
          'px-4 mx-1 cursor-pointer flex items-center hover:bg-gray-4a',
          open && 'bg-gray-4a',
          className,
        )}
        onClick={v.action ?? (() => setOpen(true))}
        ref={buttonRef}
        data-test-id={v['data-test-id']}
      >
        {v.icon ? (
          <Tooltip
            placement="bottom"
            title={v.text}
          >
            <>
              <img src={v.icon || ''} alt="" />
              {v.iconText && (
                <div className="ml-2.5">{v.iconText}</div>
              )}
            </>
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
                data-test-id={v['data-test-id']}
              >
                {v.checked && (
                  <span className="absolute left-0 ml-2"><img src={IconCheck} alt="" /></span>
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
