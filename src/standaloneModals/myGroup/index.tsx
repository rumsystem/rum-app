import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import classNames from 'classnames';
import { action, reaction, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import {
  Fade,
  FormControl,
  InputLabel,
  OutlinedInput,
  Radio,
  TextField,
} from '@material-ui/core';

import GroupApi from 'apis/group';
// import Button from 'components/Button';
import sleep from 'utils/sleep';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import useFetchGroups from 'hooks/useFetchGroups';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';
import { lang } from 'utils/lang';
import { assetsBasePath } from 'utils/env';
import { joinGroup } from 'standaloneModals/joinGroup';
import { createGroup } from 'standaloneModals/createGroup';
import { IoSearch } from 'react-icons/io5';
import Selector from './selector';


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
    step: 0,

    type: GROUP_TEMPLATE_TYPE.TIMELINE,
    name: '',
    desc: '',
    consensusType: 'poa',
    encryptionType: 'public',

    keyword: '',
    seedNetType: 'all',

    creating: false,
  }));
  const {
    snackbarStore,
    seedStore,
    nodeStore,
    activeGroupStore,
  } = useStore();
  const fetchGroups = useFetchGroups();
  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleTypeChange = action((type: GROUP_TEMPLATE_TYPE) => {
    state.type = type;
  });

  const handleConfirm = async () => {
    if (!state.name) {
      snackbarStore.show({
        message: lang.require(lang.groupName),
        type: 'error',
      });
      return;
    }

    if (state.creating) {
      return;
    }

    runInAction(() => { state.creating = true; });

    try {
      const group = await GroupApi.createGroup({
        groupName: state.name,
        consensusType: state.consensusType,
        encryptionType: state.type === GROUP_TEMPLATE_TYPE.NOTE ? 'private' : state.encryptionType,
        groupType: state.type,
      });
      await sleep(300);
      await fetchGroups();
      await sleep(300);
      seedStore.addSeed(nodeStore.storagePath, group.group_id, group);
      activeGroupStore.setId(group.group_id);
      await sleep(200);
      snackbarStore.show({
        message: lang.created,
      });
      handleClose();
      sleep(500).then(() => {
        runInAction(() => { state.creating = false; });
      });
    } catch (err) {
      console.error(err);
      runInAction(() => { state.creating = false; });
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  React.useEffect(() => reaction(
    () => state.step,
    () => {
      if (scrollBox.current) {
        scrollBox.current.scrollTop = 0;
      }
    },
  ), []);

  React.useEffect(action(() => {
    state.open = true;
  }), []);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      handleConfirm();
    }
  };

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
              <Selector />
            </div>
            <div className="flex items-center">
              <div className="text-gray-af text-12 scale-[0.85]">{lang.seedNet}</div>
              <Selector />
            </div>
            <div className="flex items-center">
              <div className="text-gray-af text-12 scale-[0.85]">{lang.seedNet}</div>
              <Selector />
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
          <div className="w-[960px] flex-1 text-gray-6d mb-8 px-10 pb-6 bg-white">
            {state.step === 0 && (<>
              <div className="text-18 font-medium">
                {lang.createGroup} - {lang.chooseTemplate}
              </div>

              <div className="mt-3 text-12 text-gray-9c">
                {lang.groupTypeDesc}
              </div>

              <div className="flex justify-center gap-x-20 mt-16 mb-6">
                {([
                  [lang.sns, GROUP_TEMPLATE_TYPE.TIMELINE, TimelineIcon],
                  [lang.forum, GROUP_TEMPLATE_TYPE.POST, PostIcon],
                  [lang.note, GROUP_TEMPLATE_TYPE.NOTE, NotebookIcon],
                ] as const).map(([name, type, GroupIcon], i) => (
                  <div
                    className={classNames(
                      'flex flex-col items-center select-none cursor-pointer px-4',
                      // type === 'post' && 'pointer-events-none opacity-60',
                    )}
                    onClick={() => handleTypeChange(type)}
                    key={i}
                  >
                    <div className="relative">
                      &nbsp;
                      <div className="absolute text-black whitespace-nowrap text-16 left-1/2 -translate-x-1/2 top-0">
                        {name}
                      </div>
                    </div>
                    <div className="mt-2 h-14 flex flex-center">
                      <GroupIcon
                        className="w-14 text-black"
                        style={{
                          strokeWidth: 2,
                        }}
                      />
                    </div>
                    <div className="text-16 flex items-center">
                      <Radio
                        disableRipple
                        color="primary"
                        size="small"
                        checked={state.type === type}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-14 px-5">
                {state.type === GROUP_TEMPLATE_TYPE.TIMELINE && (
                  <div className="animate-fade-in text-center">
                    {lang.snsDesc}
                  </div>
                )}
                {state.type === GROUP_TEMPLATE_TYPE.POST && (
                  <div className="animate-fade-in text-center">
                    {lang.forumDesc}
                  </div>
                )}
                {state.type === GROUP_TEMPLATE_TYPE.NOTE && (
                  <div className="animate-fade-in text-center">
                    {lang.noteDesc}
                  </div>
                )}
              </div>

              <FormControl className="mt-8 w-full" variant="outlined">
                <InputLabel>{lang.groupName}</InputLabel>
                <OutlinedInput
                  label={lang.groupName}
                  value={state.name}
                  onChange={action((e) => { state.name = e.target.value; })}
                  spellCheck={false}
                  onKeyDown={handleInputKeyDown}
                />
              </FormControl>
            </>)}
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
