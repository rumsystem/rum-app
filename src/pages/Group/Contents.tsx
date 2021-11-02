import React from 'react';
import { observer } from 'mobx-react-lite';
import Content from './Content';
import { useStore } from 'store';
import { IContentItem } from 'apis/group';

export default observer(() => {
  const { groupStore, nodeStore } = useStore();
  const { contents } = groupStore;
  const lastContent = contents[0];
  return (
    <div>
      {contents.map((content: IContentItem) => (
        <div key={content.TrxId}>
          {lastContent !== content &&
            lastContent.Publisher &&
            lastContent.Publisher !== nodeStore.info.user_id &&
            groupStore.currentGroupLastContentTimeStamps.includes(
              content.TimeStamp
            ) && (
              <div className="w-full text-12 text-center py-6 pb-3 text-gray-400">
                上次看到这里
              </div>
            )}
          <div className="cursor-pointer">
            <Content content={content} />
          </div>
        </div>
      ))}
      {contents.length > 5 && (
        <div className="pt-6 pb-3 text-center text-12 text-gray-400 opacity-80">
          没有更多内容了哦
        </div>
      )}
    </div>
  );
});
