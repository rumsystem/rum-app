import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider, useStore } from 'store';
import Button from 'components/Button';
import Avatar from 'components/Avatar';
import { ObjectsFilterType } from 'store/activeGroup';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import { unmountComponentAtNode, render } from 'react-dom';
import { ThemeRoot } from 'utils/theme';
import Dialog from 'components/Dialog';
import { Badge } from '@material-ui/core';
import AnnouncedProducersModal from './AnnouncedProducersModal';
import GroupApi, { IApprovedProducer } from 'apis/group';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';
import Loading from 'components/Loading';

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
  const { activeGroupStore, confirmDialogStore, groupStore } = useStore();
  const activeGroup = useActiveGroup();
  const isGroupOwner = useIsGroupOwner(
    activeGroup,
  );
  const database = useDatabase();
  const state = useLocalObservable(() => ({
    open: true,
    loading: true,
    producers: [] as IApprovedProducer[],
    users: {} as PersonModel.IUser[],
    showAnnouncedProducersModal: false,
  }));

  const goToUserPage = async (publisher: string) => {
    handleClose();
    await sleep(300);
    activeGroupStore.setObjectsFilter({
      type: ObjectsFilterType.SOMEONE,
      publisher,
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

  React.useEffect(() => {
    (async () => {
      try {
        state.producers = await GroupApi.fetchApprovedProducers(activeGroupStore.id);
        state.users = await Promise.all(state.producers.map(async (producer) => {
          const user = await PersonModel.getUser(database, {
            GroupId: activeGroupStore.id,
            Publisher: producer.ProducerPubkey,
          });
          return user;
        }));
      } catch (err) {
        console.error(err);
      }
      state.loading = false;
    })();
  }, []);

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
        <div className="w-81">
          <div className="text-18 font-bold text-gray-700 text-center">
            出块节点
          </div>
          <div className="mt-5 h-64 overflow-y-scroll">
            {state.loading && (
              <div className="mt-20">
                <Loading />
              </div>
            )}
            {!state.loading && state.producers.map((producer, index) => {
              const user = state.users[index];
              return (
                <div
                  className="py-[7px] pl-3 flex items-center group"
                  key={producer.ProducerPubkey}
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
                      <div className="max-w-[95px] pl-1">
                        <div className="text-gray-88 font-bold text-13 truncate">
                          {user.profile.name}
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-88 ml-1 text-13">
                      生产了 <span className="font-bold mx-[2px]">{producer.BlockProduced}</span> 个区块
                    </div>
                    {isGroupOwner && producer.OwnerPubkey !== activeGroup.owner_pubkey && (
                      <Button className="ml-2 invisible group-hover:visible" size="mini" color="red" outline onClick={tryRemoveProducer}>移除</Button>
                    )}
                  </div>

                  <div className="w-16 hidden">
                    <Button
                      size="mini"
                      outline
                    >
                      {lang.follow}
                    </Button>
                  </div>
                </div>
              );
            })}
            {!state.loading && (!isGroupOwner || groupStore.hasAnnouncedProducersMap[activeGroupStore.id]) && (
              <div className="flex justify-center absolute right-5 top-[34px]">
                <div className="relative">
                  <Badge
                    className="absolute top-[7px] right-[7px] transform scale-90"
                    classes={{
                      badge: 'bg-red-500',
                    }}
                    invisible={true}
                    variant="dot"
                  />
                  <Button
                    size="mini"
                    outline
                    onClick={() => {
                      state.showAnnouncedProducersModal = true;
                    }}
                  >
                    {isGroupOwner ? '待处理的申请' : '提交申请'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <AnnouncedProducersModal
          open={state.showAnnouncedProducersModal}
          onClose={() => {
            state.showAnnouncedProducersModal = false;
          }}
        />
      </div>
    </Dialog>
  );
});
