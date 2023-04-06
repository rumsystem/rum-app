import React from 'react';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';
import escapeStringRegexp from 'escape-string-regexp';
import { RiThumbUpLine, RiThumbUpFill, RiThumbDownLine, RiThumbDownFill } from 'react-icons/ri';
import { HiOutlineShare } from 'react-icons/hi';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { Button } from '@mui/material';

import Avatar from 'components/Avatar';
import ContentSyncStatus from 'components/ContentSyncStatus';
import UserCard from 'components/UserCard';

import { useStore } from 'store';

import { IDBPost } from 'hooks/useDatabase/models/posts';
import useSubmitCounter from 'hooks/useSubmitCounter';
import useParseMarkdown from 'hooks/useParseMarkdown';
import useDeleteObject from 'hooks/useDeletePost';

import BFSReplace from 'utils/BFSReplace';
import ago from 'utils/ago';
import { lang } from 'utils/lang';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';

import IconReply from 'assets/reply.svg';
import IconBuyADrink from 'assets/buyadrink.svg';
import openTransferModal from 'standaloneModals/wallet/openTransferModal';
import { shareGroup } from 'standaloneModals/shareGroup';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';

import ObjectMenu from '../ObjectMenu';
import OpenObjectEditor from './OpenObjectEditor';


interface IProps {
  post: IDBPost
  inObjectDetailModal?: boolean
  disabledUserCardTooltip?: boolean
  withBorder?: boolean
  beforeGoToUserPage?: () => Promise<unknown>
  smallMDTitleFontsize?: boolean
}

