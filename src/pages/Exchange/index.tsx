import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Page from 'components/Page';
import { Tab, Tabs } from '@material-ui/core';

export default observer(() => {
  const state = useLocalStore(() => ({
    tab: 'exchange',
    isFetched: true,
  }));

  return (
    <Page title="币币兑换" loading={!state.isFetched}>
      <div>
        <div className="flex justify-center">
          <Tabs
            className="sm"
            value={state.tab}
            onChange={(_e, tab) => {
              state.tab = tab;
            }}
          >
            <Tab value="exchange" label="兑换" />
            <Tab value="pool" label="资金池" />
            <Tab value="liquidProvider" label="做市商" />
          </Tabs>
        </div>
        <div className="mt-8">
          {state.tab === 'exchange' && (
            <div className="h-300-px bg-indigo-300 flex items-center justify-center">
              兑换
            </div>
          )}
          {state.tab === 'pool' && (
            <div className="h-300-px bg-indigo-300 flex items-center justify-center">
              资金池
            </div>
          )}
          {state.tab === 'liquidProvider' && (
            <div className="h-300-px bg-indigo-300 flex items-center justify-center">
              做市商
            </div>
          )}
        </div>
      </div>
    </Page>
  );
});
