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
import GroupIcon from 'components/GroupIcon';
import BackToTop from 'components/BackToTop';
import Avatar from 'components/Avatar';
import { useLeaveGroup, useCheckWallet } from 'hooks/useLeaveGroup';
import { IDBProfile } from 'hooks/useDatabase/models/profile';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
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

interface ProfileWithCount {
  key: string
  count: number
  profile: IDBProfile
  groupIds: Array<string>
}

const groupProfile = (profileMap: Record<string, IDBProfile | undefined>) => {
  const profileMapWithCount = Array.from(Object.values(profileMap)).reduce((p, c) => {
    const key = `${c?.name}-${c?.avatar?.content}`;
    if (c) {
      p.set(key, {
        key,
        count: (p.get(key)?.count ?? 0) + 1,
        profile: c,
        groupIds: [...p.get(key)?.groupIds ?? [], c.groupId],
      });
    }
    return p;
  }, new Map<string, ProfileWithCount>());
  const sortedProfiles = Array.from(profileMapWithCount.values())
    .sort((a, b) => b.count - a.count);
  return sortedProfiles;
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
    // groups: [] as any[],
    localGroups: [] as IGroup[],
    keyword: '',
    filterSeedNetType: [] as Array<string>,
    allSeedNetType: [] as Array<string>,
    filterRole: [] as Array<string>,
    allRole: [] as Array<string>,
    filterProfile: [] as Array<string>,
    allProfile: [] as Array<ProfileWithCount>,
    updateTimeOrder: '',
    selected: [] as string[],
    tableTitleVisable: true,
  }));

  const { groupStore, latestStatusStore, confirmDialogStore } = useStore();

  const leaveGroup = useLeaveGroup();
  const checkWallet = useCheckWallet();

  const navBar = React.useRef<HTMLDivElement>(null);
  const scrollBox = React.useRef<HTMLDivElement>(null);
  const tableTitle = React.useRef<HTMLDivElement>(null);

  const GROUP_ROLE_NAME: Record<string, React.ReactNode> = {
    'owner': (
      <div className="flex items-center">
        <div
          className="mr-1 w-[3px] h-[14px] rounded"
          style={{ background: '#ff931e' }}
        />
        <span>{lang.ownerRole}</span>
      </div>
    ),
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
    if (state.selected.length !== state.localGroups.filter((group) => Object.values(GROUP_TEMPLATE_TYPE).includes(group.app_key)).length) {
      state.selected = state.localGroups.filter((group) => Object.values(GROUP_TEMPLATE_TYPE).includes(group.app_key)).map((group) => group.group_id);
    } else {
      state.selected = [];
    }
  });

  const handleCleanSelect = action(() => {
    state.filterSeedNetType = state.allSeedNetType;
    state.filterRole = state.allRole;
    state.filterProfile = state.allProfile.map((v) => v.profile.trxId);
  });

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  const handleLeaveGroup = async (groups: Array<IGroup>) => {
    let confirmText = '';
    const valids = await Promise.all(groups.map((group) => checkWallet(group)));
    if (valids.some((valid) => !valid)) {
      confirmText += `<span class="text-red-400 font-bold">${groups.length > 1 ? lang.someWalletNoEmpty : lang.walletNoEmpty}</span><br/>`;
    }
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
      okText: groups.length > 1 ? lang.leaveTheseSeedNets : lang.leaveThisSeedNet,
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
    let newGroups = groupStore.groups.filter(
      (group) => {
        const groupProfile = groupStore.profileMap[group.group_id];
        return state.filterSeedNetType.includes(group.app_key)
          && state.filterRole.includes(getRole(group))
          && (state.filterProfile.length === state.allProfile.length || state.filterProfile.includes(groupProfile?.trxId ?? ''));
      },
    );
    if (state.keyword) {
      newGroups = newGroups.filter((group) => group.group_name.includes(state.keyword));
    }
    if (state.updateTimeOrder === 'asc') {
      newGroups = newGroups.sort((a, b) => a.last_updated - b.last_updated);
    }
    if (state.updateTimeOrder === 'desc') {
      newGroups = newGroups.sort((a, b) => b.last_updated - a.last_updated);
    }
    state.localGroups = newGroups;
    state.selected = state.selected.filter((id) => state.localGroups.map((group) => group.group_id).includes(id));
  }), [state, state.updateTimeOrder, state.filterSeedNetType, state.filterRole, state.filterProfile, state.keyword]);

  React.useEffect(action(() => {
    if (state.open) {
      if (state.filterSeedNetType.length === state.allSeedNetType.length) {
        state.allSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
        state.filterSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
      } else {
        state.allSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
        state.filterSeedNetType = state.filterSeedNetType.filter((app_key) => state.allSeedNetType.includes(app_key));
      }
      if (state.filterRole.length === state.allRole.length) {
        state.allRole = [...new Set(groupStore.groups.map(getRole))];
        state.filterRole = [...new Set(groupStore.groups.map(getRole))];
      } else {
        state.allRole = [...new Set(groupStore.groups.map(getRole))];
        state.filterRole = state.filterRole.filter((role) => state.allRole.includes(role));
      }
      const profiles = groupProfile(groupStore.profileMap);
      if (state.filterProfile.length === state.allProfile.length) {
        state.allProfile = profiles;
        state.filterProfile = profiles.map((v) => v.profile.trxId);
      } else {
        state.allProfile = profiles;
        state.filterProfile = state.filterProfile.filter((trxId) => profiles.map((v) => v.profile.trxId).includes(trxId));
      }
    } else {
      state.allSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
      state.filterSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
      state.allRole = [...new Set(groupStore.groups.map(getRole))];
      state.filterRole = [...new Set(groupStore.groups.map(getRole))];
      const profiles = groupProfile(groupStore.profileMap);
      state.allProfile = profiles;
      state.filterProfile = profiles.map((v) => v.profile.trxId);
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
      <div
        className="flex flex-col items-stretch fixed inset-0 top-[40px] bg-gray-f7 z-50"
        data-test-id="my-group-modal"
      >
        <div
          className="flex items-center h-[70px] bg-white drop-shadow-md"
          ref={navBar}
        >
          <div
            className="self-stretch ml-10 flex gap-x-3 justify-center items-center text-16 cursor-pointer"
            data-test-id="my-group-modal-close"
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
          {(state.tableTitleVisable || state.selected.length === 0) && (<>
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
          </>)}
          {!(state.tableTitleVisable || state.selected.length === 0) && (<>
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
                {state.selected.length === state.localGroups.length && state.selected.length !== 0 && (
                  <RiCheckboxFill className="text-16 text-producer-blue cursor-pointer" />
                )}
                {state.selected.length === 0 && (
                  <RiCheckboxBlankFill className="text-16 text-white cursor-pointer" />
                )}
                {state.selected.length > 0 && state.selected.length < state.localGroups.length && (
                  <RiCheckboxIndeterminateLine className="text-16 text-producer-blue cursor-pointer" />
                )}
                {state.selected.length !== 0 && (
                  <div className="ml-3">
                    <span className="text-14 text-gray-33">{`${lang.selected} ${state.selected.length} ${lang.item}`}</span><span className="text-14 text-gray-af">/</span><span className="text-12 text-gray-af">{`${state.localGroups.length} ${lang.item}${lang.seedNet}`}</span>
                  </div>
                )}
              </div>
              <div className="flex-grow flex items-center justify-end gap-x-[57px]">
                <ProfileSelector
                  type="button"
                  className="h-7 bg-black text-14"
                  groupIds={state.selected}
                  profiles={state.allProfile}
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
          </>)}
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
                  { label: GROUP_TEMPLATE_TYPE_NAME[type as GROUP_TEMPLATE_TYPE] ?? type, value: type }
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
                options={state.allProfile.map((v) => (
                  {
                    label: (
                      <div
                        className="flex items-center"
                        key={v.profile.trxId}
                      >
                        <div className="mr-1 flex items-center justify-center box-content w-[28px] h-[28px] bg-white border-2 rounded-full overflow-hidden">
                          <Avatar avatar={v.profile.avatar} />
                        </div>
                        <div className="max-w-[68px] truncate flex-grow">{v.profile.name}</div>
                        <div className="ml-2 text-12 text-gray-9c">{v.count}</div>
                      </div>
                    ),
                    value: v.profile.trxId,
                  }
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
              {state.selected.length === state.localGroups.length && state.selected.length !== 0 && (
                <RiCheckboxFill className="text-16 text-producer-blue cursor-pointer" />
              )}
              {state.selected.length === 0 && (
                <RiCheckboxBlankFill className="text-16 text-white cursor-pointer" />
              )}
              {state.selected.length > 0 && state.selected.length < state.localGroups.length && (
                <RiCheckboxIndeterminateLine className="text-16 text-producer-blue cursor-pointer" />
              )}
              {state.selected.length !== 0 && (
                <div className="ml-3">
                  <span className="text-14">{`${lang.selected} ${state.selected.length} ${lang.item}`}</span>
                  <span className="text-14 text-gray-af">/</span>
                  <span className="text-12 text-gray-af">{`${state.localGroups.length} ${lang.item}${lang.seedNet}`}</span>
                </div>
              )}
            </div>
            {state.selected.length === 0 && (
              <div className="flex-grow flex items-center">
                <div className="flex flex-1 items-center">
                  <span>{lang.lastUpdated}</span>
                  <Order
                    className="text-20"
                    order={state.updateTimeOrder}
                    onClick={(order: string) => { state.updateTimeOrder = order; }}
                  />
                </div>
              </div>
            )}
            {state.selected.length !== 0 && (
              <div className="flex-grow flex items-center justify-end gap-x-[57px]">
                <ProfileSelector
                  type="button"
                  className="h-6 text-12"
                  groupIds={state.selected}
                  profiles={state.allProfile}
                />
                <div
                  className="h-6 border border-gray-af rounded pl-2 pr-[14px] flex items-center justify-center text-12 cursor-pointer"
                  onClick={() => handleLeaveGroup(groupStore.groups.filter((group) => state.selected.includes(group.group_id)))}
                >
                  <img className="w-[18px] h-[18px] mr-1.5" src={UnfollowGrayIcon} />
                  {lang.exitGroup}
                </div>
              </div>
            )}
          </div>

          <div className="flex-grow w-[960px] flex-1text-gray-6d mb-8 bg-gray-f7">
            {state.localGroups.map((group: IGroup) => (
              <div
                key={group.group_id}
                className={classNames(
                  'group-item px-5 h-[88px] flex items-center border-t border-gray-f2 bg-white',
                  state.selected.includes(group.group_id) && 'bg-gray-fa',
                )}
              >
                <div className="flex items-center w-[86px]">
                  {Object.values(GROUP_TEMPLATE_TYPE).includes(group.app_key) ? (
                    <div onClick={() => handleSelect(group.group_id)}>
                      {state.selected.includes(group.group_id)
                        ? <RiCheckboxFill className="text-16 text-producer-blue cursor-pointer" />
                        : <RiCheckboxBlankLine className="text-16 text-gray-af cursor-pointer" />}
                    </div>
                  ) : (
                    <div className="text-16 text-producer-blue cursor-pointer"><RiCheckboxBlankFill className="text-16 text-gray-af cursor-not-allowed" /></div>
                  )}
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
                    disable={!Object.values(GROUP_TEMPLATE_TYPE).includes(group.app_key)}
                    groupIds={[group.group_id]}
                    profiles={state.allProfile}
                    selected={`${groupStore.profileMap[group.group_id]?.name}-${groupStore.profileMap[group.group_id]?.avatar?.content}`}
                    status={groupStore.profileMap[group.group_id]?.status ?? ContentStatus.synced}
                  />
                </div>
                <div className="flex items-center w-[203px]">
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
            ))}
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
        <div className="fixed bottom-6 right-[50%] hidden 2lg:block mr-[-548px]">
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
