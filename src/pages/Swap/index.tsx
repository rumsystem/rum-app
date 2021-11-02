import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Page from 'components/Page';
import { Tab, Tabs } from '@material-ui/core';
import { useStore } from 'store';
import { PrsAtm } from 'utils';
import Exchanger from './Exchanger';

export default observer(() => {
  const { poolStore } = useStore();
  const state = useLocalStore(() => ({
    tab: 'exchanger',
    isFetched: false,
  }));

  React.useEffect(() => {
    (async () => {
      const resp: any = await PrsAtm.fetch({
        id: 'getAllPools',
        actions: ['swap', 'getAllPools'],
      });
      poolStore.setPools(resp);
      state.isFetched = true;
    })();
  }, [state, poolStore]);

  return (
    <Page title="币币兑换" loading={!state.isFetched}>
      <div>
        <Tabs
          value={state.tab}
          onChange={(_e, tab) => {
            state.tab = tab;
          }}
        >
          <Tab value="exchanger" label="兑换" />
          <Tab value="pool" label="资金池" />
          <Tab value="liquidProvider" label="做市商" />
          <Tab value="transaction" label="交易记录" />
        </Tabs>
        <div className="mt-8">
          {state.tab === 'exchanger' && <Exchanger />}
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
          {state.tab === 'transaction' && (
            <div className="h-300-px bg-indigo-300 flex items-center justify-center">
              操作记录
            </div>
          )}
        </div>
      </div>
    </Page>
  );
});
