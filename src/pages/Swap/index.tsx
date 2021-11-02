import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Page from 'components/Page';
import { Tab, Tabs } from '@material-ui/core';
import Fade from '@material-ui/core/Fade';
import { useStore } from 'store';
import { PrsAtm, getQuery, removeQuery } from 'utils';
import Exchanger from './Exchanger';
import Pools from './Pools';
import LiquidProvider from './LiquidProvider';
import { useLocation } from 'react-router-dom';

export default observer(() => {
  const { poolStore } = useStore();
  const location = useLocation();
  const state = useLocalStore(() => ({
    tab: 'exchanger',
    isFetched: false,
  }));

  React.useEffect(() => {
    if (getQuery('tab')) {
      state.tab = getQuery('tab');
      removeQuery('tab');
    }
  }, [state, location.search]);

  React.useEffect(() => {
    (async () => {
      const resp: any = await PrsAtm.fetch({
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
          <Tab value="pools" label="资金池" />
          <Tab value="lp" label="流动性" />
        </Tabs>
        <div className="mt-8">
          {state.tab === 'exchanger' && (
            <Fade in={true} timeout={500}>
              <div>
                <Exchanger />
              </div>
            </Fade>
          )}
          {state.tab === 'pools' && (
            <Fade in={true} timeout={500}>
              <div>
                <Pools />
              </div>
            </Fade>
          )}
          {state.tab === 'lp' && (
            <Fade in={true} timeout={500}>
              <LiquidProvider />
            </Fade>
          )}
        </div>
      </div>
    </Page>
  );
});