export default observer((props: IProps) => {
  const { post } = props;
  const state = useLocalObservable(() => ({
    content: '',
  }));
  const { activeGroupStore, modalStore, fontStore } = useStore();
  const activeGroup = useActiveGroup();
  const objectNameRef = React.useRef<HTMLDivElement>(null);
  const objectRef = React.useRef<HTMLDivElement>(null);
  const { searchText, profileMap } = activeGroupStore;
  const profile = profileMap[post.publisher] || post.extra.user;
  const submitCounter = useSubmitCounter();
  const likeCount = post.summary.likeCount;
  const dislikeCount = post.summary.dislikeCount;
  const liked = likeCount > 0 && (post.extra.likeCount || 0) > 0;
  const disliked = dislikeCount > 0 && (post.extra.dislikeCount || 0) > 0;

  const parseMarkdown = useParseMarkdown();
  const deleteObject = useDeleteObject();

  const handlePostContentClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target;
    if (target instanceof HTMLImageElement) {
      openPhotoSwipe({
        image: target.src,
      });
    }
  };

  React.useEffect(() => {
    parseMarkdown(post.content).then(action((content) => {
      state.content = content;
    }));
  }, [post.content]);

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
            span.className = 'text-amber-500 font-bold';
            return span;
          },
        );
      });
    }
  }, [searchText, state.content]);

  return (
    <div
      className={classNames(
        {
          'border border-gray-f2': props.withBorder,
          'pb-6 mb-3': !props.inObjectDetailModal,
        },
        'forum-object-item rounded-0 bg-white px-8 pt-6 w-full lg:w-[700px] box-border relative',
      )}
      data-test-id="forum-object-item"
    >
      <div className="relative group">
        <UserCard
          disableHover={props.disabledUserCardTooltip}
          object={post}
          beforeGoToUserPage={props.beforeGoToUserPage}
        >
          <Avatar
            className="absolute top-[-6px] left-[-2px]"
            avatar={profile.avatar}
            size={44}
          />
        </UserCard>
        <div className="absolute top-[45px] left-[-6px] w-[52px] flex flex-col items-center justify-center opacity-60">
          <Button
            className={classNames(
              'flex items-center tracking-wide text-gray-33 leading-none min-w-0',
              liked && 'text-gray-33',
              !liked && 'cursor-pointer',
            )}
            onClick={() => submitCounter({
              type: liked ? 'undolike' : 'like',
              objectId: post.id,
            })}
            size="small"
          >
            <div className="text-16 opacity-70">
              {liked && <RiThumbUpFill className="text-black opacity-60" />}
              {!liked && <RiThumbUpLine />}
            </div>
            {!!likeCount && <span className="ml-[6px]">{likeCount || ''}</span>}
            {!likeCount && <span className="ml-1 opacity-90">{lang.thumbUp}</span>}
          </Button>
          <Button
            className={classNames(
              'flex items-center tracking-wide text-gray-33 leading-none min-w-0',
              disliked && 'text-gray-33',
              !disliked && 'cursor-pointer',
            )}
            onClick={() => submitCounter({
              type: disliked ? 'undodislike' : 'dislike',
              objectId: post.id,
            })}
            size="small"
          >
            <div className="text-16 opacity-70">
              {disliked && <RiThumbDownFill className="text-black opacity-60" />}
              {!disliked && <RiThumbDownLine />}
            </div>
            {!!dislikeCount && <span className="ml-[6px]">{dislikeCount || ''}</span>}
            {!dislikeCount && <span className="ml-1 opacity-90">{lang.thumbDown}</span>}
          </Button>
          <Button
            className="flex items-center tracking-wide text-gray-33 leading-none cursor-pointer min-w-0"
            onClick={() => shareGroup(activeGroup.group_id, post.id)}
            size="small"
          >
            <div className="text-16 opacity-70">
              <HiOutlineShare />
            </div>
            <span className="ml-1 opacity-90">{lang.share2}</span>
          </Button>
        </div>
        <div className="pl-[60px] ml-1">
          <div className="flex items-center justify-between leading-none">
            <div className="flex items-center">
              <UserCard
                disableHover={props.disabledUserCardTooltip}
                object={post}
                beforeGoToUserPage={props.beforeGoToUserPage}
              >
                <div className="text-gray-99 font-bold">
                  {profile.name}
                </div>
              </UserCard>
              <div
                className="text-gray-88 text-12 tracking-wide cursor-pointer ml-7 opacity-80"
              >
                {ago(post.timestamp, { trimmed: true })}
              </div>
              <div className="ml-7">
                <ContentSyncStatus
                  trxId={post.trxId}
                  status={post.status}
                  SyncedComponent={() => (
                    <ObjectMenu
                      object={post}
                      onClickUpdateMenu={() => {
                        OpenObjectEditor(post);
                      }}
                      onClickDeleteMenu={() => {
                        deleteObject(post.id);
                      }}
                    />
                  )}
                  alwaysShow
                />
              </div>
            </div>
            {!!post.summary.commentCount && (
              <div
                className="grow flex items-center justify-end cursor-pointer"
                onClick={() => {
                  modalStore.forumObjectDetail.show({
                    objectId: post.id,
                    scrollToComments: true,
                  });
                }}
              >
                <span className="text-gray-88 mt-[-1px] text-14 mr-1">{post.summary.commentCount}</span>
                <img className="text-gray-6f mr-2 w-3" src={IconReply} alt="" />
              </div>
            )}
            <div
              className="flex items-center cursor-pointer hover:opacity-80 ml-8"
              onClick={() => {
                openTransferModal({
                  name: post.extra.user.name || '',
                  avatar: post.extra.user.avatar || '',
                  pubkey: post.extra.user.publisher || '',
                  uuid: post.id,
                });
              }}
            >
              <img className="w-[9px] mr-2 mt-[-1px]" src={IconBuyADrink} alt="buyadrink" />
              <span className="text-blue-400 text-12">{lang.tipWithRum}</span>
            </div>
          </div>
          <div
            className="mt-2 cursor-pointer"
            onClick={() => {
              modalStore.forumObjectDetail.show({
                objectId: post.id,
              });
            }}
          >
            <div
              className={classNames(
                'font-bold text-gray-700 leading-5 tracking-wide',
                !!props.inObjectDetailModal && 'mt-3',
              )}
              style={{
                fontSize: props.inObjectDetailModal
                  ? `${+fontStore.fontSize + 4}px`
                  : `${+fontStore.fontSize + 2}px`,
              }}
              ref={objectNameRef}
            >
              {post.name}
            </div>
            <div className="overflow-hidden relative cursor-pointer">
              <div
                ref={objectRef}
                key={state.content + searchText}
                style={{ fontSize: `${fontStore.fontSize}px` }}
                className={classNames(
                  !props.inObjectDetailModal && 'max-h-[100px] preview',
                  !!props.smallMDTitleFontsize && 'markdown-small-title',
                  'mt-[8px] text-gray-70 rendered-markdown min-h-[44px]',
                )}
                onClick={handlePostContentClick}
                dangerouslySetInnerHTML={{
                  __html: state.content,
                }}
              />
              {!props.inObjectDetailModal && (
                <div className="absolute top-0 left-0 w-full h-[110px] bg-gradient-to-t via-transparent from-white z-10" />
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .forum-object-item .markdown-small-title h1 {
          font-size: 1em;
        }
        .forum-object-item .markdown-small-title h2 {
          font-size: 1em;
        }
        .forum-object-item .markdown-small-title h3 {
          font-size: 1em;
        }
        .forum-object-item .rendered-markdown.preview img {
          max-width: 150px;
        }
      `}</style>
    </div>
  );
});
