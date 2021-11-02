import React from 'react';
import { observer } from 'mobx-react-lite';
import Content from './Content';
import { useStore } from 'store';
import { ContentItem } from 'apis/group';

export default observer(() => {
  const { groupStore } = useStore();
  const { contents } = groupStore;
  const lastContent = contents[0];
  return (
    <div>
      {contents.map((content: ContentItem) => (
        <div key={content.TrxId}>
          {lastContent !== content &&
            groupStore.lastReadContentTimeStamps.includes(
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
    </div>
  );
});
