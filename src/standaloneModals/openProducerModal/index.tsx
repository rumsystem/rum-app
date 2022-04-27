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
import ProducerApi, { IApprovedProducer } from 'apis/producer';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useIsCurrentGroupOwner from 'store/selectors/useIsCurrentGroupOwner';
import * as PersonModel from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';

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
  const { activeGroupStore, confirmDialogStore, groupStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const isGroupOwner = useIsCurrentGroupOwner();
  const database = useDatabase();
  const state = useLocalObservable(() => ({
    open: true,
    loading: true,
    producers: [] as IApprovedProducer[],
    userMap: {} as Record<string, PersonModel.IUser >,
    showAnnouncedProducersModal: false,
  }));
  const pollingTimerRef = React.useRef(0);

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

  const tryRemoveProducer = (producerPubKey: string) => {
    confirmDialogStore.show({
      content: lang.confirmToRemoveProducer,
      okText: lang.yes,
      ok: async () => {
        if (confirmDialogStore.loading) {
          return;
        }
        try {
          confirmDialogStore.setLoading(true);
          const res = await ProducerApi.producer({
            group_id: activeGroupStore.id,
            action: 'remove',
            producer_pubkey: producerPubKey,
          });
          console.log('[producer]: after removed', { res });
          pollingAfterRemove(producerPubKey);
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

  const pollingAfterRemove = (producerPubKey: string) => {
    pollingTimerRef.current = setInterval(async () => {
      try {
        const producers = await ProducerApi.fetchApprovedProducers(activeGroupStore.id) || [];
        console.log('[producer]: pollingAfterRe', { producers, groupId: activeGroupStore.id });
        const isNotApprovedProducer = !producers.find((producer) => producer.ProducerPubkey === producerPubKey);
        if (isNotApprovedProducer) {
          clearInterval(pollingTimerRef.current);
          confirmDialogStore.setLoading(false);
          snackbarStore.show({
            message: lang.removed,
            duration: 1000,
          });
          await sleep(1200);
          confirmDialogStore.hide();
          await sleep(500);
          state.producers = producers;
        }
      } catch (err) {
        console.error(err);
      }
    }, 1000) as any;
  };

  React.useEffect(() => {
    fetchApprovedProducers();
    const timer = setInterval(fetchApprovedProducers, 10 * 1000);
    return () => {
      clearInterval(timer);
    };
  }, []);

  const fetchApprovedProducers = React.useCallback(async () => {
    try {
      const producers = await ProducerApi.fetchApprovedProducers(activeGroupStore.id) || [];
      await Promise.all(producers.map(async (producer) => {
        const user = await PersonModel.getUser(database, {
          GroupId: activeGroupStore.id,
          Publisher: producer.ProducerPubkey,
        });
        state.userMap[producer.ProducerPubkey] = user;
      }));
      state.producers = producers;
    } catch (err) {
      console.error(err);
    }
    state.loading = false;
  }, []);

  React.useEffect(() => () => {
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }
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
            {lang.producer}
          </div>
          <div className="mt-5 h-64 overflow-y-auto">
            {!state.loading && state.producers.slice().sort((p1, p2) => p2.BlockProduced - p1.BlockProduced).map((producer) => {
              const user = state.userMap[producer.ProducerPubkey];
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
                        url={user.profile.avatar}
                        size={24}
                      />
                      <div className="max-w-[110px] pl-1">
                        <div className="text-gray-88 font-bold text-13 truncate">
                          {user.profile.name}
                        </div>
                      </div>
                    </div>
                    <div
                      className="text-gray-88 ml-1 text-13"
                      dangerouslySetInnerHTML={{
                        __html: lang.producerNBlocks(producer.BlockProduced),
                      }}
                    />
                    {isGroupOwner && producer.ProducerPubkey !== activeGroup.owner_pubkey && (
                      <Button className="ml-2 invisible group-hover:visible transform scale-90" size="tiny" color="red" outline onClick={() => tryRemoveProducer(producer.ProducerPubkey)}>移除</Button>
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
            {!state.loading && (
              <div className="flex justify-center absolute right-5 top-[34px]">
                <div className="relative">
                  <Badge
                    className="absolute top-[7px] right-[7px] transform scale-90"
                    classes={{
                      badge: 'bg-red-500',
                    }}
                    invisible={!(isGroupOwner && groupStore.hasAnnouncedProducersMap[activeGroupStore.id])}
                    variant="dot"
                  />
                  <Button
                    size="mini"
                    outline
                    onClick={() => {
                      state.showAnnouncedProducersModal = true;
                    }}
                  >
                    {lang.announcements}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <AnnouncedProducersModal
          open={state.showAnnouncedProducersModal}
          onClose={async () => {
            state.showAnnouncedProducersModal = false;
            await sleep(300);
            fetchApprovedProducers();
          }}
        />
      </div>
    </Dialog>
  );
});
