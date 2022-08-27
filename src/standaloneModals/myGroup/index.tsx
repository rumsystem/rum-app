import React from 'react';
import classNames from 'classnames';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { format } from 'date-fns';
import { Fade, TextField } from '@material-ui/core';
import { IoSearch } from 'react-icons/io5';
import {
  RiCheckboxBlankLine,
  RiCheckboxFill,
  RiCheckboxIndeterminateLine,
  RiCheckboxBlankFill,
} from 'react-icons/ri';

import { IGroup } from 'apis/group';
import { StoreProvider, useStore } from 'store';
import { joinGroup } from 'standaloneModals/joinGroup';
import { createGroup } from 'standaloneModals/createGroup';

import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import { getGroupIcon } from 'utils/getGroupIcon';

import ProfileSelector from 'components/profileSelector';
import MixinUIDSelector from 'components/mixinUIDSelector';
import GroupIcon from 'components/GroupIcon';
import BackToTop from 'components/BackToTop';
import { useLeaveGroup } from 'hooks/useLeaveGroup';
import Help from 'layouts/Main/Help';

import ReturnIcon from 'assets/iconReturn.svg';
import JoinSeedIcon from 'assets/joinSeed.svg';
import CreateSeedIcon from 'assets/createSeed.svg';
import UnfollowGrayIcon from 'assets/unfollow_gray.svg';
import UnfollowIcon from 'assets/unfollow.svg';
import SearchGroupIcon from 'assets/search_group.svg';
import { isGroupOwner, getRole } from 'store/selectors/group';

import Order from './order';
import Filter from './filter';

