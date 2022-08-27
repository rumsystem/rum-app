import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import {
  Fade,
  TextField,
} from '@material-ui/core';

import { IGroup } from 'apis/group';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import { lang } from 'utils/lang';
import { assetsBasePath } from 'utils/env';
import { joinGroup } from 'standaloneModals/joinGroup';
import { createGroup } from 'standaloneModals/createGroup';
import { IoSearch } from 'react-icons/io5';
import {
  RiCheckboxBlankLine,
  RiCheckboxFill,
  RiCheckboxIndeterminateLine,
  RiCheckboxBlankFill,
} from 'react-icons/ri';
import { GROUP_TEMPLATE_TYPE, GROUP_TEMPLATE_TYPE_NAME, GROUP_TEMPLATE_TYPE_ICON } from 'utils/constant';
import { format } from 'date-fns';
import Filter from './filter';
import ProfileSelector from './profileSelector';
import MixinUIDSelector from './mixinUIDSelector';
import Order from './order';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';

const GROUP_ROLE_NAME: any = {
  'owner': <div className="flex items-center"><div className="mr-1 w-[3px] h-[14px] bg-link-blue rounded" /><span>{lang.ownerRole}</span></div>,
  'user': lang.noneRole,
};

const groupProfile = (groups: any) => {
  const profileMap: any = {};
  const mixinUIDMap: any = {};
  groups.forEach((group: any) => {
    if (group.profileTag in profileMap) {
      profileMap[group.profileTag].count += 1;
    } else {
      profileMap[group.profileTag] = {
        profileTag: group.profileTag,
        profile: group.profile,
        count: 1,
      };
    }
    if (group.profile.mixinUID) {
      if (group.profile.mixinUID in mixinUIDMap) {
        mixinUIDMap[group.profile.mixinUID].count += 1;
      } else {
        mixinUIDMap[group.profile.mixinUID] = {
          mixinUID: group.profile.mixinUID,
          profile: group.profile,
          count: 1,
        };
      }
    }
  });
  return [
    Object.values(profileMap).sort((a: any, b: any) => b.count - a.count),
    Object.values(mixinUIDMap).sort((a: any, b: any) => b.count - a.count),
  ];
};

