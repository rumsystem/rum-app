import React from 'react';
import { createRoot } from 'react-dom/client';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import Transactions from './transactions';
import MVMApi, { ITransaction } from 'apis/mvm';
import Loading from 'components/Loading';
import useActiveGroup from 'store/selectors/useActiveGroup';

export default () => {
  const div = document.createElement('div');
  document.body.append(div);
  const root = createRoot(div);
  const unmount = () => {
    root.unmount();
    div.remove();
  };
  root.render(
    <ThemeRoot>
      <StoreProvider>
        <Deposit
          rs={() => {
            setTimeout(unmount, 3000);
          }}
        />
      </StoreProvider>
    </ThemeRoot>,
  );
};

const Deposit = observer((props: any) => {
  const activeGroup = useActiveGroup();
  const state = useLocalObservable(() => ({
    open: true,
    transactions: [] as ITransaction[],
    fetched: false,
  }));

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await MVMApi.transactions({
          address: activeGroup.user_eth_addr,
          count: 1000,
          sort: 'DESC',
        });
        state.transactions = res.data.filter((t) => ['WITHDRAW', 'DEPOSIT', 'TRANSFER', 'ADDPRICE', 'PAY', 'EXCHANGE'].includes(t.type) && t.asset?.rumSymbol);
        state.fetched = true;
      } catch (err) {
        console.log(err);
      }
    };
    fetchTransactions();
    const timer = setInterval(fetchTransactions, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  return (
    <Dialog
      maxWidth={false}
      open={state.open}
      onClose={handleClose}
      transitionDuration={300}
    >
      <div className="w-[780px] h-80-vh bg-white text-center py-8 px-12">
        {!state.fetched && (
          <div className="pt-40 flex justify-center">
            <Loading />
          </div>
        )}
        {state.fetched && (
          <div>
            <div className="text-20 font-bold text-gray-4a">交易记录</div>
            <div className="py-5">
              {state.transactions.length === 0 && (
                <div className="py-16 text-center text-14 text-gray-400 opacity-80">
                  暂无数据
                </div>
              )}
              {state.transactions.length > 0 && (
                <Transactions data={state.transactions} myAddress={activeGroup.user_eth_addr} showGas={true} />
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
});
