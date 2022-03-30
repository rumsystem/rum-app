import React from 'react';
import classNames from 'classnames';
import { action } from 'mobx';
import { MdArrowDropDown, MdArrowDropUp } from 'react-icons/md';
import {
  RiCloseLine,
  RiAddLine,
} from 'react-icons/ri';
import {
  HiOutlineUser,
} from 'react-icons/hi';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { Popover } from '@material-ui/core';
import { lang } from 'utils/lang';
import Button from 'components/Button';
import editProfile from 'standaloneModals/editProfile';
import SwitchIcon from 'assets/iconSwich.svg';
import AddGrayIcon from 'assets/icon_add_gray.svg';
import AddWhiteIcon from 'assets/icon_add_white.svg';
import SyncingIcon from 'assets/syncing.svg';

interface Props {
  className?: string
  groupIds?: string[]
  profiles: Array<any>
  selected?: string
  type?: string
  status?: string
  onSelect?: (profile: any) => void
}

export default observer((props: Props) => {
  const {
    className,
    type,
    profiles,
    selected,
    groupIds,
    status,
    onSelect,
  } = props;

  const state = useLocalObservable(() => ({
    showMenu: false,
    selectedProfile: null as any,
  }));

  const selector = React.useRef<HTMLDivElement>(null);

  const handleMenuClose = action(() => { state.showMenu = false; });

  const handleEdit = action(async (profile?: any, changeOld?: boolean) => {
    state.showMenu = false;
    const p = editProfile({ groupIds: changeOld ? profile.groupIds : groupIds, profile: profile.profile });
    const newProfile = await p;
    if (newProfile) {
      state.selectedProfile = { profile: newProfile, profileTag: newProfile.name + newProfile.avatar };
      if (onSelect) {
        onSelect(newProfile);
      }
    }
  });

  React.useEffect(action(() => {
    state.selectedProfile = profiles.find((profile) => profile.profileTag === selected);
  }), [selected, profiles]);

  return (
    <>
      {
        type === 'button' ? (
          <div
            className={classNames(
              'border border-gray-af rounded pl-2 pr-[14px] flex items-center justify-center cursor-pointer',
              className,
            )}
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
              'h-8 flex items-stretch rounded-r border border-gray-f2 cursor-pointer',
              className,
            )}
            onClick={() => {
              state.showMenu = !state.showMenu;
            }}
            ref={selector}
          >
            <div className="w-[165px] pr-1.5 flex items-center justify-center gap-x-1">
              {
                state.selectedProfile ? (
                  <img className="ml-[-16px] flex-shrink-0 flex items-center justify-center box-border border border-gray-f2 w-[32px] h-[32px] bg-white rounded-full overflow-hidden" src={state.selectedProfile.profile.avatar} />
                ) : (
                  <div className="ml-[-16px] flex-shrink-0 flex items-center justify-center box-border border border-gray-f2 w-[32px] h-[32px] bg-white rounded-full overflow-hidden">
                    <HiOutlineUser className="text-26 text-gray-f2" />
                  </div>
                )
              }
              {
                state.selectedProfile ? (
                  <div
                    className={classNames(
                      'truncate text-14 flex-grow',
                      status !== 'synced' && type !== 'init' && !state.selectedProfile.profile.default ? 'text-gray-af' : 'text-gray-4a',
                    )}
                  >
                    {state.selectedProfile.profile.name}
                  </div>
                ) : (
                  <div
                    className="truncate text-12 text-gray-af flex-grow"
                  >
                    {lang.selectProfileFromDropdown}
                  </div>
                )
              }
              <img
                className="flex-shrink-0"
                src={status === 'synced' || type === 'init' || state.selectedProfile?.profile?.default ? AddGrayIcon : SyncingIcon}
                alt={lang.create}
              />
            </div>
            {
              state.showMenu && <div className="w-8 flex items-center justify-center text-26 text-producer-blue border border-gray-f2 rounded m-[-1px] bg-white"><MdArrowDropUp /></div>
            }
            {
              !state.showMenu && <div className="w-8 flex items-center justify-center text-26 text-gray-af border border-gray-f2 rounded m-[-1px] bg-white"><MdArrowDropDown /></div>
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
          profiles.map((profile) => !profile.profile.default && (
            <div
              key={profile.profileTag}
              className={classNames(
                'pl-1 px-2.5 h-[26px] flex items-center rounded gap-x-2 cursor-pointer',
                state.selectedProfile?.profileTag === profile.profileTag ? 'bg-black text-white' : 'bg-gray-f2 text-gray-4a',
              )}
              onClick={() => handleEdit(profile)}
            >
              <div
                className={classNames(
                  'flex-shrink-0 mr-1 flex items-center justify-center box-border w-[30px] h-[30px] bg-white border-2 rounded-full overflow-hidden',
                  state.selectedProfile?.profileTag === profile.profileTag ? 'border-white' : 'border-gray-f2',
                )}
              >
                <img src={profile.profile.avatar} />
              </div>
              <div className="truncate text-14">{profile.profile.name}</div>
              <div
                className={classNames(
                  'text-12 flex-grow',
                  state.selectedProfile?.profileTag === profile.profileTag ? 'text-white' : 'text-gray-9c',
                )}
              >{profile.count}</div>
              <img
                className="flex-shrink-0"
                src={state.selectedProfile?.profileTag === profile.profileTag ? AddWhiteIcon : AddGrayIcon}
                alt={lang.create}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(profile, true);
                }}
              />
            </div>
          ))
        }
      </Popover>
    </>
  );
});
