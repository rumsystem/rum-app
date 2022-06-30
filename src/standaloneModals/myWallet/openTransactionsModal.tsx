import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { StoreProvider } from 'store';
import { ThemeRoot } from 'utils/theme';
import Transactions from './transactions';
import MVMApi, { ITransaction } from 'apis/mvm';
import Loading from 'components/Loading';

export default () => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <Deposit
            rs={() => {
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
};

const Deposit = observer((props: any) => {
  const ADDRESS = '0x3a0075D4C979839E31D1AbccAcDF3FcAe981fe33';
  const state = useLocalObservable(() => ({
    open: true,
    transactions: [] as ITransaction[],
    fetched: false,
  }));

  React.useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const res = await MVMApi.transactions({
          account: ADDRESS,
          count: 1000,
          sort: 'DESC',
        });
        state.transactions = res.data.filter((t) => ['WITHDRAW', 'DEPOSIT', 'TRANSFER'].includes(t.type));
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
      transitionDuration={{
        enter: 300,
      }}
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
                <Transactions data={state.transactions} myAddress={ADDRESS} />
              )}
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
});