export const myGroup = async () => new Promise<void>((rs) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <MyGroup
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

interface Props {
  rs: () => unknown
}

const MyGroup = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: false,
    groups: [] as any[],
    localGroups: [] as any[],
    keyword: '',
    filterSeedNetType: [] as any,
    allSeedNetType: [] as any,
    filterRole: [] as any,
    allRole: [] as any,
    filterProfile: [] as any,
    allProfile: [] as any,
    filterMixinUID: [] as any,
    allMixinUID: [] as any,
    createTimeOrder: '',
    walletOrder: '',
    selected: [] as string[],
  }));

  const { groupStore } = useStore();

  const database = useDatabase();

  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleSelect = action((value: string) => {
    if (state.selected.includes(value)) {
      state.selected = state.selected.filter((item: string) => item !== value);
    } else {
      state.selected = [...state.selected, value];
    }
  });

  const handleSelectAll = action(() => {
    if (state.selected.length !== state.localGroups.length) {
      state.selected = state.localGroups.map((group) => group.group_id);
    } else {
      state.selected = [];
    }
  });

  const handleCleanSelect = action(() => {
    state.filterSeedNetType = state.allSeedNetType;
    state.filterRole = state.allRole;
  });

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  React.useEffect(action(() => {
    let newGroups = state.groups.filter((group) => state.filterSeedNetType.includes(group.app_key) && state.filterRole.includes(group.role) && state.filterProfile.includes(group.profileTag));
    if (state.keyword) {
      newGroups = newGroups.filter((group) => group.group_name.includes(state.keyword));
    }
    if (state.createTimeOrder === 'asc') {
      newGroups = newGroups.sort((a, b) => a.last_updated - b.last_updated);
    }
    if (state.createTimeOrder === 'desc') {
      newGroups = newGroups.sort((a, b) => b.last_updated - a.last_updated);
    }
    if (state.walletOrder === 'asc') {
      newGroups = newGroups.sort((a, b) => a.profile.mixinUID.localeCompare(b.profile.mixinUID));
    }
    if (state.walletOrder === 'desc') {
      newGroups = newGroups.sort((a, b) => b.profile.mixinUID.localeCompare(a.profile.mixinUID));
    }
    state.localGroups = newGroups;
    state.selected = state.selected.filter((id) => state.groups.map((group) => group.group_id).includes(id));
  }), [state, state.createTimeOrder, state.walletOrder, state.filterSeedNetType, state.filterRole, state.filterProfile, state.keyword]);

  React.useEffect(action(() => {
    state.allSeedNetType = [...new Set(state.groups.map((group) => group.app_key))];
    state.filterSeedNetType = [...new Set(state.groups.map((group) => group.app_key))];
    state.allRole = [...new Set(state.groups.map((group) => group.role))];
    state.filterRole = [...new Set(state.groups.map((group) => group.role))];
    const [profiles, mixinUIDs] = groupProfile(state.groups);
    state.allProfile = profiles;
    state.filterProfile = profiles.map((profile: any) => profile.profileTag);
    state.allMixinUID = mixinUIDs;
    state.filterMixinUID = mixinUIDs.map((mixinUID: any) => mixinUID.mixinUID);
  }), [state.groups]);

  React.useEffect(action(() => {
    (async () => {
      const groups = groupStore.groups.map((group: IGroup & { role?: string, profile?: any, profileTag?: string }) => {
        group.role = useIsGroupOwner(group) ? 'owner' : 'user';
        return group;
      });
      await Promise.all(groups.map(async (group) => {
        const latestPerson = await PersonModel.getUser(database, {
          GroupId: group.group_id,
          Publisher: group.user_pubkey,
          latest: true,
        });
        group.profile = latestPerson.profile;
        group.profileTag = latestPerson.profile.name + latestPerson.profile.avatar;
      }));
      state.groups = groups;
    })();
  }), [groupStore.groups]);

  React.useEffect(action(() => {
    state.open = true;
  }), []);

  return (
    <Fade
      in={state.open}
      timeout={500}
      mountOnEnter
      unmountOnExit
    >
      <div className="flex flex-col items-stretch fixed inset-0 top-[40px] bg-gray-f7 z-50">
        <div className="flex items-center h-[70px] bg-white">
          <div
            className="self-stretch ml-10 flex gap-x-3 justify-center items-center text-16 cursor-pointer"
            onClick={() => {
              handleClose();
            }}
          >
            <img
              className="text-producer-blue text-24"
              src={`${assetsBasePath}/iconReturn.svg`}
              alt={lang.back}
            />
            {lang.back}
          </div>
          <div className="text-20 font-bold ml-10">
            {lang.myGroup}
          </div>
          <div
            className="self-stretch ml-[84px] flex gap-x-1 justify-center items-center text-16 text-producer-blue cursor-pointer"
            onClick={() => {
              joinGroup();
            }}
          >
            <img
              src={`${assetsBasePath}/joinSeed.svg`}
              alt={lang.joinSeedGroup}
            />
            {lang.joinSeedGroup}
          </div>
          <div
            className="self-stretch ml-[33px] flex gap-x-1 justify-center items-center text-16 text-producer-blue cursor-pointer"
            onClick={() => {
              createGroup();
            }}
          >
            <img
              src={`${assetsBasePath}/createSeed.svg`}
              alt={lang.createGroup}
            />
            {lang.createGroup}
          </div>
        </div>

        <div
          className="flex flex-col items-center overflow-auto flex-1"
          ref={scrollBox}
        >
          <div className="w-[960px] mt-[22px] mb-[11px] flex items-center gap-x-[30px]">
            <div className="flex items-center">
              <div className="text-gray-af text-12 scale-[0.85]">{lang.seedNet}</div>
              <Filter
                allText={lang.allType}
                options={state.allSeedNetType.map((type: string) => (
                  { label: GROUP_TEMPLATE_TYPE_NAME[type as GROUP_TEMPLATE_TYPE], value: type }
                ))}
                selected={state.filterSeedNetType}
                onFilter={(values) => { state.filterSeedNetType = values; }}
              />
            </div>
            <div className="flex items-center">
              <div className="text-gray-af text-12 scale-[0.85]">{lang.nodeRole}</div>
              <Filter
                allText={lang.allRole}
                options={state.allRole.map((role: string) => (
                  { label: GROUP_ROLE_NAME[role], value: role }
                ))}
                selected={state.filterRole}
                onFilter={(values) => { state.filterRole = values; }}
              />
            </div>
            <div className="flex items-center">
              <div className="text-gray-af text-12 scale-[0.85]">{lang.profile}</div>
              <Filter
                allText={lang.allProfile}
                options={state.allProfile.map((profile: any) => (
                  { label: <div key={profile.profileTag} className="flex items-center"><div className="mr-1 flex items-center justify-center box-content w-[28px] h-[28px] bg-white border-2 rounded-full overflow-hidden"><img src={profile.profile.avatar} /></div><div className="max-w-[68px] truncate flex-grow">{profile.profile.name}</div><div className="ml-2 text-12 text-gray-9c">{profile.count}</div></div>, value: profile.profileTag }
                ))}
                selected={state.filterProfile}
                onFilter={(values) => { state.filterProfile = values; }}
              />
            </div>
            <div
              className="text-producer-blue text-12 scale-[0.85] cursor-pointer"
              onClick={handleCleanSelect}
            >{lang.cleanSelected}</div>
            <div className="flex-grow flex items-center flex-row-reverse">
              <div className="max-w-70 relative">
                <TextField
                  className="w-full opacity-80 search-field"
                  size="small"
                  value={state.keyword}
                  onChange={(e) => {
                    state.keyword = e.target.value.trim().slice(0, 40);
                  }}
                  margin="none"
                  variant="outlined"
                  placeholder={lang.searchSeedNets}
                />
                <div className="text-16 flex items-center justify-center absolute right-2 top-0 bottom-0">
                  <IoSearch
                    className="cursor-pointer"
                    onClick={() => {
                      console.log('searching...');
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-[960px] h-[41px] px-5 flex items-center bg-black text-14 text-gray-f2 rounded-t-md">
            <div
              className="flex items-center w-[86px]"
              onClick={handleSelectAll}
            >
              {
                state.selected.length === state.localGroups.length && state.selected.length !== 0 && <RiCheckboxFill className="text-16 text-producer-blue cursor-pointer" />
              }
              {
                state.selected.length === 0 && <RiCheckboxBlankFill className="text-16 text-white cursor-pointer" />
              }
              {
                state.selected.length > 0 && state.selected.length < state.localGroups.length && <RiCheckboxIndeterminateLine className="text-16 text-producer-blue cursor-pointer" />
              }
            </div>
            <div className="flex flex-1 items-center">
              <span>{lang.createTime}</span>
              <Order
                className="text-20"
                order={state.createTimeOrder}
                onClick={(order: string) => { state.walletOrder = ''; state.createTimeOrder = order; }}
              />
            </div>
            <div className="flex items-center w-[203px]">
              <span>{lang.bindWallet}</span>
              <Order
                className="text-20"
                order={state.walletOrder}
                onClick={(order: string) => { state.createTimeOrder = ''; state.walletOrder = order; }}
              />
            </div>
          </div>

          <div className="w-[960px] flex-1text-gray-6d mb-8 bg-white">
            {
              state.localGroups.map((group: IGroup & { role: string, profile: any, profileTag: string }) => (
                <div key={group.group_id} className="group-item px-5 h-[88px] flex items-center border-t border-gray-fa">
                  <div className="flex items-center w-[86px]">
                    <div onClick={() => handleSelect(group.group_id)}>
                      {
                        state.selected.includes(group.group_id)
                          ? <RiCheckboxFill className="text-16 text-producer-blue cursor-pointer" />
                          : <RiCheckboxBlankLine className="text-16 text-gray-af cursor-pointer" />
                      }
                    </div>
                    <div className="ml-3 w-10 h-10 flex items-baseline justify-center text-28 text-gray-4a border border-gray-f2">{group.group_name ? group.group_name.trim()[0] : ' '}</div>
                  </div>
                  <div className="flex-1 self-stretch pt-4 pb-3 flex flex-col justify-between">
                    <div className="text-16 text-black font-bold flex">
                      {group.group_name}
                      {((app_key) => {
                        const GroupIcon = GROUP_TEMPLATE_TYPE_ICON[app_key];
                        return (
                          <GroupIcon
                            className="text-gray-af ml-1"
                            style={{ strokeWidth: 4 }}
                            width="20"
                          />
                        );
                      })(group.app_key) }
                    </div>
                    <div className="flex items-center text-12 text-gray-9c">
                      <span>{`创建于 ${format(group.last_updated / 1000000, 'yyyy/MM/dd')}`}</span>
                      {group.role === 'owner' && <div className="flex items-center ml-3"><span>{`${lang.nodeRole} : `}</span><div className="ml-2 mr-1 w-[3px] h-[14px] bg-link-blue rounded" /><span>{lang.ownerRole}</span></div>}
                    </div>
                  </div>
                  <div className="flex items-center w-[236px]">
                    <ProfileSelector
                      groupId={group.group_id}
                      profiles={state.allProfile}
                      selected={group.profileTag}
                      onFilter={(values) => { state.filterProfile = values; }}
                    />
                  </div>
                  <div className="flex items-center w-[203px]">
                    <MixinUIDSelector
                      groupId={group.group_id}
                      profiles={state.allMixinUID}
                      selected={group.profile.mixinUID}
                      onFilter={(values) => { state.filterMixinUID = values; }}
                    />
                    <div className="unfollow ml-4 w-8 h-8 flex items-center justify-center text-26 text-producer-blue border border-gray-f2 rounded m-[-1px] cursor-pointer">
                      <img src={`${assetsBasePath}/unfollow.svg`} />
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
        <style jsx>{`
          div :global(.search-field > div) {
            border-color: #e3e3e3;
            border-radius: 40px;
            background-color: white;
            height: 24px;
          }
          div :global(.search-field input) {
            padding: 2px 32px 2px 13px !important;
            font-size: 14px;
            color: #333333;
          }
          .group-item .unfollow {
            visibility: hidden;
          }
          .group-item:hover .unfollow {
            visibility: visible !important;
          }
        `}</style>
      </div>
    </Fade>
  );
});
