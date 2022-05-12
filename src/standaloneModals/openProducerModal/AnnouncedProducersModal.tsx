import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { useStore } from 'store';
import Dialog from 'components/Dialog';
import Avatar from 'components/Avatar';
import Button from 'components/Button';
import { MdCheckCircle } from 'react-icons/md';
import { BsClock } from 'react-icons/bs';
import AnnounceModal from './AnnounceModal';
import GroupApi, { IAnnouncedProducer } from 'apis/group';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';
import { lang } from 'utils/lang';
import { sleep } from 'utils/sleep';

const AnnouncedProducers = observer(() => {
  const { activeGroupStore, snackbarStore } = useStore();
  const database = useDatabase();
  const state = useLocalObservable(() => ({
    loading: true,
    producers: [] as IAnnouncedProducer[],
    users: {} as PersonModel.IUser[],
    showAnnounceModal: false,
  }));

  React.useEffect(() => {
    fetchAnnouncedProducers();
  }, []);

  const fetchAnnouncedProducers = React.useCallback(async () => {
    try {
      const producers = await GroupApi.fetchAnnouncedProducers(activeGroupStore.id);
      state.producers = producers.filter((producer) => producer.Result === 'ANNOUNCED');
      state.users = await Promise.all(state.producers.map(async (producer) => {
        const user = await PersonModel.getUser(database, {
          GroupId: activeGroupStore.id,
          Publisher: producer.AnnouncedPubkey,
        });
        return user;
      }));
    } catch (err) {
      console.error(err);
    }
    state.loading = false;
  }, []);

  const cancelAnnouncement = async () => {
    try {
      const res = await GroupApi.announce({
        group_id: activeGroupStore.id,
        action: 'remove',
        type: 'producer',
        memo: 'cancel',
      });
      console.log({ res });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  const approve = async (producerPubKey: string) => {
    try {
      const res = await GroupApi.approveProducer({
        group_id: activeGroupStore.id,
        action: 'add',
        producer_pubkey: producerPubKey,
      });
      console.log({ res });
    } catch (err) {
      console.error(err);
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
  };

  return (
    <div className="bg-white py-8 px-10 relative">
      <div className="w-120 h-108 overflow-y-scroll">
        <div className="text-18 font-bold text-gray-700 text-center">向群主提交申请</div>
        {!state.loading && state.producers.map((producer, index) => {
          const user = state.users[index];
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
                  我想成为出块节点，理由是：非常活跃，能够保证 24 小时稳定在线
                </div>
                <div className="mt-3 flex items-center">
                  <div className="flex items-center hidden">
                    <div className="flex items-center leading-none text-14 text-gray-99 ">
                      <BsClock />
                      <span className="ml-2 text-12 -mt-1-px">已提交申请，等待群主通过</span>
                    </div>
                    <Button
                      className="ml-4"
                      color="red"
                      size="tiny"
                      outline
                      onClick={cancelAnnouncement}
                    >
                      撤回
                    </Button>
                  </div>
                  <div className="flex items-center leading-none text-16 text-green-500 hidden">
                    <MdCheckCircle />
                    <span className="ml-2 text-12 -mt-1-px">已允许</span>
                  </div>
                  <Button
                    className="mr-5"
                    size="mini"
                    outline
                    onClick={() => approve(producer.AnnouncedPubkey)}
                  >
                    允许
                  </Button>
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
        {!state.loading && (
          <div>
            <div className="absolute right-5 top-[34px]">
              <Button
                className="hidden"
                size="mini"
                outline
                onClick={() => {
                  state.showAnnounceModal = true;
                }}
              >
                申请
              </Button>
            </div>
            <div className="flex justify-center mt-24">
              <Button
                outline
                onClick={() => {
                  state.showAnnounceModal = true;
                }}
              >
                提交申请
              </Button>
            </div>
            <AnnounceModal
              open={state.showAnnounceModal}
              onClose={(effected?: boolean) => {
                state.showAnnounceModal = false;
                (async () => {
                  await sleep(300);
                  if (effected) {
                    fetchAnnouncedProducers();
                  }
                })();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

interface IProps {
  open: boolean
  onClose: () => void
}

export default observer((props: IProps) => (
  <Dialog
    hideCloseButton
    open={props.open}
    onClose={props.onClose}
    transitionDuration={{
      enter: 300,
    }}
  >
    <AnnouncedProducers />
  </Dialog>
));
