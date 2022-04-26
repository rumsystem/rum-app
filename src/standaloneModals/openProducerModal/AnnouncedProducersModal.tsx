import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import Dialog from 'components/Dialog';
import Avatar from 'components/Avatar';
import Button from 'components/Button';
import { BsClock } from 'react-icons/bs';
import AnnounceModal from './AnnounceModal';
import GroupApi, { IAnnouncedProducer } from 'apis/group';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';
import { lang } from 'utils/lang';
import sleep from 'utils/sleep';
import useIsCurrentGroupOwner from 'store/selectors/useIsCurrentGroupOwner';
import useActiveGroup from 'store/selectors/useActiveGroup';

interface IProps {
  open: boolean
  onClose: () => void
}

const AnnouncedProducers = observer((props: IProps) => {
  const { activeGroupStore, snackbarStore, confirmDialogStore } = useStore();
  const activeGroup = useActiveGroup();
  const database = useDatabase();
  const isGroupOwner = useIsCurrentGroupOwner();
  const state = useLocalObservable(() => ({
    loading: true,
    producers: [] as IAnnouncedProducer[],
    userMap: {} as Record<string, PersonModel.IUser >,
    showAnnounceModal: false,
    owner: {} as PersonModel.IUser,
    isAnnouncedProducer: false,
  }));
  const pollingTimerRef = React.useRef(0);

  React.useEffect(() => {
    fetch();
  }, []);

  const fetch = React.useCallback(async () => {
    state.loading = true;
    try {
      const producers = await GroupApi.fetchAnnouncedProducers(activeGroupStore.id);
      const announcedProducers = producers.filter((producer) => producer.Result === 'ANNOUCNED');
      await Promise.all(announcedProducers.map(async (producer) => {
        const user = await PersonModel.getUser(database, {
          GroupId: activeGroupStore.id,
          Publisher: producer.AnnouncedPubkey,
        });
        state.userMap[producer.AnnouncedPubkey] = user;
      }));
      if (announcedProducers.length > 0) {
        state.owner = await PersonModel.getUser(database, {
          GroupId: activeGroupStore.id,
          Publisher: activeGroup.owner_pubkey,
        });
        state.isAnnouncedProducer = !!announcedProducers.find((producer) => producer.AnnouncedPubkey === activeGroup.user_pubkey);
      }
      state.producers = announcedProducers;
    } catch (err) {
      console.error(err);
    }
    state.loading = false;
  }, []);

  const cancelAnnouncement = async () => {
    try {
      await GroupApi.announce({
        group_id: activeGroupStore.id,
        action: 'remove',
        type: 'producer',
        memo: 'cancel',
      });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const tryProcessProducer = (action: 'ADD' | 'REMOVE', producerPubKey: string) => {
    confirmDialogStore.show({
      content: action === 'ADD' ? '允许 Ta 成为出块节点？' : '不再将 Ta 作为出块节点？',
      okText: lang.yes,
      ok: async () => {
        if (confirmDialogStore.loading) {
          return;
        }
        try {
          confirmDialogStore.setLoading(true);
          const res = await GroupApi.producer({
            group_id: activeGroupStore.id,
            action: action === 'ADD' ? 'add' : 'remove',
            producer_pubkey: producerPubKey,
          });
          console.log(`[producer]: after ${action} producer`, { res });
          pollingAfterProcessProducer(action, producerPubKey);
        } catch (err) {
          confirmDialogStore.setLoading(false);
          console.error(err);
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
    });
  };

  const pollingAfterProcessProducer = (action: 'ADD' | 'REMOVE', producerPubKey: string) => {
    pollingTimerRef.current = setInterval(async () => {
      try {
        const producers = await GroupApi.fetchApprovedProducers(activeGroupStore.id);
        console.log('[producer]: pollingAfterProcessProducer', { producers, groupId: activeGroupStore.id });
        const isApprovedProducer = !!producers.find((producer) => producer.ProducerPubkey === producerPubKey);
        if (action === 'ADD' ? isApprovedProducer : !isApprovedProducer) {
          clearInterval(pollingTimerRef.current);
          confirmDialogStore.setLoading(false);
          snackbarStore.show({
            message: action === 'ADD' ? '已允许' : '已移除',
            duration: 1000,
          });
          await sleep(1200);
          confirmDialogStore.hide();
          await sleep(500);
          const producers = state.producers.filter((producer) => producer.AnnouncedPubkey !== producerPubKey);
          if (producers.length === 0) {
            props.onClose();
          } else {
            state.producers = producers;
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 1000) as any;
  };

  React.useEffect(() => () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }
  }, []);

  return (
    <div className="bg-white py-8 px-10 relative">
      <div className="w-120 h-108 overflow-y-auto">
        <div className="text-18 font-bold text-gray-700 text-center">申请列表</div>
        {!state.loading && state.producers.map((producer) => {
          const user = state.userMap[producer.AnnouncedPubkey];
          return (
            <div key={producer.AnnouncedPubkey} className="mt-6 pb-6 border-b border-gray-ec relative">
              <Avatar
                className="absolute top-[-5px] left-0"
                profile={user.profile}
                size={40}
              />
              <div className="pl-10 ml-3 text-13">
                <div className="flex items-center leading-none">
                  <div className="text-gray-4a font-bold">
                    {user.profile.name}
                  </div>
                </div>
                <div className="mt-2 opacity-90 leading-relaxed">
                  {producer.Action === 'ADD' ? '我想成为出块节点' : '我不想再继续做出块节点'}，理由是：{producer.Action === 'ADD' ? '非常活跃，能够保证 24 小时稳定在线' : '最近比较忙，没办法保持在线'}
                </div>
                <div className="mt-3 flex items-center">
                  {!isGroupOwner && (
                    <div className="flex items-center">
                      <div className="flex items-center leading-none text-14 text-gray-88">
                        <BsClock />
                        <span className="ml-2 text-12 text-gray-99">已提交申请，等待 {state.owner.profile.name} 通过</span>
                      </div>
                      <Button
                        className="ml-4 hidden"
                        color="red"
                        size="tiny"
                        outline
                        onClick={cancelAnnouncement}
                      >
                        撤回
                      </Button>
                    </div>
                  )}
                  {isGroupOwner && producer.Action === 'ADD' && (
                    <Button
                      className="mr-5"
                      size="mini"
                      outline
                      onClick={() => tryProcessProducer(producer.Action, producer.AnnouncedPubkey)}
                    >
                      允许
                    </Button>
                  )}
                  {isGroupOwner && producer.Action === 'REMOVE' && (
                    <Button
                      className="mr-5"
                      size="mini"
                      color="red"
                      outline
                      onClick={() => tryProcessProducer(producer.Action, producer.AnnouncedPubkey)}
                    >
                      移除
                    </Button>
                  )}
                  <Button
                    className="hidden"
                    color="red"
                    size="mini"
                    outline
                    onClick={() => {
                      snackbarStore.show({
                        message: '暂未支持',
                        type: 'error',
                      });
                    }}
                  >
                    拒绝
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {!state.loading && isGroupOwner && state.producers.length === 0 && (
          <div className="text-center mt-24 text-gray-400 opacity-80">
            暂时没有需要处理的申请
          </div>
        )}
        {!state.loading && !isGroupOwner && !state.isAnnouncedProducer && (
          <div>
            {state.producers.length > 2 && (
              <div className="absolute right-5 top-[34px]">
                <Button
                  className="hidden"
                  size="mini"
                  outline
                  onClick={() => {
                    state.showAnnounceModal = true;
                  }}
                >
                  提交申请
                </Button>
              </div>
            )}
            {state.producers.length <= 2 && (
              <div className={`flex justify-center ${state.producers.length > 0 ? 'mt-16' : 'mt-24'}`}>
                <Button
                  outline
                  onClick={() => {
                    state.showAnnounceModal = true;
                  }}
                >
                  点击提交申请
                </Button>
              </div>
            )}
            <AnnounceModal
              open={state.showAnnounceModal}
              onClose={() => {
                state.showAnnounceModal = false;
                fetch();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={props.onClose}
    transitionDuration={{
      enter: 300,
    }}
  >
    <AnnouncedProducers {...props} />
  </Dialog>
));
