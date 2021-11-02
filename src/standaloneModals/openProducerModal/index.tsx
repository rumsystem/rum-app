import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider, useStore } from 'store';
import * as PersonModel from 'hooks/useDatabase/models/person';
import { IUser } from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';
import Button from 'components/Button';
import Avatar from 'components/Avatar';
import { ObjectsFilterType } from 'store/activeGroup';
import sleep from 'utils/sleep';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import { lang } from 'utils/lang';
import { unmountComponentAtNode, render } from 'react-dom';
import { ThemeRoot } from 'utils/theme';
import Dialog from 'components/Dialog';
import { Tooltip } from '@material-ui/core';
import AnnounceModal from './AnnounceModal';

export default async () => new Promise<void>((rs) => {
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
          <ProducerModal
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

interface IProps {
  rs: () => unknown
}

const ProducerModal = observer((props: IProps) => {
  const { activeGroupStore, confirmDialogStore, snackbarStore } = useStore();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();
  const state = useLocalObservable(() => ({
    open: true,
    unFollowingUsers: [] as IUser[],
    showAnnounceModal: false,
  }));

  React.useEffect(() => {
    (async () => {
      const unFollowings = Array.from(activeGroupStore.unFollowingSet);
      state.unFollowingUsers = await Promise.all(
        unFollowings.map(async (unFollowing) =>
          PersonModel.getUser(database, {
            GroupId: activeGroupStore.id,
            Publisher: unFollowing,
          })),
      );
    })();
  }, [activeGroupStore.unFollowingSet.size]);

  const goToUserPage = async (publisher: string) => {
    handleClose();
    await sleep(300);
    activeGroupStore.setObjectsFilter({
      type: ObjectsFilterType.SOMEONE,
      publisher,
    });
  };

  const follow = (publisher: string) => {
    confirmDialogStore.show({
      content: lang.confirmToFollow,
      okText: lang.yes,
      ok: async () => {
        try {
          await activeGroupStore.follow(offChainDatabase, {
            groupId: activeGroupStore.id,
            publisher,
          });
          confirmDialogStore.hide();
          await sleep(200);
          if (activeGroupStore.unFollowingSet.size === 0) {
            handleClose();
            await sleep(200);
          }
          snackbarStore.show({
            message: lang.settingDone,
            duration: 1000,
          });
        } catch (err) {
          console.error(err);
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
    });
  };

  const handleClose = () => {
    state.open = false;
    props.rs();
  };

  const tryRemoveProducer = () => {
    confirmDialogStore.show({
      content: '不再将 Ta 作为出块节点？',
      okText: lang.yes,
      ok: () => {
        confirmDialogStore.hide();
      },
    });
  };

  return (
    <Dialog
      open={state.open}
      onClose={handleClose}
      hideCloseButton
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-0 p-8 pb-10 relative">
        <div className="w-86">
          <div className="text-18 font-bold text-gray-700 text-center">
            出块节点
          </div>
          <div className="mt-5 h-72 overflow-y-scroll">

            {state.unFollowingUsers.map((user) => (
              <div
                className="py-[6px] pl-3 pr-1 flex items-center group"
                key={user.publisher}
              >
                <div
                  className="py-1 flex items-center"
                >
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => {
                      goToUserPage(user.publisher);
                    }}
                  >
                    <Avatar
                      profile={user.profile}
                      size={24}
                    />
                    <div className="max-w-[110px] pl-1">
                      <div className="text-gray-88 font-bold text-13 truncate">
                        {user.profile.name}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-88 ml-2 text-13">
                    生产了 <span className="font-bold mx-[2px]">56121</span> 个区块
                  </div>
                  <Button className="ml-2 invisible group-hover:visible" size="mini" color="red" outline onClick={tryRemoveProducer}>移除</Button>
                </div>

                <div className="w-16 hidden">
                  <Button
                    size="mini"
                    outline
                    onClick={() => follow(user.publisher)}
                  >
                    {lang.follow}
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex justify-center absolute right-5 top-[34px]">
              <Button
                size="mini"
                outline
                onClick={() => {
                  state.showAnnounceModal = true;
                }}
              >
                加入
              </Button>
              <Tooltip
                placement="top"
                title="申请已提交，等待群主审核，一旦审核通过，你将收到通知提醒"
                arrow
              >
                <div>
                  <Button
                    className="hidden"
                    size="mini"
                    color="gray"
                    outline
                    onClick={() => {
                      state.showAnnounceModal = true;
                    }}
                  >
                    等待审核
                  </Button>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
        <AnnounceModal
          open={state.showAnnounceModal}
          onClose={() => {
            state.showAnnounceModal = false;
          }}
        />
      </div>
    </Dialog>
  );
});
