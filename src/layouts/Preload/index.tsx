import React from 'react';
import { observer } from 'mobx-react-lite';
import { useHistory, useLocation } from 'react-router-dom';
import { useStore } from 'store';
import { PrsAtm } from 'utils';

export default observer(() => {
  const { accountStore, walletStore } = useStore();
  const { isLogin } = accountStore;
  const history = useHistory();
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname === '/') {
      history.replace(isLogin ? '/dashboard' : '/producer');
    }
  }, [isLogin, location, history]);

  React.useEffect(() => {
    (async () => {
      const fetchAccountPromise = (async () => {
        try {
          const latestAccount: any = await PrsAtm.fetch({
            id: 'getAccount',
            actions: ['atm', 'getAccount'],
            args: [accountStore.account.account_name],
          });
          accountStore.setAccount(latestAccount);
        } catch (err) {}
      })();

      const fetchBalancePromise = (async () => {
        walletStore.setLoading(true);
        try {
          const balance: any = await PrsAtm.fetch({
            id: 'getBalance',
            actions: ['account', 'getBalance'],
            args: [accountStore.account.account_name],
          });
          walletStore.setBalance(balance);
        } catch (err) {
          walletStore.setFailed(true);
        }
        walletStore.setLoading(false);
      })();

      const fetchProducer = async () => {
        try {
          const resp: any = await PrsAtm.fetch({
            id: 'getProducers',
            actions: ['producer', 'getAll'],
          });
          const producer = resp.rows.find((row: any) => {
            return accountStore.permissionKeys.includes(row.producer_key);
          });
          if (producer) {
            accountStore.setProducer(producer);
          }
        } catch (err) {
          console.log(err);
        }
        accountStore.setIsFetchedProducer(true);
      };

      if (isLogin) {
        try {
          await Promise.all([fetchAccountPromise, fetchBalancePromise]);
          await fetchProducer();
        } catch (err) {
          console.log(err);
        }
      }
    })();
  }, [isLogin, accountStore, walletStore]);

  return <div />;
});
