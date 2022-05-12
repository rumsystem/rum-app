import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { MdArrowDropDown, MdArrowDropUp } from 'react-icons/md';
import {
  RiCloseLine,
  RiAddLine,
} from 'react-icons/ri';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Popover } from '@material-ui/core';
import { lang } from 'utils/lang';
import Button from 'components/Button';
import editProfile from 'standaloneModals/editProfile';
import SwitchIcon from 'assets/iconSwich.svg';
import AddGrayIcon from 'assets/icon_add_gray.svg';
import AddWhiteIcon from 'assets/icon_add_white.svg';

interface Props {
  groupIds: string[]
  profiles: Array<any>
  selected?: string
  type?: string
}

export default observer((props: Props) => {
  const {
    type,
    profiles,
    selected,
    groupIds,
  } = props;

  const state = useLocalObservable(() => ({
    showMenu: false,
  }));

  const selectedProfile = profiles.find((profile) => profile.profileTag === selected);

  const selector = React.useRef<HTMLDivElement>(null);

  const handleMenuClose = action(() => { state.showMenu = false; });

  const handleEdit = action((profile?: any) => {
    state.showMenu = false;
    editProfile({ groupIds, profile });
  });

  return (
    <>
      {
        type === 'button' ? (
          <div
            className="h-6 border border-gray-af rounded pl-2 pr-[14px] flex items-center justify-center text-12 cursor-pointer"
            onClick={() => {
              state.showMenu = !state.showMenu;
            }}
            ref={selector}
          >
            <img className="w-[18px] h-[18px] mr-1.5" src={SwitchIcon} />
            {lang.changeProfile}
          </div>
        ) : (
          <div
            className={classNames(
              'h-8 flex items-stretch bg-white rounded-r border border-gray-f2 cursor-pointer',
            )}
            onClick={() => {
              state.showMenu = !state.showMenu;
            }}
            ref={selector}
          >
            <div className="w-[165px] pr-1.5 flex items-center justify-center gap-x-1">
              <img className="ml-[-16px] flex-shrink-0 flex items-center justify-center box-border border border-gray-f2 w-[32px] h-[32px] bg-white rounded-full overflow-hidden" src={selectedProfile.profile.avatar} />
              <div className="truncate text-14 flex-grow text-gray-4a">{selectedProfile.profile.name}</div>
              <img
                className="flex-shrink-0"
                src={AddGrayIcon}
                alt={lang.create}
              />
            </div>
            {
              state.showMenu && <div className="w-8 flex items-center justify-center text-26 text-producer-blue border border-gray-f2 rounded m-[-1px]"><MdArrowDropUp /></div>
            }
            {
              !state.showMenu && <div className="w-8 flex items-center justify-center text-26 text-gray-af border border-gray-f2 rounded m-[-1px]"><MdArrowDropDown /></div>
            }
          </div>
        )
      }
      <Popover
        open={state.showMenu}
        onClose={handleMenuClose}
        anchorEl={selector.current}
        PaperProps={{
          className: 'w-[237px] mt-0.5 px-4 pt-7 pb-3 flex flex-col items-stretch gap-y-[14px]',
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
        <RiCloseLine className="absolute top-1.5 right-1.5 cursor-pointer text-gray-70" onClick={handleMenuClose} />
        <Button
          className="w-full h-7 rounded flex items-center justify-center"
          onClick={() => handleEdit()}
        ><RiAddLine />{lang.create}{lang.profile}</Button>
        {
          profiles.map((profile) => (
            <div
              key={profile.profileTag}
              className={classNames(
                'pl-1 px-2.5 h-[26px] flex items-center rounded gap-x-2 cursor-pointer',
                selected === profile.profileTag ? 'bg-black text-white' : 'bg-gray-f2 text-gray-4a',
              )}
              onClick={() => handleEdit(profile.profile)}
            >
              <div
                className={classNames(
                  'flex-shrink-0 mr-1 flex items-center justify-center box-border w-[30px] h-[30px] bg-white border-2 rounded-full overflow-hidden',
                  selected === profile.profileTag ? 'border-white' : 'border-gray-f2',
                )}
              >
                <img src={profile.profile.avatar} />
              </div>
              <div className="truncate text-14">{profile.profile.name}</div>
              <div
                className={classNames(
                  'text-12 flex-grow',
                  selected === profile.profileTag ? 'text-white' : 'text-gray-9c',
                )}
              >{profile.count}</div>
              <img
                className="flex-shrink-0"
                src={selected === profile.profileTag ? AddWhiteIcon : AddGrayIcon}
                alt={lang.create}
              />
            </div>
          ))
        }
      </Popover>
    </>
  );
});
