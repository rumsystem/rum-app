import React from 'react';
import { useStore } from 'store';
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
import { assetsBasePath } from 'utils/env';
import getMixinUID from 'standaloneModals/getMixinUID';
import useSubmitPerson from 'hooks/useSubmitPerson';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';

interface Props {
  className?: string
  groupId: string
  profiles: Array<any>
  selected: string
  onFilter: (value: Array<string>) => unknown
}

export default observer((props: Props) => {
  const {
    className,
    profiles,
    selected,
    groupId,
  } = props;

  const state = useLocalObservable(() => ({
    showMenu: false,
  }));

  const database = useDatabase();

  const { snackbarStore, groupStore } = useStore();

  const selectedProfile = profiles.find((profile) => profile.mixinUID === selected);

  const selector = React.useRef<HTMLDivElement>(null);

  const handleMenuClose = action(() => { state.showMenu = false; });

  const submitPerson = useSubmitPerson();
  
  const groupIds = [groupId];

  const bindMixinPayment = async (mixinUID: string) => {
    try {
      for (const groupId of groupIds) {
        let profile = {} as any;
        const latestPerson = await PersonModel.getUser(database, {
          GroupId: groupId,
          Publisher: groupStore.map[groupId].user_pubkey,
          latest: true,
        });
        if (
          latestPerson
          && latestPerson.profile
          && latestPerson.profile.mixinUID === mixinUID
        ) {
          continue;
        } else {
          profile = { ...latestPerson.profile, mixinUID };
        }
        await submitPerson({
          groupId,
          publisher: groupStore.map[groupId].user_pubkey,
          profile,
        });
      }
      handleMenuClose();
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const handleBind = action( async (mixinUID?: string) => {
    if (mixinUID) {
      console.log(mixinUID);
    } else {
      mixinUID = await getMixinUID();
      console.log(mixinUID);
    }
    bindMixinPayment(mixinUID);
  });

  return (
    <>
      <div
        className={classNames(
          className,
          'h-8 flex items-stretch bg-white rounded border border-gray-f2 cursor-pointer',
        )}
        onClick={() => {
          state.showMenu = !state.showMenu;
        }}
        ref={selector}
      >
        <div className="w-[98px] pr-1.5 flex items-center justify-center">
          {
            selectedProfile ? (
              <img
                className="ml-2 mr-1 flex-shrink-0"
                src={`${assetsBasePath}/icon_wallet_2.svg`}
                alt={lang.create}
              />
            ) : (
              <img
                className="ml-1 flex-shrink-0"
                src={`${assetsBasePath}/wallet_gray.svg`}
                alt={lang.create}
              />
            )
          }
          <div
            className={classNames(
              'text-14 flex-grow truncate',
              selected ? 'text-gray-4a' : 'text-gray-9c',
            )}
          >{selectedProfile ? selectedProfile.mixinUID.slice(0, 8) : '未绑定'}</div>
        </div>
        {
          state.showMenu && <div className="w-8 flex items-center justify-center text-26 text-producer-blue border border-gray-f2 rounded m-[-1px]"><MdArrowDropUp /></div>
        }
        {
          !state.showMenu && <div className="w-8 flex items-center justify-center text-26 text-gray-af border border-gray-f2 rounded m-[-1px]"><MdArrowDropDown /></div>
        }
      </div>
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
          onClick={() => handleBind()}
        ><RiAddLine />{lang.bindNewWallet}</Button>
        {
          profiles.map((profile) => (
            <div
              key={profile.mixinUID}
              className={classNames(
                'pl-1 px-2.5 h-[26px] flex items-center rounded gap-x-2 cursor-pointer',
                selected === profile.mixinUID ? 'bg-black text-white' : 'bg-gray-f2 text-gray-4a',
              )}
              onClick={() => handleBind(profile.mixinUID)}
            >
              <img
                className="ml-1 flex-shrink-0"
                src={`${assetsBasePath}/${selected === profile.mixinUID ? 'icon_wallet_3.svg' : 'icon_wallet_2.svg'}`}
              />
              <div className="truncate text-14">{profile.mixinUID}</div>
              <div
                className={classNames(
                  'text-12 flex-grow',
                  selected === profile.mixinUID ? 'text-white' : 'text-gray-9c',
                )}
              >{profile.count}</div>
              <img
                className={classNames(
                  'flex-shrink-0',
                  selected === profile.mixinUID || 'invisible',
                )}
                src={`${assetsBasePath}/unlink_wallet.svg`}
                alt={lang.create}
              />
            </div>
          ))
        }
      </Popover>
    </>
  );
});
