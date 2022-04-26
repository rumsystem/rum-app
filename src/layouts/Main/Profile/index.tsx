import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import { useStore } from 'store';
import ProfileEditorModal from './ProfileEditorModal';
import useDatabase from 'hooks/useDatabase';
import { IDbSummary } from 'hooks/useDatabase/models/summary';
import classNames from 'classnames';
import Avatar from 'components/Avatar';
import * as PersonModel from 'hooks/useDatabase/models/person';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import getProfile from 'store/selectors/getProfile';
import { RiCheckLine } from 'react-icons/ri';
import Fade from '@material-ui/core/Fade';
import Tooltip from '@material-ui/core/Tooltip';
import { IUser } from 'hooks/useDatabase/models/person';
import useMixinPayment from 'standaloneModals/useMixinPayment';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { lang } from 'utils/lang';

interface IProps {
  publisher: string
}

export default observer((props: IProps) => {
  const { activeGroupStore } = useStore();
  const activeGroup = useActiveGroup();
  const database = useDatabase();
  const isMySelf = activeGroup.user_pubkey === props.publisher;
  const state = useLocalObservable(() => ({
    showProfileEditorModal: false,
    loading: false,
    user: {
      profile: getProfile(activeGroup.user_pubkey),
      objectCount: 0,
    } as IUser,
    summary: null as IDbSummary | null,
  }));
  const isSyncing = activeGroupStore.latestPersonStatus === ContentStatus.syncing;

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
  }, [state, props.publisher, activeGroup.user_pubkey, activeGroupStore.profile]);

  return (
    <div
      className="relative overflow-hidden profile py-5 rounded-0 bg-white border border-gray-88 mb-3"
    >
      <div className="flex justify-between items-center px-10 text-black">
        <div className="flex items-end">
          <Avatar
            className={classNames(
              {
                invisible: state.loading,
              },
              'bg-white ml-1',
            )}
            loading={isSyncing}
            profile={state.user.profile}
            size={66}
          />
          <div className="ml-5">
            <div
              className={classNames(
                {
                  invisible: state.loading,
                },
                'font-bold text-18 leading-none text-gray-4a',
              )}
            >
              {state.user.profile.name}
            </div>
            <div className="mt-10-px text-14 text-gray-9b pb-1 font-bold tracking-wide">
              {lang.contentCount(state.user.objectCount)}
            </div>
          </div>
        </div>
        <div className={classNames({
          'mt-4': isSyncing,
        }, 'mr-2')}
        >
          {isMySelf && (
            <div>
              <Button
                outline
                className="opacity-60"
                onClick={() => {
                  state.showProfileEditorModal = true;
                }}
              >
                {lang.editProfile}
              </Button>
              <ProfileEditorModal
                open={state.showProfileEditorModal}
                onClose={() => {
                  state.showProfileEditorModal = false;
                }}
              />
            </div>
          )}
          {!isMySelf && state.user?.profile?.mixinUID && (
            <div>
              <Button
                outline
                className="opacity-60"
                onClick={() => {
                  useMixinPayment({
                    name: state.user.profile.name || '',
                    mixinUID: state.user.profile.mixinUID || '',
                  });
                }}
              >
                {lang.tip}
              </Button>
            </div>
          )}
        </div>
        {isSyncing && (
          <Fade in={true} timeout={500}>
            <Tooltip
              enterDelay={400}
              enterNextDelay={400}
              placement="top"
              title={lang.syncingContentTip2}
              arrow
              interactive
            >
              <div className="px-2 py-1 bg-gray-88 rounded-bl-5 text-white text-12 absolute top-0 right-0 flex items-center">
                {lang.waitForSyncingDone} <RiCheckLine className="text-12 ml-1" />
              </div>
            </Tooltip>
          </Fade>
        )}
      </div>
    </div>
  );
});
