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
import AuthApi, { AuthType } from 'apis/auth';
import { IoMdAdd } from 'react-icons/io';
import InputPublisherModal from './InputPublisherModal';

interface IProps {
  groupId: string
  open: boolean
  onClose: () => void
}

const AuthList = observer((props: IProps) => {
  const { groupStore, confirmDialogStore, snackbarStore, activeGroupStore } = useStore();
  const { groupId } = props;
  const group = groupStore.map[groupId];
  const database = useDatabase();
  const state = useLocalObservable(() => ({
    fetched: false,
    users: [] as IUser[],
    showInputPublisherModal: false,
    authType: 'FOLLOW_DNY_LIST' as AuthType,
    get publisherSet() {
      return new Set(this.users.map((user) => user.publisher));
    },
  }));

  React.useEffect(() => {
    (async () => {
      const followingRule = await AuthApi.getFollowingRule(groupId, 'POST');
      state.authType = followingRule.AuthType;
      const list = await (state.authType === 'FOLLOW_DNY_LIST' ? AuthApi.getDenyList(groupId) : AuthApi.getAllowList(groupId)) || [];
      state.users = await Promise.all(
        list.map(async (item) =>
          PersonModel.getUser(database, {
            GroupId: groupId,
            Publisher: item.Pubkey,
          })),
      );
      state.fetched = true;
    })();
  }, []);

  const goToUserPage = async (publisher: string) => {
    props.onClose();
    await sleep(300);
    activeGroupStore.setObjectsFilter({
      type: ObjectsFilterType.SOMEONE,
      publisher,
    });
  };

  const add = async (publisher: string) => {
    await AuthApi.updateAuthList({
      group_id: groupId,
      type: state.authType === 'FOLLOW_DNY_LIST' ? 'upd_dny_list' : 'upd_alw_list',
      config: {
        action: 'add',
        pubkey: publisher,
        trx_type: ['POST'],
        memo: '',
      },
    });
    const user = await PersonModel.getUser(database, {
      GroupId: groupId,
      Publisher: publisher,
    });
    await sleep(2000);
    state.users.push(user);
    await sleep(200);
    snackbarStore.show({
      message: lang.added,
      duration: 1000,
    });
  };

  const remove = (publisher: string) => {
    confirmDialogStore.show({
      content: lang.confirmToRemove,
      okText: lang.yes,
      ok: async () => {
        confirmDialogStore.setLoading(true);
        await AuthApi.updateAuthList({
          group_id: groupId,
          type: state.authType === 'FOLLOW_DNY_LIST' ? 'upd_dny_list' : 'upd_alw_list',
          config: {
            action: 'remove',
            pubkey: publisher,
            trx_type: ['POST'],
            memo: '',
          },
        });
        await sleep(2000);
        state.users = state.users.filter((user) => user.publisher !== publisher);
        confirmDialogStore.hide();
        await sleep(200);
        snackbarStore.show({
          message: lang.removed,
          duration: 1000,
        });
      },
    });
  };

  return (
    <div className="bg-white rounded-0 p-8">
      <div className="w-74 h-90">
        <div className="text-18 font-bold text-gray-700 text-center relative">
          {state.authType === 'FOLLOW_DNY_LIST' ? lang.manageDefaultWriteMember : lang.manageDefaultReadMember}{groupStore.subToTopMap[props.groupId] ? '（评论）' : '（发布）'}
          <div className="flex justify-center absolute right-[-4px] top-[5px]">
            <div
              className="relative text-blue-400 text-13 flex items-center cursor-pointer"
              onClick={() => {
                state.showInputPublisherModal = true;
              }}
            >
              <IoMdAdd className="text-16 mr-[2px]" />{lang.add}
            </div>
          </div>
        </div>
        <div className="mt-3">
          {state.users.map((user) => (
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
                <div className="pt-1 max-w-[90px]">
                  <div className='text-gray-88 font-bold text-14 truncate'>
                    {user.profile.name}
                  </div>
                </div>
              </div>
              {group.owner_pubkey === user.publisher && (
                <div className="w-18 flex justify-end">
                  <Button
                    size="mini"
                    disabled
                  >
                    {lang.owner}
                  </Button>
                </div>
              )}
              {group.owner_pubkey !== user.publisher && (
                <div className="w-18 flex justify-end">
                  <Button
                    size="mini"
                    outline
                    onClick={() => {
                      remove(user.publisher);
                    }}
                  >
                    {lang.remove}
                  </Button>
                </div>
              )}
            </div>
          ))}
          {state.users.length === 0 && (
            <div className="py-28 text-center text-14 text-gray-400 opacity-80">
              {lang.empty(lang.members)}
            </div>
          )}
        </div>
      </div>
      <InputPublisherModal
        title={state.authType === 'FOLLOW_DNY_LIST' ? lang.addDefaultWriteMember : lang.addDefaultReadMember}
        open={state.showInputPublisherModal}
        submit={async (publisher) => {
          if (publisher) {
            if (state.publisherSet.has(publisher)) {
              snackbarStore.show({
                message: lang.duplicateMember,
                type: 'error',
              });
              return;
            }
            await add(publisher);
          }
          state.showInputPublisherModal = false;
        }}
      />
    </div>
  );
});

export default observer((props: IProps) => (
  <Dialog
    open={props.open}
    onClose={() => props.onClose()}
    hideCloseButton
    transitionDuration={{
      enter: 300,
    }}
  >
    <AuthList {...props} />
  </Dialog>
));
