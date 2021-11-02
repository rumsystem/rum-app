import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { useStore } from 'store';
import { PrsAtm } from 'utils';
import { useHistory } from 'react-router-dom';
import Page from 'components/Page';
import { IProducer } from 'types';
import Account from './Account';
import Assets from './Assets';
import Transactions from './Transactions';

export default observer(() => {
  const { accountStore } = useStore();
  const { isLogin } = accountStore;
  const history = useHistory();
  const state = useLocalStore(() => ({
    isFetchedAccount: false,
    isFetchedProducer: false,
    producer: {} as IProducer,
    reloading: false,
  }));

  React.useEffect(() => {
    if (isLogin) {
      state.isFetchedAccount = true;
    } else {
      history.replace('/producer');
    }
  }, [isLogin, history, state]);

  React.useEffect(() => {
    (async () => {
      const resp: any = await PrsAtm.fetch({
        id: 'getProducers',
        actions: ['producer', 'getAll'],
      });
      state.producer = resp.rows.find((row: any) => {
        return accountStore.permissionKeys.includes(row.producer_key);
      });
      state.isFetchedProducer = true;
    })();
  }, [state, accountStore]);

  return (
    <Page
      title="我的账号"
      loading={!state.isFetchedAccount || !state.isFetchedProducer}
    >
      <div className="relative">
        <div className="flex">
          <div className="flex-1">
            <Assets minHeight={state.producer ? 229 : 153} />
          </div>
          <div className="ml-5 w-300-px">
            <Account producer={state.producer} />
          </div>
        </div>
        <div className="mt-5">
          <Transactions />
        </div>
      </div>
    </Page>
  );
});
