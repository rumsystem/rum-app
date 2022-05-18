import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import { RiAddLine } from 'react-icons/ri';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import OpenObjectEditor from './OpenObjectEditor';
import { useStore } from 'store';
import classNames from 'classnames';
import { lang } from 'utils/lang';
import * as ObjectModel from 'hooks/useDatabase/models/object';

export default observer(() => {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const { activeGroupStore } = useStore();
  const hasObject = activeGroupStore.objectTotal > 0;
  return (
    <div
      ref={rootRef}
      className={classNames({
        'justify-center py-10 px-8': !hasObject,
        'justify-between pr-4 pt-[8px] pb-[7px]': hasObject,
      }, 'bg-white flex items-center w-full mb-4')}
    >
      {hasObject && (
        <Filter />
      )}
      <div>
        <Button
          size="mini"
          onClick={() => {
            OpenObjectEditor();
          }}
        >
          <RiAddLine className="ml-[-3px] mr-[1px] opacity-80 text-16" />
          {hasObject ? lang.createForumPost : lang.createFirstForumPost}
        </Button>
      </div>
    </div>
  );
});

const Filter = observer(() => {
  const { activeGroupStore } = useStore();
  const state = useLocalObservable(() => ({
    tab: activeGroupStore.objectsFilter.order || ObjectModel.Order.desc,
  }));

  return (
    <div>
      <Tabs
        className="forum-tabs"
        value={state.tab}
        onChange={(_e, newTab) => {
          state.tab = newTab;
          activeGroupStore.setObjectsFilter({
            ...activeGroupStore.objectsFilter,
            order: state.tab,
          });
        }}
      >
        <Tab value={ObjectModel.Order.desc} label={lang.latest} />
        <Tab value={ObjectModel.Order.hot} label={lang.hot} />
      </Tabs>
      <style jsx global>{`
        .forum-tabs, .forum-tabs .MuiTabs-fixed {
          overflow: visible !important;
        }
        .forum-tabs .MuiTab-root {
          height: 38px !important;
          padding-left: 34px !important;
          padding-right: 34px !important;
          margin-right: 0 !important;
          font-size: 16px;
        }
        .forum-tabs .MuiTabs-indicator {
          bottom: 41px;
          height: 4px !important;
        }
      `}</style>
    </div>
  );
});
