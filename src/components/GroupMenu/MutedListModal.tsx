import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { useStore } from 'store';
import * as PersonModel from 'hooks/useDatabase/models/person';
import { IUser } from 'hooks/useDatabase/models/person';
import useDatabase from 'hooks/useDatabase';
import Button from 'components/Button';
import Avatar from 'components/Avatar';
import { ObjectsFilterType } from 'store/activeGroup';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import useActiveGroupMutedPublishers from 'store/selectors/useActiveGroupMutedPublishers';

interface IProps {
  open: boolean
  onClose: () => void
}

const MutedList = observer((props: IProps) => {
  const { activeGroupStore, confirmDialogStore, snackbarStore, mutedListStore } = useStore();
  const database = useDatabase();
  const activeGroupMutedPublishers = useActiveGroupMutedPublishers();
  const state = useLocalObservable(() => ({
    blockedUsers: [] as IUser[],
  }));

  React.useEffect(() => {
    (async () => {
      state.blockedUsers = await Promise.all(
        activeGroupMutedPublishers.map(async (publisher) =>
          PersonModel.getUser(database, {
            GroupId: activeGroupStore.id,
            Publisher: publisher,
          })),
      );
    })();
  }, [activeGroupMutedPublishers.length]);

  const goToUserPage = async (publisher: string) => {
    props.onClose();
    await sleep(300);
    activeGroupStore.setObjectsFilter({
      type: ObjectsFilterType.SOMEONE,
      publisher,
    });
  };

  const unmute = (publisher: string) => {
    confirmDialogStore.show({
      content: lang.confirmToFollow,
      okText: lang.yes,
      ok: async () => {
        const { length } = activeGroupMutedPublishers;
        mutedListStore.unmute({
          groupId: activeGroupStore.id,
          publisher,
        });
        confirmDialogStore.hide();
        await sleep(200);
        if (length === 1) {
          props.onClose();
          await sleep(200);
        }
        snackbarStore.show({
          message: lang.settingDone,
          duration: 1000,
        });
      },
    });
  };

  return (
    <div className="bg-white rounded-0 p-8">
      <div className="w-74 h-90">
        <div className="text-18 font-bold text-gray-700 text-center">
          {lang.mutedList}
        </div>
        <div className="mt-3">
          {state.blockedUsers.map((user) => (
            <div
              className="py-3 px-4 flex items-center justify-between border-b border-gray-ec"
              key={user.publisher}
            >
              <div
                className="relative pl-[46px] cursor-pointer py-1"
                onClick={() => {
                  goToUserPage(user.publisher);
                }}
              >
                <Avatar
                  className="absolute top-0 left-0 cursor-pointer"
                  url={user.profile.avatar}
                  size={36}
                />
                <div className="pt-1 w-[90px]">
                  <div className="text-gray-88 font-bold text-14 truncate">
                    {user.profile.name}
                  </div>
                </div>
              </div>

              <div className="w-18 flex justify-end">
                <Button
                  size="mini"
                  outline
                  onClick={() => unmute(user.publisher)}
                >
                  {lang.cancelBlock}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose()}
    transitionDuration={{
      enter: 300,
    }}
  >
    <MutedList {...props} />
  </Dialog>
));
