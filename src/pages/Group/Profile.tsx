import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import { useStore } from 'store';
import ProfileEditorModal from './ProfileEditorModal';
import useDatabase, { IDbSummary } from 'hooks/useDatabase';
import classNames from 'classnames';
import Avatar from 'components/Avatar';
import * as PersonModel from 'hooks/useDatabase/models/person';
import getProfile from 'store/selectors/getProfile';

interface IProps {
  publisher: string;
}

export default observer((props: IProps) => {
  const { activeGroupStore, nodeStore } = useStore();
  const database = useDatabase();
  const isMe = nodeStore.info.node_publickey === props.publisher;
  const state = useLocalObservable(() => ({
    showProfileEditorModal: false,
    loading: false,
    user: {
      profile: getProfile(nodeStore.info.node_publickey),
      objectCount: 0,
    } as PersonModel.IUser,
    summary: null as IDbSummary | null,
  }));

  React.useEffect(() => {
    (async () => {
      state.loading = true;
      const db = database;
      const user = await PersonModel.getUser(db, {
        GroupId: activeGroupStore.id,
        Publisher: props.publisher,
        withObjectCount: true,
      });
      state.user = user;
      state.loading = false;
    })();
  }, [state, props.publisher, nodeStore, activeGroupStore.profile]);

  return (
    <div
      className={
        'relative profile py-5 rounded-12 bg-white border border-gray-88 mb-3'
      }
    >
      <div className="flex justify-between items-center px-10 text-black">
        <div className="flex items-end">
          <Avatar
            className={classNames(
              {
                invisible: state.loading,
              },
              'bg-white ml-1'
            )}
            profile={state.user.profile}
            size={66}
          />
          <div className="ml-5">
            <div
              className={classNames(
                {
                  invisible: state.loading,
                },
                'font-bold text-18 leading-none text-gray-4a'
              )}
            >
              {state.user.profile.name}
            </div>
            <div className="mt-10-px text-14 flex items-center text-gray-9b pb-1">
              <span>
                <span className="text-14 font-bold">
                  {state.user.objectCount}
                </span>{' '}
                条内容
              </span>
            </div>
          </div>
        </div>
        <div className="mr-2">
          {isMe && (
            <div>
              <Button
                outline
                className="opacity-60"
                onClick={() => {
                  state.showProfileEditorModal = true;
                }}
              >
                编辑资料
              </Button>
              <ProfileEditorModal
                open={state.showProfileEditorModal}
                onClose={() => {
                  state.showProfileEditorModal = false;
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
