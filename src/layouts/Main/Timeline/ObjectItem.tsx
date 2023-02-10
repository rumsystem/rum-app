import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';
import { BsFillCaretDownFill, BsFillCaretUpFill } from 'react-icons/bs';
import { HiOutlineBan } from 'react-icons/hi';
import Tooltip from '@material-ui/core/Tooltip';
import { useStore } from 'store';
import useIsGroupOwner from 'store/selectors/useIsGroupOwner';
import useActiveGroup from 'store/selectors/useActiveGroup';
import useHasPermission from 'store/selectors/useHasPermission';
import ObjectItemBottom from './ObjectItemBottom';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import Avatar from 'components/Avatar';
import BFSReplace from 'utils/BFSReplace';
import escapeStringRegexp from 'escape-string-regexp';
import UserCard from 'components/UserCard';
import { lang } from 'utils/lang';
import { IImage } from 'apis/content';
import Base64 from 'utils/base64';

interface IProps {
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
  disabledUserCardTooltip?: boolean
  withBorder?: boolean
  beforeGoToUserPage?: () => unknown | Promise<unknown>
}

const Images = (props: {
  images: IImage[]
}) => {
  const count = props.images.length;
  return (
    <div className={classNames({
      count_1: count === 1,
      'grid grid-cols-2 gap-1': count === 2,
      'grid grid-cols-3 gap-1': count === 3,
      'grid grid-rows-2 grid-cols-2 gap-1': count === 4,
    }, 'rounded-12 overflow-hidden')}
    >
      {props.images.map((item: IImage, index: number) => {
        const url = Base64.getUrl(item);
        const onClick = () => {
          openPhotoSwipe({
            image: props.images.map((image: IImage) => Base64.getUrl(image)),
            index,
          });
        };
        const divRef = React.useRef(null);
        return (
          <div key={item.name}>
            {count === 1 && (
              <div
                className="rounded-12"
                ref={divRef}
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              >
                <img
                  className="cursor-pointer hidden"
                  src={url}
                  alt={item.name}
                  onClick={onClick}
                  onLoad={(e: any) => {
                    const div: any = divRef.current;
                    const { width, height } = e.target;
                    let _height = height;
                    let _width = width;
                    const MAX_WIDTH = 350;
                    const MAX_HEIGHT = 350;
                    if (width > MAX_WIDTH) {
                      _width = MAX_WIDTH;
                      _height = Math.round((_width * height) / width);
                    }
                    if (_height > MAX_HEIGHT) {
                      _height = MAX_HEIGHT;
                      _width = Math.round((_height * width) / height);
                    }
                    _width = Math.max(_width, 100);
                    div.style.width = `${_width}px`;
                    div.style.height = `${_height}px`;
                  }}
                />
              </div>
            )}
            {count === 2 && (
              <div
                className="h-45"
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              />
            )}
            {count === 3 && (
              <div
                className="h-50"
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              />
            )}
            {count === 4 && (
              <div
                className="h-34"
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              />
            )}
          </div>
        );
      })}
      <style jsx>{`
    .count_n {
        max-width: 80%;
        max-height: 50vh;
      }
    `}</style>
    </div>
  );
};

export default observer((props: IProps) => {
  const { object } = props;
  const { activeGroupStore, authStore } = useStore();
  const activeGroup = useActiveGroup();
  const isGroupOwner = useIsGroupOwner(activeGroup);
  const hasPermission = useHasPermission(object.Publisher);
  const state = useLocalObservable(() => ({
    canExpandContent: false,
    expandContent: props.inObjectDetailModal || false,
  }));
  const objectRef = React.useRef<HTMLDivElement>(null);
  const { content, image } = object.Content;
  const { searchText, profileMap } = activeGroupStore;
  const profile = profileMap[object.Publisher] || object.Extra.user.profile;
  const isOwner = activeGroup.user_pubkey === object.Publisher;

  React.useEffect(() => {
    if (props.inObjectDetailModal || !content) {
      return;
    }
    if (
      objectRef.current
      && objectRef.current.scrollHeight > objectRef.current.clientHeight
    ) {
      state.canExpandContent = true;
    } else {
      state.canExpandContent = false;
    }
  }, [content]);

  // replace link and search text
  React.useEffect(() => {
    const box = objectRef.current;
    if (!box || !content) {
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

    if (searchText) {
      BFSReplace(
        box,
        new RegExp(escapeStringRegexp(searchText), 'g'),
        (text: string) => {
          const span = document.createElement('span');
          span.textContent = text;
          span.className = 'text-yellow-500 font-bold';
          return span;
        },
      );
    }
  }, [searchText, content]);

  return (
    <div className={classNames({
      'border border-gray-f2': props.withBorder,
    }, 'rounded-0 bg-white px-8 pt-6 pb-3 w-full lg:w-[600px] box-border relative mb-[10px]')}
    >
      <div className="relative">
        <UserCard
          disableHover={props.disabledUserCardTooltip}
          object={object}
          beforeGoToUserPage={props.beforeGoToUserPage}
        >
          <Avatar
            className="absolute top-[-6px] left-[-4px]"
            profile={profile}
            size={44}
          />
        </UserCard>
        {isGroupOwner
          && authStore.deniedListMap[
            `groupId:${activeGroup.group_id}|peerId:${object.Publisher}`
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
          <div className="flex items-center leading-none pt-[1px]">
            <UserCard
              disableHover={props.disabledUserCardTooltip}
              object={object}
              beforeGoToUserPage={props.beforeGoToUserPage}
            >
              <div className="text-gray-4a font-bold">
                {profile.name}
              </div>
            </UserCard>
          </div>
          {content && (
            <div className="pb-2">
              <div
                ref={objectRef}
                key={content + searchText}
                className={classNames(
                  {
                    expandContent: state.expandContent,
                    fold: !state.expandContent,
                  },
                  'mt-[8px] text-gray-4a break-all whitespace-pre-wrap tracking-wide markdown',
                )}
                dangerouslySetInnerHTML={{
                  __html: hasPermission
                    ? content
                    : `<div class="text-red-400">${isOwner ? lang.beBannedTip6 : lang.beBannedTip3}</div>`,
                }}
              />
              {!state.expandContent && state.canExpandContent && (
                <div className="relative mt-6-px pb-2">
                  <div
                    className="text-blue-400 cursor-pointer tracking-wide flex items-center text-12 absolute w-full top-1 left-0 mt-[-6px]"
                    onClick={() => { state.expandContent = true; }}
                  >
                    {lang.expand}
                    <BsFillCaretDownFill className="text-12 ml-[1px] opacity-70" />
                  </div>
                </div>
              )}
              {state.expandContent && state.canExpandContent && (
                <div className="relative mt-6-px pb-2">
                  <div
                    className="text-blue-400 cursor-pointer tracking-wide flex items-center text-12 absolute w-full top-1 left-0 mt-[-6px]"
                    onClick={() => { state.expandContent = false; }}
                  >
                    {lang.shrink}
                    <BsFillCaretUpFill className="text-12 ml-[1px] opacity-70" />
                  </div>
                </div>
              )}
            </div>
          )}
          {!content && <div className="pb-3" />}
          {image && <div className="pb-2">
            <Images images={image} />
          </div>}
        </div>
      </div>

      <ObjectItemBottom
        object={object}
        inObjectDetailModal={props.inObjectDetailModal}
      />
      <style jsx>{`
        .fold {
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
          display: -webkit-box;
        }
        .expandContent {
          max-height: unset !important;
          -webkit-line-clamp: unset !important;
        }
      `}</style>
    </div>
  );
});
