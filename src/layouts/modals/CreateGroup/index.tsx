import React from 'react';
import classNames from 'classnames';
import { action, reaction, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import {
  Fade,
  FormControl,
  InputLabel,
  OutlinedInput,
  Radio,
  Select,
  MenuItem,
} from '@material-ui/core';

import GroupApi from 'apis/group';
import Button from 'components/Button';
import { assetsBasePath } from 'utils/env';
import sleep from 'utils/sleep';
import { GROUP_TEMPLATE_TYPE } from 'utils/constant';
import { useStore } from 'store';
import useDatabase from 'hooks/useDatabase';
import useFetchGroups from 'hooks/useFetchGroups';
import TimelineIcon from 'assets/template/template_icon_timeline.svg?react';
import PostIcon from 'assets/template/template_icon_post.svg?react';
import NotebookIcon from 'assets/template/template_icon_notebook.svg?react';

export const CreateGroup = observer(() => {
  const state = useLocalObservable(() => ({
    step: 0,

    type: GROUP_TEMPLATE_TYPE.TIMELINE,
    name: '',
    desc: '',
    consensusType: 'poa',
    encryptionType: 'public',

    creating: false,
  }));
  const {
    snackbarStore,
    seedStore,
    nodeStore,
    latestStatusStore,
    activeGroupStore,
    modalStore,
  } = useStore();
  const database = useDatabase();
  const fetchGroups = useFetchGroups();
  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleTypeChange = action((type: GROUP_TEMPLATE_TYPE) => {
    state.type = type;
  });

  const handleConfirm = async () => {
    if (!state.name) {
      snackbarStore.show({
        message: '请输入群组名称',
        type: 'error',
      });
      return;
    }
    if (!state.name || state.name.length < 5) {
      snackbarStore.show({
        message: '名称至少要输入5个字哦',
        type: 'error',
      });
      return;
    }

    runInAction(() => { state.creating = true; });

    try {
      const group = await GroupApi.createGroup({
        groupName: state.name,
        consensusType: state.consensusType,
        encryptionType: state.encryptionType,
        groupType: state.type,
      });
      await sleep(300);
      await fetchGroups();
      await sleep(300);
      seedStore.addSeed(nodeStore.storagePath, group.group_id, group);
      latestStatusStore.updateMap(database, group.group_id, {
        latestTimeStamp: Date.now() * 1000000,
      });
      activeGroupStore.setId(group.group_id);
      modalStore.createGroup.close();
      await sleep(200);
      snackbarStore.show({
        message: '创建成功',
      });
      sleep(500).then(() => {
        runInAction(() => { state.creating = false; });
      });
    } catch (err) {
      console.error(err);
      runInAction(() => { state.creating = false; });
      snackbarStore.show({
        message: '创建失败，貌似哪里出错了',
        type: 'error',
      });
    }
  };

  const handleClose = action(() => {
    modalStore.createGroup.close();
  });

  React.useEffect(() => reaction(
    () => state.step,
    () => {
      if (scrollBox.current) {
        scrollBox.current.scrollTop = 0;
      }
    },
  ), []);

  React.useEffect(() => reaction(
    () => modalStore.createGroup.show,
    action(() => {
      if (modalStore.createGroup.show) {
        state.step = 0;
        state.type = GROUP_TEMPLATE_TYPE.TIMELINE;
        state.name = '';
        state.desc = '';
        state.consensusType = 'poa';
        state.encryptionType = 'public';
        state.creating = false;
      }
    }),
  ), []);

  return (
    <Fade
      in={modalStore.createGroup.show}
      timeout={500}
      mountOnEnter
      unmountOnExit
    >
      <div className="flex flex-col items-stretch absolute inset-0 top-[80px] bg-gray-f7 z-50">
        <div
          className="flex flex-col items-center overflow-auto flex-1"
          ref={scrollBox}
        >
          <div className="w-[800px] flex-1 text-gray-6d my-8 px-10 py-6 bg-white">
            {state.step === 0 && (<>
              <div className="text-18 font-medium">
                成立群组 - 选择群组模板
              </div>

              <div className="mt-3 text-12 text-gray-9c">
                模板会决定你所创建的群组/讨论区/内容的产品形态。
                每一个模板都针对使用场景做了专门的设计和功能优化，
                对发布功能、经济系统、社交关系、管理员权限、成员管理等功能的支持会有所不同。
              </div>

              <div className="flex justify-center gap-x-20 mt-16 mb-10">
                {([
                  ['群组/SNS', GROUP_TEMPLATE_TYPE.TIMELINE, TimelineIcon],
                  ['论坛', GROUP_TEMPLATE_TYPE.POST, PostIcon],
                  ['私密笔记/档案', GROUP_TEMPLATE_TYPE.NOTE, NotebookIcon],
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

              <div className="text-14 px-7">
                {state.type === GROUP_TEMPLATE_TYPE.TIMELINE && (
                  <div>
                    <span className="text-16 font-bold">群组/SNS：</span>
                    根据时间线排列小组成员发布的内容，鼓励全体组员以短文的形式即时呈现自己的想法和状态。
                  </div>
                )}
                {state.type === GROUP_TEMPLATE_TYPE.POST && (
                  <div>
                    <span className="text-16 font-bold">论坛：</span>
                    以主题贴的形式发布内容，鼓励组员对某一个主题进行深入讨论，不鼓励重复发布相同的讨论内容。
                  </div>
                )}
                {state.type === GROUP_TEMPLATE_TYPE.NOTE && (
                  <div>
                    <span className="text-16 font-bold">私密笔记/档案：</span>
                    用于个人记录笔记或者档案。
                  </div>
                )}
              </div>

              <FormControl className="mt-12 w-full" variant="outlined">
                <InputLabel>群组名称</InputLabel>
                <OutlinedInput
                  label="群组名称"
                  value={state.name}
                  onChange={action((e) => { state.name = e.target.value; })}
                  spellCheck={false}
                />
              </FormControl>

              <div className="flex gap-x-6 mt-6">
                <FormControl className="flex-1" variant="outlined">
                  <InputLabel>共识类型</InputLabel>
                  <Select
                    value={state.consensusType}
                    onChange={action((e) => { state.consensusType = e.target.value as string; })}
                    label="共识类型"
                  >
                    <MenuItem value="poa">poa</MenuItem>
                    <MenuItem value="pos">pos</MenuItem>
                    <MenuItem value="pos">pow</MenuItem>
                  </Select>
                </FormControl>

                <FormControl className="flex-1" variant="outlined">
                  <InputLabel>加密类型</InputLabel>
                  <Select
                    value={state.encryptionType}
                    onChange={action((e) => { state.encryptionType = e.target.value as string; })}
                    label="加密类型"
                  >
                    <MenuItem value="public">public</MenuItem>
                    <MenuItem value="private">private</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </>)}
          </div>

          {/* <StepBox
            className="my-8"
            total={1}
            value={state.step}
            onSelect={handleStepChange}
          /> */}
        </div>

        <div className="flex self-stretch justify-center items-center h-30 bg-white">
          {/* <div className="flex flex-center text-gray-4a">
            <img
              className="mr-1 mt-px"
              src={`${assetsBasePath}/logo_rumsystem.svg`}
              alt=""
              width="12"
            />
            配置费用：未知
          </div> */}
          <div className="flex items-center gap-x-8 absolute left-0 ml-20 rounded-md">
            <Button
              className={classNames(
                'w-40 h-12 rounded-md border ',
                !state.creating && '!bg-gray-f7 !border-black',
                state.creating && '!border-gray-99',
              )}
              noRound
              onClick={handleClose}
              disabled={state.creating}
            >
              <span
                className={classNames(
                  'text-16',
                  !state.creating && 'text-black',
                  state.creating && 'text-gray-99',
                )}
              >
                取消
              </span>
            </Button>
          </div>
          <div className="flex items-center gap-x-8 absolute right-0 mr-20 rounded-md">
            {/* {state.step !== 0 && (
              <Button
                className={classNames(
                  'w-40 h-12 rounded-md border ',
                  !state.creating && '!bg-gray-f7 !border-black',
                  state.creating && '!border-gray-99',
                )}
                noRound
                onClick={handlePrevStep}
                disabled={state.creating}
              >
                <span
                  className={classNames(
                    'text-16',
                    !state.creating && 'text-black',
                    state.creating && 'text-gray-99',
                  )}
                >
                  上一步
                </span>
              </Button>
            )} */}
            {/* {state.step !== 1 && (
              <Button
                className="w-40 h-12 rounded-md"
                noRound
                onClick={handleNextStep}
              >
                <span className="text-16">
                  下一步
                </span>
              </Button>
            )} */}
            {state.step === 0 && (
              <Button
                className="h-12 rounded-md"
                noRound
                onClick={handleConfirm}
                disabled={state.creating}
                isDoing={state.creating}
              >
                <span className="text-16 px-2">
                  立即成立群组
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Fade>
  );
});
