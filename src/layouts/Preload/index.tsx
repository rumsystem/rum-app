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
      history.replace(isLogin ? '/account' : '/producer');
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

      if (isLogin) {
        try {
          await Promise.all([fetchAccountPromise, fetchBalancePromise]);
        } catch (err) {
          console.log(err);
        }
      }
    })();
  }, [isLogin, accountStore, walletStore]);

  return <div />;
});
