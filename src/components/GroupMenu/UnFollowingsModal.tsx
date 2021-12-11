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
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import { lang } from 'utils/lang';

interface IProps {
  open: boolean
  onClose: () => void
}

const UnFollowings = observer((props: IProps) => {
  const { activeGroupStore, confirmDialogStore, snackbarStore } = useStore();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();
  const state = useLocalObservable(() => ({
    unFollowingUsers: [] as IUser[],
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
    props.onClose();
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
            props.onClose();
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

  return (
    <div className="bg-white rounded-0 p-8">
      <div className="w-70 h-90">
        <div className="text-18 font-bold text-gray-700 text-center">
          {lang.unFollowingList}
        </div>
        <div className="mt-3">
          {state.unFollowingUsers.map((user) => (
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

              <div className="w-16 flex justify-end">
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
    <UnFollowings {...props} />
  </Dialog>
));
