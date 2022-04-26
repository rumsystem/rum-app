import React from 'react';
import { observer } from 'mobx-react-lite';
import { IDbDerivedObjectItem } from 'hooks/useDatabase/models/object';
import ago from 'utils/ago';
import ContentSyncStatus from 'components/ContentSyncStatus';
import ObjectMenu from '../ObjectMenu';
import OpenObjectDetail from './OpenObjectDetail';
import BFSReplace from 'utils/BFSReplace';
import escapeStringRegexp from 'escape-string-regexp';
import { useStore } from 'store';

interface IProps {
  object: IDbDerivedObjectItem
}

export default observer((props: IProps) => {
  const { object } = props;
  const { content } = object.Content;
  const objectContentRef = React.useRef<HTMLDivElement>(null);
  const { activeGroupStore } = useStore();
  const { searchText } = activeGroupStore;

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
    <div
      className="root bg-gray-f2 h-[185px]"
    >
      <div className="mb-5 mx-5 pt-3 text-gray-70 tracking-wider leading-relaxed">
        <div>
          <div className="flex justify-between">
            <div
              className="text-gray-88 text-12 tracking-wide cursor-pointer pb-[6px] opacity-70"
            >
              {ago(object.TimeStamp, { trimmed: true })}
            </div>
            <div className="-mr-2 opacity-90 mt-[1px]">
              <ContentSyncStatus
                status={object.Status}
                SyncedComponent={() => <ObjectMenu object={object} />}
                alwaysShow
              />
            </div>
          </div>
          <div
            className="content cursor-pointer"
            ref={objectContentRef}
            key={content + searchText}
            onClick={() => {
              OpenObjectDetail({
                object,
              });
            }}
          >
            {content}
          </div>
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
      `}</style>
    </div>
  );
});
