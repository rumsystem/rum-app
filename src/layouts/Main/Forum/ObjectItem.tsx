import React from 'react';
import { observer } from 'mobx-react-lite';
import classNames from 'classnames';
import DOMPurify from 'dompurify';
import { HiOutlineBan } from 'react-icons/hi';
import Tooltip from '@material-ui/core/Tooltip';
import { useStore } from 'store';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useHasPermission from 'store/selectors/useHasPermission';
import ObjectMenu from '../ObjectMenu';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import Avatar from 'components/Avatar';
import ContentSyncStatus from 'components/ContentSyncStatus';
import BFSReplace from 'utils/BFSReplace';
import escapeStringRegexp from 'escape-string-regexp';
import UserCard from 'components/UserCard';
import ago from 'utils/ago';
import useMixinPayment from 'standaloneModals/useMixinPayment';
import OpenObjectDetail from './OpenObjectDetail';
import { assetsBasePath } from 'utils/env';
import { lang } from 'utils/lang';
import { defaultRenderer } from 'utils/markdown';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';

interface IProps {
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
  disabledUserCardTooltip?: boolean
  withBorder?: boolean
  beforeGoToUserPage?: () => unknown | Promise<unknown>
}

export default observer((props: IProps) => {
  const { object } = props;
  const { activeGroupStore, authStore, snackbarStore } = useStore();
  const activeGroup = useActiveGroup();
  const isGroupOwner = useIsGroupOwner(activeGroup);
  const isOwner = activeGroup.user_pubkey === object.Publisher;
  const hasPermission = useHasPermission(object.Publisher);
  const objectNameRef = React.useRef<HTMLDivElement>(null);
  const objectRef = React.useRef<HTMLDivElement>(null);
  const content = React.useMemo(() => {
    try {
      return DOMPurify.sanitize(defaultRenderer.render(object.Content.content));
    } catch (err) {
      return '';
    }
  }, [object.Content.content]);
  const { searchText, profileMap } = activeGroupStore;
  const profile = profileMap[object.Publisher] || object.Extra.user.profile;

  // replace link and search text
  React.useEffect(() => {
    const box = objectRef.current;
    if (!box) {
      return;
    }

    BFSReplace(
      box,
      /(https?:\/\/[^\s]+)/g,
      (text: string) => {
        const link = document.createElement('a');
        link.href = text;
        link.className = 'text-blue-400';
        link.textContent = text;
        return link;
      },
    );

    replaceSeedAsButton(box);

    if (searchText) {
      [objectNameRef.current!, box].forEach((v) => {
        BFSReplace(
          v,
          new RegExp(escapeStringRegexp(searchText), 'ig'),
          (text: string) => {
            const span = document.createElement('span');
            span.textContent = text;
            span.className = 'text-yellow-500 font-bold';
            return span;
          },
        );
      });
    }
  }, [searchText, content]);

  return (
    <div className={classNames({
      'border border-gray-f2': props.withBorder,
    }, 'rounded-0 bg-white px-8 pt-6 pb-6 w-full lg:w-[650px] box-border relative mb-3')}
    >
      <div className="relative group">
        <UserCard
          disableHover={props.disabledUserCardTooltip}
          object={object}
          beforeGoToUserPage={props.beforeGoToUserPage}
        >
          <Avatar
            className="absolute top-[-6px] left-[-4px]"
            url={profile.avatar}
            size={44}
          />
        </UserCard>
        {isGroupOwner
          && authStore.deniedListMap[
            `groupId:${activeGroup.group_id}|userId:${object.Publisher}`
          ] && (
          <Tooltip
            enterDelay={300}
            enterNextDelay={300}
            placement="top"
            title={lang.beBannedTip4}
            interactive
            arrow
          >
            <div className="text-18 text-white bg-red-400 rounded-full absolute top-0 left-0 -ml-2 z-10">
              <HiOutlineBan />
            </div>
          </Tooltip>
        )}
        <div className="pl-12 ml-1">
          <div className="flex items-center justify-between leading-none">
            <div className="flex items-center">
              <UserCard
                disableHover={props.disabledUserCardTooltip}
                object={object}
                beforeGoToUserPage={props.beforeGoToUserPage}
              >
                <div className="text-gray-99 font-bold">
                  {profile.name}
                </div>
              </UserCard>
              <div
                className="text-gray-88 text-12 tracking-wide cursor-pointer ml-7 opacity-80"
              >
                {ago(object.TimeStamp, { trimmed: true })}
              </div>
              <div className="ml-7">
                <ContentSyncStatus
                  status={object.Status}
                  SyncedComponent={() => <ObjectMenu object={object} />}
                  alwaysShow
                />
              </div>
            </div>
            {
              !!object.commentCount && (
                <div
                  className="flex-grow flex items-center justify-end cursor-pointer"
                  onClick={() => {
                    OpenObjectDetail({
                      objectTrxId: object.TrxId,
                      scrollToComments: true,
                    });
                  }}
                >
                  <img className="text-gray-6f mr-2" src={`${assetsBasePath}/reply.svg`} alt="" />
                  <span className="text-gray-6f text-16 mt-[-1px]">{object.commentCount}</span>
                </div>
              )
            }
            {
              object.Extra?.user?.profile?.mixinUID && (
                <div
                  className="flex items-center cursor-pointer hover:opacity-80 ml-8"
                  onClick={() => {
                    if (isOwner) {
                      snackbarStore.show({
                        message: lang.canNotTipYourself,
                        type: 'error',
                      });
                      return;
                    }
                    useMixinPayment({
                      name: object.Extra.user.profile.name || '',
                      mixinUID: object.Extra.user.profile.mixinUID || '',
                    });
                  }}
                >
                  <img className="w-[9px] mr-2 mt-[-1px]" src={`${assetsBasePath}/buyadrink.svg`} alt="buyadrink" />
                  <span className="text-blue-400 text-12">{lang.tipWithRum}</span>
                </div>
              )
            }
          </div>
          <div
            className="mt-3 cursor-pointer"
            onClick={() => {
              OpenObjectDetail({
                objectTrxId: object.TrxId,
              });
            }}
          >
            <div
              className="font-bold text-gray-700 text-16 leading-5 tracking-wide"
              ref={objectNameRef}
            >
              {object.Content.name}
            </div>
            <div
              className="overflow-hidden relative cursor-pointer"
            >
              <div
                ref={objectRef}
                key={content + searchText}
                className='mt-[8px] text-gray-70 rendered-markdown max-h-[300px]'
                dangerouslySetInnerHTML={{
                  __html: hasPermission
                    ? content
                    : `<div class="text-red-400">${lang.beBannedTip3}</div>`,
                }}
              />
              <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-t via-transparent from-white z-10" />
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .rendered-markdown :global(h1) {
          font-size: 1em;
        }
        .rendered-markdown :global(h2) {
          font-size: 1em;
        }
        .rendered-markdown :global(h3) {
          font-size: 1em;
        }
      `}</style>
    </div>
  );
});
