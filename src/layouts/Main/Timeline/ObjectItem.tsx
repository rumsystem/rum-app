import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import classNames from 'classnames';
import scrollIntoView from 'scroll-into-view-if-needed';
import { BsFillCaretDownFill, BsFillCaretUpFill } from 'react-icons/bs';
import { useStore } from 'store';
import ObjectItemBottom from './ObjectItemBottom';
import { IDBPost, IDBPostRaw } from 'hooks/useDatabase/models/posts';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import Avatar from 'components/Avatar';
import BFSReplace from 'utils/BFSReplace';
import escapeStringRegexp from 'escape-string-regexp';
import UserCard from 'components/UserCard';
import { lang } from 'utils/lang';
import Base64 from 'utils/base64';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';
import sleep from 'utils/sleep';
import { action, runInAction } from 'mobx';

interface IProps {
  custom?: boolean
  object: IDBPost
  inObjectDetailModal?: boolean
  disabledUserCardTooltip?: boolean
  withBorder?: boolean
  beforeGoToUserPage?: () => Promise<unknown>
}

const Images = observer((props: { images: Exclude<IDBPostRaw['images'], undefined> }) => {
  const count = props.images.length;

  return (
    <div className={classNames({
      count_1: count === 1,
      'grid grid-cols-2 gap-1': count === 2,
      'grid grid-cols-3 gap-1': count === 3,
      'grid grid-rows-2 grid-cols-2 gap-1': count === 4,
    }, 'rounded-12 overflow-hidden')}
    >
      {props.images.map((item, index) => {
        const url = Base64.getUrl(item);
        const onClick = () => {
          openPhotoSwipe({
            image: props.images.map((image) => Base64.getUrl(image)),
            index,
          });
        };
        const divRef = React.useRef<HTMLDivElement>(null);
        return (
          <div key={index}>
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
                  className="cursor-pointer opacity-0 absolute top-[-9999px] left-[-9999px]"
                  src={url}
                  onLoad={(e) => {
                    const div = divRef.current;
                    const img = e.currentTarget;
                    const { width, height } = img;
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
                    if (div) {
                      div.style.width = `${_width}px`;
                      div.style.height = `${_height}px`;
                      img.style.position = 'static';
                      img.style.top = '0';
                      img.style.left = '0';
                      img.style.width = '100%';
                      img.style.height = '100%';
                    }
                  }}

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
    </div>
  );
});


export default observer((props: IProps) => {
  const { object } = props;
  const { activeGroupStore, fontStore } = useStore();
  const state = useLocalObservable(() => ({
    canExpand: false,
    expand: props.inObjectDetailModal || false,
  }));
  const postBoxRef = React.useRef<HTMLDivElement>(null);
  const contentBoxRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLSpanElement>(null);
  const content = object.content;
  const image = object.images;
  const { searchText, profileMap } = activeGroupStore;
  const profile = profileMap[object.publisher] || object.extra.user;

  const handleToggleExpand = action(() => {
    if (!state.expand) {
      state.expand = true;
    } else {
      state.expand = false;
      sleep(1).then(() => {
        scrollIntoView(postBoxRef.current!, { scrollMode: 'if-needed' });
      });
    }
  });

  // replace link and search text
  React.useEffect(() => {
    const box = contentBoxRef.current;
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
    if (props.inObjectDetailModal || !content) { return; }
    const contentBox = contentBoxRef.current;
    const contentSpan = contentRef.current;
    if (!contentBox || !contentSpan) { return; }
    runInAction(() => {
      state.canExpand = contentSpan.offsetHeight > contentBox.clientHeight;
    });
  }, [content]);

  return (
    <div
      className={classNames(
        'timeline-object-item rounded-0 bg-white px-8 pt-6 pb-3 w-full lg:w-[600px] box-border relative mb-[10px]',
        props.withBorder && 'border border-gray-f2',
      )}
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
            avatar={profile.avatar}
            size={44}
          />
        </UserCard>
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
          {!!content && (
            <div className="pb-2">
              <div
                ref={contentBoxRef}
                key={content + searchText}
                className={classNames(
                  'mt-[8px] text-gray-4a break-all whitespace-pre-wrap tracking-wide',
                  !state.expand && 'truncate-5',
                )}
                style={{ fontSize: `${fontStore.fontSize}px` }}
              >
                <span ref={contentRef} dangerouslySetInnerHTML={{ __html: content }} />
              </div>
              {state.canExpand && (
                <div className="mt-1 -mb-2">
                  <div
                    className="text-blue-400 cursor-pointer tracking-wide flex items-center text-12 w-full"
                    onClick={handleToggleExpand}
                  >
                    {state.expand ? lang.shrink : lang.expand}
                    {!state.expand && <BsFillCaretDownFill className="text-12 ml-[1px] opacity-70" />}
                    {state.expand && <BsFillCaretUpFill className="text-12 ml-[1px] opacity-70" />}
                  </div>
                </div>
              )}
            </div>
          )}
          {!content && <div className="pb-3" />}
          {!!image?.length && <div className="pb-2">
            <Images images={image} />
          </div>}
        </div>
      </div>

      <ObjectItemBottom
        custom={props.custom}
        object={object}
        inObjectDetailModal={props.inObjectDetailModal}
      />
    </div>
  );
});
