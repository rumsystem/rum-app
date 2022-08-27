import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
// import classNames from 'classnames';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import {
  Fade,
  TextField,
} from '@material-ui/core';

import { IGroup } from 'apis/group';
// import Button from 'components/Button';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import { lang } from 'utils/lang';
import { assetsBasePath } from 'utils/env';
import { joinGroup } from 'standaloneModals/joinGroup';
import { createGroup } from 'standaloneModals/createGroup';
import { IoSearch } from 'react-icons/io5';
import Filter from './filter';
import Order from './order';
import { RiCheckboxBlankLine, RiCheckboxFill, RiCheckboxIndeterminateLine, RiCheckboxBlankFill } from 'react-icons/ri';
import { GROUP_TEMPLATE_TYPE, GROUP_TEMPLATE_TYPE_NAME, GROUP_TEMPLATE_TYPE_ICON } from 'utils/constant';
import { format } from 'date-fns';

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
    keyword: '',
    seedNetType: [] as any,
    seedNetAllType: [] as any,
    createTimeOrder: '',
    walletOrder: '',
    selected: [] as string[],
  }));

  const {
    groupStore,
  } = useStore();

  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleSelect = action((value: string) => {
    if (state.selected.includes(value)) {
      state.selected = state.selected.filter((item: string) => item !== value);
    } else {
      state.selected = [...state.selected, value];
    }
  });

  const handleSelectAll = action(() => {
    if (state.selected.length !== state.groups.length) {
      state.selected = state.groups.map((group) => group.group_id);
    } else {
      state.selected = [];
    }
  });

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  React.useEffect(action(() => {
    let groups = groupStore.groups.filter((group) => state.seedNetType.includes(group.app_key));
    if (state.keyword) {
      groups = groups.filter((group) => group.group_name.includes(state.keyword));
    }
    if (state.createTimeOrder === 'asc') {
      groups = groups.sort((a, b) => a.last_updated - b.last_updated);
    }
    if (state.createTimeOrder === 'desc') {
      groups = groups.sort((a, b) => b.last_updated - a.last_updated);
    }
    state.groups = groups;
    state.selected = state.selected.filter((id) => groups.map((group) => group.group_id).includes(id));
  }), [state, state.createTimeOrder, state.seedNetType, state.keyword]);

  React.useEffect(action(() => {
    state.open = true;
    state.seedNetAllType = [...new Set(groupStore.groups.map((group) => group.app_key))];
    state.seedNetType = [...new Set(groupStore.groups.map((group) => group.app_key))];
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
                options={state.seedNetAllType.map((type: string) => (
                  { name: GROUP_TEMPLATE_TYPE_NAME[type as GROUP_TEMPLATE_TYPE], value: type }
                ))}
                selected={state.seedNetType}
                onFilter={(values) => { state.seedNetType = values; }}
              />
            </div>
            <div className="flex items-center">
              <div className="text-gray-af text-12 scale-[0.85]">{lang.seedNet}</div>
              <Filter
                options={state.seedNetAllType.map((type: string) => (
                  { name: GROUP_TEMPLATE_TYPE_NAME[type as GROUP_TEMPLATE_TYPE], value: type }
                ))}
                selected={state.seedNetType}
                onFilter={(values) => { state.seedNetType = values; }}
              />
            </div>
            <div className="flex items-center">
              <div className="text-gray-af text-12 scale-[0.85]">{lang.seedNet}</div>
              <Filter
                options={state.seedNetAllType.map((type: string) => (
                  { name: GROUP_TEMPLATE_TYPE_NAME[type as GROUP_TEMPLATE_TYPE], value: type }
                ))}
                selected={state.seedNetType}
                onFilter={(values) => { state.seedNetType = values; }}
              />
            </div>
            <div className="text-producer-blue text-12 scale-[0.85]">清空选择</div>
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
                state.selected.length === state.groups.length && state.selected.length !== 0 && <RiCheckboxFill className="text-16 text-producer-blue cursor-pointer" />
              }
              {
                state.selected.length === 0 && <RiCheckboxBlankFill className="text-16 text-white cursor-pointer" />
              }
              {
                state.selected.length > 0 && state.selected.length < state.groups.length && <RiCheckboxIndeterminateLine className="text-16 text-producer-blue cursor-pointer" />
              }
            </div>
            <div className="flex flex-1 items-center">
              <span>{lang.createTime}</span>
              <Order
                className="text-20"
                order={state.createTimeOrder}
                onClick={(order: string) => { state.createTimeOrder = order; }}
              />
            </div>
            <div className="flex items-center w-[203px]">
              <span>{lang.bindWallet}</span>
              <Order
                className="text-20"
                order={state.walletOrder}
                onClick={(order: string) => { state.walletOrder = order; }}
              />
            </div>
          </div>

          <div className="w-[960px] flex-1text-gray-6d mb-8 bg-white">
            {
              state.groups.map((group: IGroup) => (
                <div key={group.group_id} className="px-5 h-[88px] flex items-center border-t border-gray-fa">
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
                    <div className="text-12 text-gray-9c">
                      {`创建于 ${format(group.last_updated / 1000000, 'yyyy/MM/dd')}`}
                    </div>
                  </div>
                  <div className="flex items-center w-[236px]">
                    <Filter
                      options={state.seedNetAllType.map((type: string) => (
                        { name: GROUP_TEMPLATE_TYPE_NAME[type as GROUP_TEMPLATE_TYPE], value: type }
                      ))}
                      selected={state.seedNetType}
                      onFilter={(values) => { state.seedNetType = values; }}
                    />
                  </div>
                  <div className="flex items-center w-[203px]">
                    <Filter
                      options={state.seedNetAllType.map((type: string) => (
                        { name: GROUP_TEMPLATE_TYPE_NAME[type as GROUP_TEMPLATE_TYPE], value: type }
                      ))}
                      selected={state.seedNetType}
                      onFilter={(values) => { state.seedNetType = values; }}
                    />
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
        `}</style>
      </div>
    </Fade>
  );
});
