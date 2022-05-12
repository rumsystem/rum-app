import React from 'react';
import classNames from 'classnames';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { format } from 'date-fns';
import { Fade, Switch } from '@material-ui/core';

import { IGroup } from 'apis/group';
import { StoreProvider, useStore } from 'store';

import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import { getGroupIcon } from 'utils/getGroupIcon';

import ProfileSelector from 'components/profileSelector';
import MixinUIDSelector from 'components/mixinUIDSelector';
import GroupIcon from 'components/GroupIcon';
import BackToTop from 'components/BackToTop';
import Help from 'layouts/Main/Help';

import UnfollowIcon from 'assets/unfollow.svg';
import SearchGroupIcon from 'assets/search_group.svg';
import { isGroupOwner, getRole } from 'store/selectors/group';

import Navbar from './navbar';
import Searcher from './searcher';

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

export const myWallet = async () => new Promise<void>((rs) => {
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
          <MyWallet
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

const MyWallet = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: false,
    groups: [] as any[],
    localGroups: [] as any[],
    keyword: '',
    allSeedNetType: [] as any,
    allRole: [] as any,
    allProfile: [] as any,
    allMixinUID: [] as any,
    selected: [] as string[],
    hideUnfamousCoin: false,
  }));

  const { groupStore } = useStore();

  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  React.useEffect(action(() => {
    let newGroups = groupStore.groups;
    if (state.keyword) {
      newGroups = groupStore.groups.filter((group) => group.group_name.includes(state.keyword));
    }
    state.localGroups = newGroups;
    state.selected = state.selected.filter((id) => state.localGroups.map((group) => group.group_id).includes(id));
  }), [state, state.keyword]);

  React.useEffect(action(() => {
    state.allSeedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
    state.allRole = [...new Set(groupStore.groups.map(getRole))];
    const [profiles, mixinUIDs] = groupProfile(groupStore.groups);
    state.allProfile = profiles;
    state.allMixinUID = mixinUIDs;
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
      <div
        className="flex flex-col items-stretch fixed inset-0 top-[40px] bg-gray-f7 z-50"
        data-test-id="my-wallet-modal"
      >
        <Navbar onClose={handleClose} />

        <div
          className="flex flex-col items-center overflow-auto flex-1"
          ref={scrollBox}
        >
          <div className="w-[960px] mt-[22px] mb-[11px] flex items-center gap-x-[30px]">
            <div className="flex items-center">
              <div className="text-gray-af text-17">{lang.hideUnfamousCoin}</div>
              <Switch checked={state.hideUnfamousCoin} onChange={() => { state.hideUnfamousCoin = !state.hideUnfamousCoin; }} color='primary' />
            </div>
            <Searcher
              width="280px"
              keyword={state.keyword}
              onChange={(value: string) => {
                state.keyword = value;
              }}
              placeholder={lang.searchCoin}
            />
          </div>

          <div
            className="w-[960px] h-[41px] flex-shrink-0 px-5 flex items-center bg-black text-14 text-gray-f2 rounded-t-md"
          >
            <div className="flex-grow flex items-center">
              <div className="flex flex-1 items-center">
                <span>{lang.lastUpdated}</span>
              </div>
              <div className="flex items-center w-[203px]">
                <span>{lang.bindWallet}</span>
              </div>
            </div>
          </div>

          <div className="flex-grow w-[960px] flex-1text-gray-6d mb-8 bg-gray-f7">
            {
              state.localGroups.map((group: IGroup) => (
                <div
                  key={group.group_id}
                  className={classNames(
                    'group-item px-5 h-[88px] flex items-center border-t border-gray-f2 bg-white',
                  )}
                >
                  <div className="flex items-center w-[86px]">
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
          .group-item:hover .unfollow {
            visibility: visible !important;
          }
        `}</style>
      </div>
    </Fade>
  );
});
