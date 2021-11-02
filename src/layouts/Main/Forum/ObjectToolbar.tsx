import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import { RiAddLine } from 'react-icons/ri';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import OpenEditor from './OpenEditor';

export default observer(() => {
  const rootRef = React.useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef} className="bg-white pr-4 py-[6px] flex items-center justify-between w-full mb-4">
      <Filter />
      <div>
        <Button
          size="small"
          onClick={() => {
            OpenEditor();
          }}
        >
          <RiAddLine className="ml-[-3px] mr-[1px] opacity-80 text-18" />
          发帖
        </Button>
      </div>
    </div>
  );
});

const Filter = observer(() => {
  const state = useLocalObservable(() => ({
    tab: 0,
  }));

  return (
    <div>
      <div className="hidden">
        <Tabs
          className="forum-tabs"
          value={state.tab}
          onChange={(_e, newTab) => {
            state.tab = newTab;
          }}
        >
          <Tab label="按热度" />
          <Tab label="按时间" />
        </Tabs>
      </div>
      <div className="text-gray-700 text-16 leading-5 tracking-wide pl-6">
        最新帖子
      </div>
      <style jsx global>{`
        .forum-tabs, .forum-tabs .MuiTabs-fixed {
          overflow: visible !important;
        }
        .forum-tabs .MuiTab-root {
          height: 38px !important;
          padding-left: 18px !important;
          padding-right: 18px !important;
          margin-right: 0 !important;
        }
        .forum-tabs .MuiTabs-indicator {
          bottom: 40px
        }
      `}</style>
    </div>
  );
});
