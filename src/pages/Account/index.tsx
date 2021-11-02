import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Page from 'components/Page';
import { Tab, Tabs } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { useStore } from 'store';
import Dashboard from './Dashboard';
import Transactions from './Transactions';

export default observer(() => {
  const { accountStore } = useStore();
  const { isLogin } = accountStore;
  const history = useHistory();
  const state = useLocalStore(() => ({
    tab: 'dashboard',
    isFetched: false,
  }));

  React.useEffect(() => {
    if (isLogin) {
      state.isFetched = true;
    } else {
      history.replace('/producer');
    }
  }, [isLogin, history, state]);

  return (
    <Page title="我的账号" loading={!state.isFetched}>
      <div>
        <Tabs
          value={state.tab}
          onChange={(_e, tab) => {
            state.tab = tab;
          }}
        >
          <Tab value="dashboard" label="总览" />
          <Tab value="transaction" label="流水账单" />
        </Tabs>
        <div className="mt-6 pt-1">
          {state.tab === 'dashboard' && <Dashboard />}
          {state.tab === 'transactions' && <Transactions />}
        </div>
      </div>
    </Page>
  );
});
