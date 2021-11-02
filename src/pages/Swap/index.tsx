import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Page from 'components/Page';
import { Tab, Tabs } from '@material-ui/core';
import { useStore } from 'store';
import { PrsAtm } from 'utils';
import Exchanger from './Exchanger';
import Pools from './Pools';
import LiquidProvider from './LiquidProvider';
import Fade from '@material-ui/core/Fade';

export default observer(() => {
  const { poolStore } = useStore();
  const state = useLocalStore(() => ({
    tab: 'lp',
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
          <Tab value="pools" label="资金池" />
          <Tab value="lp" label="做市商" />
          <Tab value="transaction" label="交易记录" />
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
          {state.tab === 'transaction' && (
            <Fade in={true} timeout={500}>
              <div className="h-300-px bg-indigo-300 flex items-center justify-center">
                操作记录
              </div>
            </Fade>
          )}
        </div>
      </div>
    </Page>
  );
});