const groupProfile = (groups: any) => {
  const profileMap: any = {};
  const mixinUIDMap: any = {};
  groups.forEach((group: any) => {
    if (group.profileTag) {
      if (group.profileTag in profileMap) {
        profileMap[group.profileTag].count += 1;
        profileMap[group.profileTag].groupIds.push(group.group_id);
      } else {
        profileMap[group.profileTag] = {
          profileTag: group.profileTag,
          profile: group.profile,
          count: 1,
          groupIds: [group.group_id],
        };
      }
    }
    if (group?.profile?.mixinUID) {
      if (group.profile.mixinUID in mixinUIDMap) {
        mixinUIDMap[group.profile.mixinUID].count += 1;
        mixinUIDMap[group.profile.mixinUID].groupIds.push(group.group_id);
      } else {
        mixinUIDMap[group.profile.mixinUID] = {
          mixinUID: group.profile.mixinUID,
          profile: group.profile,
          count: 1,
          groupIds: [group.group_id],
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
    allMixinUID: [] as any,
    updateTimeOrder: '',
    walletOrder: '',
    selected: [] as string[],
    tableTitleVisable: true,
  }));

  const { groupStore, latestStatusStore, confirmDialogStore } = useStore();

  const leaveGroup = useLeaveGroup();

  const navBar = React.useRef<HTMLDivElement>(null);
  const scrollBox = React.useRef<HTMLDivElement>(null);
  const tableTitle = React.useRef<HTMLDivElement>(null);

  const GROUP_ROLE_NAME: any = {
    'owner': <div className="flex items-center"><div style={{ background: '#ff931e' }} className="mr-1 w-[3px] h-[14px] rounded" /><span>{lang.ownerRole}</span></div>,
    'user': lang.noneRole,
  };

  const GROUP_TEMPLATE_TYPE_NAME = {
    [GROUP_TEMPLATE_TYPE.TIMELINE]: lang.sns,
    [GROUP_TEMPLATE_TYPE.POST]: lang.forum,
    [GROUP_TEMPLATE_TYPE.NOTE]: lang.notebook,
  };

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
    state.filterProfile = state.allProfile.map((profile: any) => profile.profileTag);
  });

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  const handleLeaveGroup = (groups: any[]) => {
    let confirmText = '';
    groups.some((group) => {
      const latestStatus = latestStatusStore.map[group.group_id] || latestStatusStore.DEFAULT_LATEST_STATUS;
      if (latestStatus.producerCount === 1 && isGroupOwner(group)) {
        confirmText = groups.length > 1 ? lang.singleProducerConfirmAll : lang.singleProducerConfirm;
        console.log(group.group_name);
        return true;
      }
      return false;
    });
    confirmText += groups.length > 1 ? lang.confirmToExitAll : lang.confirmToExit;
    confirmDialogStore.show({
      content: `<div>${confirmText}</div>`,
      okText: lang.yes,
      isDangerous: true,
      maxWidth: 340,
      ok: async () => {
        if (confirmDialogStore.loading) {
          return;
        }
        confirmDialogStore.setLoading(true);
        try {
          await Promise.all(groups.map((group) => leaveGroup(group.group_id)));
          confirmDialogStore.hide();
        } catch {}
        confirmDialogStore.setLoading(false);
      },
    });
  };

  React.useEffect(action(() => {
    let newGroups = groupStore.groups.filter((group) =>
      state.filterSeedNetType.includes(group.app_key)
      && state.filterRole.includes(getRole(group))
      && (state.filterProfile.length === state.allProfile.length || state.filterProfile.includes(group.profileTag)));
    if (state.keyword) {
      newGroups = newGroups.filter((group) => group.group_name.includes(state.keyword));
    }
    if (state.updateTimeOrder === 'asc') {
      newGroups = newGroups.sort((a, b) => a.last_updated - b.last_updated);
    }
    if (state.updateTimeOrder === 'desc') {
      newGroups = newGroups.sort((a, b) => b.last_updated - a.last_updated);
    }
    if (state.walletOrder === 'asc') {
      newGroups = newGroups.sort((a, b) => a.profile?.mixinUID.localeCompare(b.profile?.mixinUID));
    }
    if (state.walletOrder === 'desc') {
      newGroups = newGroups.sort((a, b) => b.profile?.mixinUID.localeCompare(a.profile?.mixinUID));
    }
    state.localGroups = newGroups;
    state.selected = state.selected.filter((id) => state.localGroups.map((group) => group.group_id).includes(id));
  }), [state, state.updateTimeOrder, state.walletOrder, state.filterSeedNetType, state.filterRole, state.filterProfile, state.keyword]);

  React.useEffect(action(() => {
    if (state.open) {
      if (state.filterSeedNetType.length === state.allSeedNetType.length) {
        state.allSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
        state.filterSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
      } else {
        state.allSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
        state.filterSeedNetType = state.filterSeedNetType.filter((app_key: string) => state.allSeedNetType.includes(app_key));
      }
      if (state.filterRole.length === state.allRole.length) {
        state.allRole = [...new Set(groupStore.groups.map(getRole))];
        state.filterRole = [...new Set(groupStore.groups.map(getRole))];
      } else {
        state.allRole = [...new Set(groupStore.groups.map(getRole))];
        state.filterRole = state.filterRole.filter((role: string) => state.allRole.includes(role));
      }
      const [profiles, mixinUIDs] = groupProfile(groupStore.groups);
      if (state.filterProfile.length === state.allProfile.length) {
        state.allProfile = profiles;
        state.filterProfile = profiles.map((profile: any) => profile.profileTag);
      } else {
        state.allProfile = profiles;
        state.filterProfile = state.filterProfile.filter((profileTag: string) => profiles.map((profile: any) => profile.profileTag).includes(profileTag));
      }
      state.allMixinUID = mixinUIDs;
    } else {
      state.allSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
      state.filterSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
      state.allRole = [...new Set(groupStore.groups.map(getRole))];
      state.filterRole = [...new Set(groupStore.groups.map(getRole))];
      const [profiles, mixinUIDs] = groupProfile(groupStore.groups);
      state.allProfile = profiles;
      state.filterProfile = profiles.map((profile: any) => profile.profileTag);
      state.allMixinUID = mixinUIDs;
    }
  }), [groupStore.groups]);

  React.useEffect(() => {
    if (!scrollBox.current) {
      return;
    }
    const scrollElement = scrollBox.current;
    const handleScroll = () => {
      if (!navBar.current || !tableTitle.current) {
        return;
      }
      const navBarBottom = navBar.current.getBoundingClientRect().bottom;
      const tableTitleBottom = tableTitle.current.getBoundingClientRect().bottom;
      state.tableTitleVisable = navBarBottom < tableTitleBottom;
    };
    scrollElement.addEventListener('scroll', handleScroll);
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [state.open]);

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
        <div
          className="flex items-center h-[70px] bg-white drop-shadow-md"
          ref={navBar}
        >
          <div
            className="self-stretch ml-10 flex gap-x-3 justify-center items-center text-16 cursor-pointer"
            onClick={() => {
              handleClose();
            }}
          >
            <img
              className="text-producer-blue text-24"
              src={ReturnIcon}
              alt={lang.back}
            />
            {lang.back}
          </div>
          {
            state.tableTitleVisable || state.selected.length === 0 ? (
              <>
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
                    src={JoinSeedIcon}
                    alt={lang.joinGroup}
                  />
                  {lang.joinGroup}
                </div>
                <div
                  className="self-stretch ml-[33px] flex gap-x-1 justify-center items-center text-16 text-producer-blue cursor-pointer"
                  onClick={() => {
                    createGroup();
                  }}
                >
                  <img
                    src={CreateSeedIcon}
                    alt={lang.createGroup}
                  />
                  {lang.createGroup}
                </div>
              </>
            ) : (
              <>
                <div
                  className="w-[960px] h-[41px] flex-shrink-0 px-5 flex items-center text-14 text-gray-f2 rounded-t-md mx-auto"
                >
                  <div
                    className={classNames(
                      'flex items-center',
                      state.selected.length === 0 && 'w-[86px]',
                    )}
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
                    {
                      state.selected.length !== 0 && (
                        <div className="ml-3">
                          <span className="text-14 text-gray-33">{`${lang.selected} ${state.selected.length} ${lang.item}`}</span><span className="text-14 text-gray-af">/</span><span className="text-12 text-gray-af">{`${state.localGroups.length} ${lang.item}${lang.seedNet}`}</span>
                        </div>
                      )
                    }
                  </div>
                  <div className="flex-grow flex items-center justify-end gap-x-[57px]">
                    <ProfileSelector
                      type="button"
                      className="h-7 bg-black text-14"
                      groupIds={state.selected}
                      profiles={state.allProfile}
                    />
                    <MixinUIDSelector
                      type="button"
                      className="h-7 bg-black text-14"
                      groupIds={state.selected}
                      profiles={state.allMixinUID}
                    />
                    <div
                      className="h-7 border border-gray-af rounded pl-2 pr-[14px] flex items-center justify-center cursor-pointer bg-black text-14"
                      onClick={() => handleLeaveGroup(groupStore.groups.filter((group) => state.selected.includes(group.group_id)))}
                    >
                      <img className="w-[18px] h-[18px] mr-1.5" src={UnfollowGrayIcon} />
                      {lang.exitGroup}
                    </div>
                  </div>
                </div>
                <div className="w-[108px]" />
              </>
            )
          }
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
              className="text-producer-blue text-14 scale-[0.85] cursor-pointer"
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

          <div
            className="w-[960px] h-[41px] flex-shrink-0 px-5 flex items-center bg-black text-14 text-gray-f2 rounded-t-md"
            ref={tableTitle}
          >
            <div
              className={classNames(
                'flex items-center',
                state.selected.length === 0 && 'w-[86px]',
              )}
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
              {
                state.selected.length !== 0 && (
                  <div className="ml-3">
                    <span className="text-14">{`${lang.selected} ${state.selected.length} ${lang.item}`}</span><span className="text-14 text-gray-af">/</span><span className="text-12 text-gray-af">{`${state.localGroups.length} ${lang.item}${lang.seedNet}`}</span>
                  </div>
                )
              }
            </div>
            {
              state.selected.length === 0 ? (
                <div className="flex-grow flex items-center">
                  <div className="flex flex-1 items-center">
                    <span>{lang.lastUpdated}</span>
                    <Order
                      className="text-20"
                      order={state.updateTimeOrder}
                      onClick={(order: string) => { state.walletOrder = ''; state.updateTimeOrder = order; }}
                    />
                  </div>
                  <div className="flex items-center w-[203px]">
                    <span>{lang.bindWallet}</span>
                    <Order
                      className="text-20"
                      order={state.walletOrder}
                      onClick={(order: string) => { state.updateTimeOrder = ''; state.walletOrder = order; }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-grow flex items-center justify-end gap-x-[57px]">
                  <ProfileSelector
                    type="button"
                    className="h-6 text-12"
                    groupIds={state.selected}
                    profiles={state.allProfile}
                  />
                  <MixinUIDSelector
                    type="button"
                    className="h-6 text-12"
                    groupIds={state.selected}
                    profiles={state.allMixinUID}
                  />
                  <div
                    className="h-6 border border-gray-af rounded pl-2 pr-[14px] flex items-center justify-center text-12 cursor-pointer"
                    onClick={() => handleLeaveGroup(groupStore.groups.filter((group) => state.selected.includes(group.group_id)))}
                  >
                    <img className="w-[18px] h-[18px] mr-1.5" src={UnfollowGrayIcon} />
                    {lang.exitGroup}
                  </div>
                </div>
              )
            }
          </div>

          <div className="flex-grow w-[960px] flex-1text-gray-6d mb-8 bg-gray-f7">
            {
              state.localGroups.map((group: IGroup) => (
                <div
                  key={group.group_id}
                  className={classNames(
                    'group-item px-5 h-[88px] flex items-center border-t border-gray-f2 bg-white',
                    state.selected.includes(group.group_id) && 'bg-gray-fa',
                  )}
                >
                  <div className="flex items-center w-[86px]">
                    <div onClick={() => handleSelect(group.group_id)}>
                      {
                        state.selected.includes(group.group_id)
                          ? <RiCheckboxFill className="text-16 text-producer-blue cursor-pointer" />
                          : <RiCheckboxBlankLine className="text-16 text-gray-af cursor-pointer" />
                      }
                    </div>
                    <GroupIcon width={40} height={40} fontSize={28} groupId={group.group_id} className="ml-3 rounded-6" />
                  </div>
                  <div className="flex-1 self-stretch pt-4 pb-3 flex flex-col justify-between">
                    <div className="text-16 text-black font-bold flex items-center">
                      {group.group_name}
                      {((app_key) => {
                        const GroupIcon = getGroupIcon(app_key);
                        return (
                          <GroupIcon
                            className="text-gray-af ml-1"
                            width="20"
                          />
                        );
                      })(group.app_key) }
                    </div>
                    <div className="flex items-center text-12 text-gray-9c">
                      <span>{`${lang.updateAt} ${format(group.last_updated / 1000000, 'yyyy/MM/dd')}`}</span>
                      {isGroupOwner(group) && <div className="flex items-center ml-3"><span>{`${lang.nodeRole} : `}</span><div style={{ background: '#ff931e' }} className="ml-2 mr-1 w-[3px] h-[14px] rounded" /><span>{lang.ownerRole}</span></div>}
                    </div>
                  </div>
                  <div className="flex items-center w-[236px]">
                    <ProfileSelector
                      groupIds={[group.group_id]}
                      profiles={state.allProfile}
                      selected={group.profileTag}
                      status={group.profileStatus}
                    />
                  </div>
                  <div className="flex items-center w-[203px]">
                    <MixinUIDSelector
                      groupIds={[group.group_id]}
                      profiles={state.allMixinUID}
                      selected={group.profile?.mixinUID}
                      status={group.profileStatus}
                    />
                    <div
                      className={classNames(
                        'unfollow ml-4 w-8 h-8 flex items-center justify-center text-26 text-producer-blue border border-gray-f2 rounded m-[-1px] cursor-pointer',
                        state.selected.includes(group.group_id) ? 'visible' : 'invisible',
                      )}
                      onClick={() => handleLeaveGroup([group])}
                    >
                      <img src={UnfollowIcon} />
                    </div>
                  </div>
                </div>
              ))
            }
            {
              state.keyword && state.localGroups.length === 0 && (
                <div className="h-full bg-gray-f7 flex items-center justify-center">
                  <div className="flex flex-col items-center mb-[140px]">
                    <img className="w-[88px] h-[80px] mb-[19px]" src={SearchGroupIcon} />
                    <div className="text-16 text-gray-4a font-medium">暂无搜索结果</div>
                    <div className="text-14 text-gray-af font-medium">换个关键词试试吧~</div>
                  </div>
                </div>
              )
            }
          </div>
        </div>
        <div
          className={classNames(
            'fixed bottom-6 right-[50%] hidden 2lg:block mr-[-548px]',
          )}
        >
          <BackToTop rootRef={scrollBox} />
          <div className="mb-3" />
          <Help />
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
          .group-item:hover .unfollow {
            visibility: visible !important;
          }
        `}</style>
      </div>
    </Fade>
  );
});
