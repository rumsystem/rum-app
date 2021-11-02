import React from 'react';
import { observer } from 'mobx-react-lite';
import { useHistory, useLocation } from 'react-router-dom';
import { useStore } from 'store';
import { PrsAtm, sleep } from 'utils';

export default observer(() => {
  const { accountStore, walletStore, confirmDialogStore } = useStore();
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
        const latestAccount: any = await PrsAtm.fetch({
          id: 'getAccount',
          actions: ['atm', 'getAccount'],
          args: [accountStore.account.account_name],
        });
        accountStore.setAccount(latestAccount);
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
        accountStore.setIsFetchedProducer(true);
      };

      if (isLogin) {
        try {
          await Promise.all([fetchAccountPromise, fetchBalancePromise]);
          await fetchProducer();
        } catch (err) {
          console.log(err);
          confirmDialogStore.show({
            content: '网络似乎不稳定，加载超时了',
            okText: '重新加载',
            ok: async () => {
              confirmDialogStore.hide();
              await sleep(300);
              window.location.reload();
            },
            cancelDisabled: true,
          });
        }
      }
    })();
  }, [isLogin, accountStore, walletStore]);

  return <div />;
});
