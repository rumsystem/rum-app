import React from 'react';
import { observer } from 'mobx-react-lite';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import ago from 'utils/ago';
import ContentSyncStatus from 'components/ContentSyncStatus';
import OpenObjectDetail from './OpenObjectDetail';
import BFSReplace from 'utils/BFSReplace';
import escapeStringRegexp from 'escape-string-regexp';
import { useStore } from 'store';
import { IImage } from 'apis/content';
import Base64 from 'utils/base64';
import openPhotoSwipe from 'standaloneModals/openPhotoSwipe';
import classNames from 'classnames';
import { replaceSeedAsButton } from 'utils/replaceSeedAsButton';
import { lang } from 'utils/lang';
import ObjectMenu from '../ObjectMenu';
import OpenObjectEditor from './OpenObjectEditor';
import useDeleteObject from 'hooks/useDeleteObject';

interface IProps {
  object: IDbDerivedObjectItem
}

const Images = (props: {
  images: IImage[]
  isFull?: boolean
}) => {
  const count = props.images.length;
  return (
    <div className="flex">
      {props.images.map((item: IImage, index: number) => {
        const { isFull } = props;
        const url = Base64.getUrl(item);
        const onClick = () => {
          openPhotoSwipe({
            image: props.images.map((image: IImage) => Base64.getUrl(image)),
            index,
          });
        };
        return (
          <div key={item.name}>
            <div
              className={classNames({
                'w-12 h-12 rounded-6': count < 4 && !isFull,
                'w-10 h-10 rounded-6': count === 4 && !isFull,
                'w-26 h-26 rounded-10': isFull,
              }, 'mr-[6px]')}
              style={{
                background: `url(${url}) center center / cover no-repeat rgba(64, 64, 64, 0.6)`,
              }}
              onClick={onClick}
            >
              <img className="w-full h-full opacity-0" src={url} alt="" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default observer((props: IProps) => {
  const { object } = props;
  const { content, image } = object.Content;
  const objectContentRef = React.useRef<HTMLDivElement>(null);
  const { activeGroupStore } = useStore();
  const { searchText } = activeGroupStore;
  const deleteObject = useDeleteObject();

  // replace link and search text
  React.useEffect(() => {
    const box = objectContentRef.current;
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

  return (
    <div
      className="root bg-gray-f2 h-[185px]"
      data-test-id="note-object-item"
    >
      <div className="mb-5 mx-5 pt-3 text-gray-70 tracking-wider leading-relaxed">
        <div>
          <div className="flex justify-between">
            <div
              className="text-gray-88 text-12 tracking-wide cursor-pointer pb-[6px] opacity-70"
            >
              {ago(object.TimeStamp, { trimmed: true })}
            </div>
            <div className="-mr-[10px] opacity-90 mt-[3px]">
              <ContentSyncStatus
                status={object.Status}
                SyncedComponent={() => (
                  <div className="mt-[-3px]">
                    <ObjectMenu
                      object={object}
                      onClickUpdateMenu={() => {
                        OpenObjectEditor(object);
                      }}
                      onClickDeleteMenu={() => {
                        deleteObject(object.TrxId);
                      }}
                    />
                  </div>
                )}
                alwaysShow
              />
            </div>
          </div>
          <div
            className={classNames({
              'min': image && image.length > 0,
            }, 'content cursor-pointer')}
            ref={objectContentRef}
            key={content + searchText}
            onClick={() => {
              OpenObjectDetail({
                object,
              });
            }}
          >
            {content || ''}
            {!content && !image && (
              <span className="text-red-400">
                {lang.encryptedContent}
              </span>
            )}
          </div>
          {image && <div>
            {content && <div className="pt-[14px]" />}
            {!content && <div className="pt-2" />}
            <Images images={image} isFull={!content && image.length === 1} />
          </div>}
        </div>
      </div>
      <style jsx>{`
      .root .content {
          overflow: hidden;
          text-overflow: ellipsis;
          -webkit-line-clamp: 6;
          -webkit-box-orient: vertical;
          display: -webkit-box;
        }
        .root .content.min {
          -webkit-line-clamp: 3;
        }
      `}</style>
    </div>
  );
});
