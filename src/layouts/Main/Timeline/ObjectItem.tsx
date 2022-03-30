import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';
import scrollIntoView from 'scroll-into-view-if-needed';
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
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';
import sleep from 'utils/sleep';

interface IProps {
  object: IDbDerivedObjectItem
  inObjectDetailModal?: boolean
  disabledUserCardTooltip?: boolean
  withBorder?: boolean
  beforeGoToUserPage?: () => unknown | Promise<unknown>
}

const Images = observer((props: { images: IImage[] }) => {
  const count = props.images.length;

  const state = useLocalObservable(() => ({
    width: 0,
    height: 0,

    get caculatedSize() {
      let ratio = Math.max(this.width, this.height) / 350;
      if (ratio <= 1) {
        ratio = 1;
      }
      if (this.width < 100) {
        return {
          width: 100,
          height: (100 * this.height) / this.width,
        };
      }
      return {
        width: Math.floor(this.width / ratio),
        height: Math.floor(this.height / ratio),
      };
    },
  }));

  React.useEffect(() => {
    if (props.images.length !== 1) {
      return;
    }
    const img = document.createElement('img');
    img.src = Base64.getUrl(props.images[0]);
    img.onload = () => {
      state.height = img.naturalHeight;
      state.width = img.naturalWidth;
    };
  }, []);


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
        return (
          <div key={index}>
            {count === 1 && (
              <div
                className="rounded-12"
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                  width: `${state.caculatedSize.width}px`,
                  height: `${state.caculatedSize.height}px`,
                }}
                onClick={onClick}
              >
                <img
                  className="cursor-pointer opacity-0 w-full h-full"
                  src={url}
                  alt={item.name}
                />
              </div>
            )}
            {count === 2 && (
              <div
                className="h-45 overflow-hidden"
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              >
                <img className="w-full h-full opacity-0" src={url} alt="" />
              </div>
            )}
            {count === 3 && (
              <div
                className="h-50 overflow-hidden"
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              >
                <img className="w-full h-full opacity-0" src={url} alt="" />
              </div>
            )}
            {count === 4 && (
              <div
                className="h-34 overflow-hidden"
                style={{
                  background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
                }}
                onClick={onClick}
              >
                <img className="w-full h-full opacity-0" src={url} alt="" />
              </div>
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
});

export default observer((props: IProps) => {
  const { object } = props;
  const { activeGroupStore, authStore, fontStore } = useStore();
  const activeGroup = useActiveGroup();
  const isGroupOwner = useIsGroupOwner(activeGroup);
  const hasPermission = useHasPermission(object.Publisher);
  const state = useLocalObservable(() => ({
    canExpandContent: false,
    expandContent: props.inObjectDetailModal || false,
  }));
  const postBoxRef = React.useRef<HTMLDivElement>(null);
  const objectRef = React.useRef<HTMLDivElement>(null);
  const { content, image } = object.Content;
  const { searchText, profileMap } = activeGroupStore;
  const profile = profileMap[object.Publisher] || object.Extra.user.profile;
  const isOwner = activeGroup.user_pubkey === object.Publisher;

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

    replaceSeedAsButton(box);

    if (searchText) {
      BFSReplace(
        box,
        new RegExp(escapeStringRegexp(searchText), 'ig'),
        (text: string) => {
          const span = document.createElement('span');
          span.textContent = text;
          span.className = 'text-amber-500 font-bold';
          return span;
        },
      );
    }
  }, [searchText, content]);

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

  return (
    <div
      className={classNames({
        'border border-gray-f2': props.withBorder,
      }, 'timeline-object-item rounded-0 bg-white px-8 pt-6 pb-3 w-full lg:w-[600px] box-border relative mb-[10px]')}
      ref={postBoxRef}
    >
      <div className="relative">
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
            <div className="text-gray-4a font-bold">
              <UserCard
                disableHover={props.disabledUserCardTooltip}
                object={object}
                beforeGoToUserPage={props.beforeGoToUserPage}
              >
                {profile.name}
              </UserCard>
            </div>
          </div>
          {content && (
            <div className="pb-2 relative">
              <div
                ref={objectRef}
                key={content + searchText}
                className={classNames(
                  {
                    expandContent: state.expandContent,
                    fold: !state.expandContent,
                  },
                  'mt-[8px] text-gray-4a break-all whitespace-pre-wrap tracking-wide',
                  'text-' + fontStore.fontSize,
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
                    onClick={async () => {
                      state.expandContent = false;
                      await sleep(1);
                      scrollIntoView(postBoxRef.current!, { scrollMode: 'if-needed' });
                    }}
                  >
                    {lang.shrink}
                    <BsFillCaretUpFill className="text-12 ml-[1px] opacity-70" />
                  </div>
                </div>
              )}
              {state.expandContent && state.canExpandContent && content.length > 600 && (
                <div
                  className="text-blue-400 cursor-pointer tracking-wide flex items-center text-12 absolute top-[2px] right-[-90px] opacity-80"
                  onClick={() => {
                    state.expandContent = false;
                  }}
                >
                  {lang.shrink}
                  <BsFillCaretUpFill className="text-12 ml-[1px] opacity-70" />
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
