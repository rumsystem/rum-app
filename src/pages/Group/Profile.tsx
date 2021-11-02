import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import { useStore } from 'store';
import getProfile, { AVATAR_PLACEHOLDER } from 'store/selectors/getProfile';
import ProfileEditorModal from './ProfileEditorModal';
import Database from 'store/database';
import classNames from 'classnames';
import { ContentTypeUrl } from 'apis/group';
import { IDbSummary } from 'store/database';

interface IProps {
  userId: string;
}

export default observer((props: IProps) => {
  const { activeGroupStore, nodeStore } = useStore();
  const isMe = nodeStore.info.node_publickey === props.userId;
  const state = useLocalObservable(() => ({
    showProfileEditorModal: false,
    loading: false,
    profile: {
      name: '',
      avatar: AVATAR_PLACEHOLDER,
    },
    summary: null as IDbSummary | null,
  }));

  React.useEffect(() => {
    (async () => {
      state.loading = true;
      const db = new Database();
      const [person, summary] = await Promise.all([
        db.persons
          .where({
            GroupId: activeGroupStore.id,
            Publisher: props.userId,
          })
          .last(),
        db.summary.get({
          GroupId: activeGroupStore.id,
          Publisher: props.userId,
          TypeUrl: ContentTypeUrl.Object,
        }),
      ]);
      state.profile = getProfile(props.userId, person);
      state.summary = summary || null;
      state.loading = false;
    })();
  }, [state, props.userId, nodeStore, activeGroupStore.person]);

  return (
    <div
      className={classNames(
        {
          invisible: state.loading,
        },
        'relative profile py-5 rounded-12 bg-white border border-gray-88'
      )}
    >
      <div className="flex justify-between items-center px-10 text-black">
        <div className="flex items-end">
          <img
            className="rounded-full bg-white border-shadow ml-1"
            src={state.profile.avatar}
            alt="cover"
            width="66"
            height="66"
          />
          <div className="ml-5">
            <div className="font-bold text-18 leading-none text-gray-4a">
              {state.profile.name}
            </div>
            <div className="mt-10-px text-14 flex items-center text-gray-9b pb-1">
              <span>
                <span className="text-14 font-bold">
                  {state.summary ? state.summary.Count : 0}
                </span>{' '}
                条内容
              </span>
              {/* <span className="opacity-70 mx-2">·</span>
              <span>
                <span className="text-14 font-bold">2</span> 人关注
              </span> */}
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
          {!isMe && (
            <div>
              {activeGroupStore.followingSet.has(props.userId) ? (
                <Button
                  size="small"
                  outline
                  onClick={async () => {
                    await activeGroupStore.deleteFollowing({
                      groupId: activeGroupStore.id,
                      publisher: nodeStore.info.node_publickey,
                      following: props.userId,
                    });
                  }}
                >
                  正在关注
                </Button>
              ) : (
                <Button
                  size="small"
                  onClick={async () => {
                    await activeGroupStore.addFollowing({
                      groupId: activeGroupStore.id,
                      publisher: nodeStore.info.node_publickey,
                      following: props.userId,
                    });
                  }}
                >
                  关注
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <style jsx>{`
        .border-shadow {
          border: 2px solid hsl(212, 12%, 90%);
        }
      `}</style>
    </div>
  );
});
