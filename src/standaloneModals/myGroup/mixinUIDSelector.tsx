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
import getMixinUID from 'standaloneModals/getMixinUID';
import useSubmitPerson from 'hooks/useSubmitPerson';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';
import BindIcon from 'assets/bond.svg';
import WalletIcon2 from 'assets/icon_wallet_2.svg';
import WalletIcon3 from 'assets/icon_wallet_3.svg';
import WalletGrayIcon from 'assets/wallet_gray.svg';
import UnlinkWalletIcon from 'assets/unlink_wallet.svg';
import SyncingIcon from 'assets/syncing.svg';

interface Props {
  groupIds: string[]
  profiles: Array<any>
  selected?: string
  type?: string
  status?: string
}

export default observer((props: Props) => {
  const {
    type,
    profiles,
    selected,
    groupIds,
    status,
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

  const updateMixinPayment = async (mixinUID: string) => {
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

  const handleUpdate = action((mixinUID: string) => {
    if (selected === mixinUID) {
      return;
    }
    updateMixinPayment(mixinUID);
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
            <img className="w-[18px] h-[18px] mr-1.5" src={BindIcon} />
            {lang.bindOrUnbindWallet}
          </div>
        ) : (
          <div
            className={classNames(
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
                    src={WalletIcon2}
                    alt={lang.create}
                  />
                ) : (
                  <img
                    className="ml-1 flex-shrink-0"
                    src={WalletGrayIcon}
                    alt={lang.create}
                  />
                )
              }
              <div
                className={classNames(
                  'text-14 flex-grow truncate',
                  status === 'syncing' && 'text-gray-af',
                  status === 'syncing' || (selectedProfile ? 'text-gray-4a' : 'text-gray-9c'),
                )}
              >{selectedProfile ? selectedProfile.mixinUID.slice(0, 8) : `${status === 'syncing' ? '解绑中' : '未绑定'}`}</div>
              {
                status === 'syncing' && (
                  <img
                    className="flex-shrink-0"
                    src={SyncingIcon}
                    alt={lang.create}
                  />
                )
              }
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
          onClick={async () => {
            updateMixinPayment(await getMixinUID());
          }}
        >
          <RiAddLine />
          {lang.bindNewWallet}
        </Button>
        {
          type === 'button' && (
            <Button
              className="w-full h-7 rounded flex items-center justify-center"
              onClick={() => {
                updateMixinPayment('');
              }}
            >
              <img
                onClick={() => updateMixinPayment('')}
                src={UnlinkWalletIcon}
              />
              {lang.unbind}
            </Button>
          )
        }
        {
          profiles.map((profile) => (
            <div
              key={profile.mixinUID}
              className={classNames(
                'pl-1 px-2.5 h-[26px] flex items-center rounded gap-x-2',
                selected === profile.mixinUID ? 'bg-black text-white' : 'bg-gray-f2 text-gray-4a cursor-pointer',
              )}
              onClick={() => handleUpdate(profile.mixinUID)}
            >
              <img
                className="ml-1 flex-shrink-0"
                src={selected === profile.mixinUID ? WalletIcon3 : WalletIcon2}
              />
              <div className="truncate text-14">{profile.mixinUID}</div>
              <div
                className={classNames(
                  'text-12 flex-grow',
                  selected === profile.mixinUID ? 'text-white' : 'text-gray-9c',
                )}
              >{profile.count}</div>
              {
                type !== 'button' && (
                  <img
                    className={classNames(
                      'flex-shrink-0 cursor-pointer',
                      selected === profile.mixinUID || 'invisible',
                    )}
                    onClick={() => updateMixinPayment('')}
                    src={UnlinkWalletIcon}
                  />
                )
              }
            </div>
          ))
        }
      </Popover>
    </>
  );
});
