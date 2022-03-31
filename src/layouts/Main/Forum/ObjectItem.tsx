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
import TrxInfo from 'components/TrxInfo';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import Avatar from 'components/Avatar';
import ContentSyncStatus from 'components/ContentSyncStatus';
import BFSReplace from 'utils/BFSReplace';
import escapeStringRegexp from 'escape-string-regexp';
import UserCard from 'components/UserCard';
import ago from 'utils/ago';
import useMixinPayment from 'standaloneModals/useMixinPayment';
import { assetsBasePath } from 'utils/env';
import { lang } from 'utils/lang';
import { defaultRenderer } from 'utils/markdown';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';
import { RiThumbUpLine, RiThumbUpFill, RiThumbDownLine, RiThumbDownFill } from 'react-icons/ri';
import { LikeType } from 'apis/content';
import useSubmitLike from 'hooks/useSubmitLike';

interface IProps {
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
  disabledUserCardTooltip?: boolean
  withBorder?: boolean
  beforeGoToUserPage?: () => unknown | Promise<unknown>
}

export default observer((props: IProps) => {
  const { object } = props;
  const { activeGroupStore, authStore, snackbarStore, modalStore } = useStore();
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
  const submitLike = useSubmitLike();
  const likeCount = object.Summary.likeCount;
  const dislikeCount = object.Summary.dislikeCount;
  const liked = likeCount > 0 && (object.Extra.likedCount || 0) > 0;
  const disliked = dislikeCount > 0 && (object.Extra.dislikedCount || 0) > 0;

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
      'pb-6 mb-3': !props.inObjectDetailModal,
    }, 'rounded-0 bg-white px-8 pt-6 w-full lg:w-[700px] box-border relative')}
    >
      <div className="relative group">
        <UserCard
          disableHover={props.disabledUserCardTooltip}
          object={object}
          beforeGoToUserPage={props.beforeGoToUserPage}
        >
          <Avatar
            className="absolute top-[-6px] left-[-2px]"
            url={profile.avatar}
            size={44}
          />
        </UserCard>
        <div className="absolute top-[55px] left-[-6px] w-[52px] flex flex-col items-center justify-center opacity-60">
          <div
            className={classNames(
              {
                'text-gray-33': liked,
                'cursor-pointer': !liked,
              },
              'flex items-center tracking-wide text-gray-33 leading-none',
            )}
            onClick={() => {
              if (liked) {
                return;
              }
              submitLike({
                type: LikeType.Like,
                objectTrxId: object.TrxId,
              });
            }}
          >
            <div className="text-16 opacity-70">
              {liked ? (
                <RiThumbUpFill className="text-black opacity-60" />
              ) : (
                <RiThumbUpLine />
              )}
            </div>
            {likeCount ? (
              <span className="ml-[6px]">{likeCount || ''}</span>
            )
              : <span className="ml-1 opacity-90">{lang.thumbUp}</span>}
          </div>
          <div
            className={classNames(
              {
                'text-gray-33': disliked,
                'cursor-pointer': !disliked,
              },
              'flex items-center tracking-wide text-gray-33 leading-none mt-[13px]',
            )}
            onClick={() => {
              if (disliked) {
                return;
              }
              submitLike({
                type: LikeType.Dislike,
                objectTrxId: object.TrxId,
              });
            }}
          >
            <div className="text-16 opacity-70">
              {disliked ? (
                <RiThumbDownFill className="text-black opacity-60" />
              ) : (
                <RiThumbDownLine />
              )}
            </div>
            {dislikeCount ? (
              <span className="ml-[6px]">{dislikeCount || ''}</span>
            )
              : <span className="ml-1 opacity-90">{lang.thumbDown}</span>}
          </div>
        </div>
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
        <div className="pl-[60px] ml-1">
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
                  SyncedComponent={() => <TrxInfo trxId={object.TrxId} />}
                  alwaysShow
                />
              </div>
            </div>
            {
              !!object.Summary.commentCount && (
                <div
                  className="flex-grow flex items-center justify-end cursor-pointer"
                  onClick={() => {
                    modalStore.forumObjectDetail.show({
                      objectTrxId: object.TrxId,
                      scrollToComments: true,
                    });
                  }}
                >
                  <img className="text-gray-6f mr-2" src={`${assetsBasePath}/reply.svg`} alt="" />
                  <span className="text-gray-6f text-16 mt-[-1px]">{object.Summary.commentCount}</span>
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
              modalStore.forumObjectDetail.show({
                objectTrxId: object.TrxId,
              });
            }}
          >
            <div
              className={classNames({
                'text-18 mt-3': props.inObjectDetailModal,
                'text-16': !props.inObjectDetailModal,
              }, 'font-bold text-gray-700 leading-5 tracking-wide')}
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
                className={classNames({
                  'max-h-[100px] preview': !props.inObjectDetailModal,
                }, 'mt-[8px] text-gray-70 rendered-markdown min-h-[44px]')}
                dangerouslySetInnerHTML={{
                  __html: hasPermission
                    ? content
                    : `<div class="text-red-400">${lang.beBannedTip3}</div>`,
                }}
              />
              {!props.inObjectDetailModal && (
                <div className="absolute top-0 left-0 w-full h-[110px] bg-gradient-to-t via-transparent from-white z-10" />
              )}
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
        .rendered-markdown.preview :global(img) {
          max-width: 150px;
        }
      `}</style>
    </div>
  );
});
