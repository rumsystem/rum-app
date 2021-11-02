import React from 'react';
import { observer } from 'mobx-react-lite';
import { useHistory, useLocation } from 'react-router-dom';
import { useStore } from 'store';
import { PrsAtm, sleep } from 'utils';

export default observer(() => {
  const {
    accountStore,
    walletStore,
    confirmDialogStore,
    poolStore,
  } = useStore();
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
      if (isLogin) {
        try {
          const fetchAccount = async () => {
            const latestAccount: any = await PrsAtm.fetch({
              actions: ['atm', 'getAccount'],
              args: [accountStore.account.account_name],
            });
            accountStore.setAccount(latestAccount);
          };

          const fetchBalance = async () => {
            walletStore.setLoading(true);
            try {
              const balance: any = await PrsAtm.fetch({
                actions: ['account', 'getBalance'],
                args: [accountStore.account.account_name],
                logging: true,
              });
              walletStore.setBalance(balance);
            } catch (err) {
              walletStore.setFailed(true);
            }
            walletStore.setLoading(false);
          };

          const fetchPools = async () => {
            try {
              const resp: any = await PrsAtm.fetch({
                actions: ['swap', 'getAllPools'],
              });
              poolStore.setPools(resp);
            } catch (err) {
              console.log('getAllPools failed');
            }
          };

          fetchPools();
          await Promise.all([fetchAccount(), fetchBalance()]);
        } catch (err) {
          console.log(err.message);
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
