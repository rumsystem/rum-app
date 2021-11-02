import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { PrsAtm, Block } from 'utils';
import { useStore } from 'store';
import Loading from 'components/Loading';
import classNames from 'classnames';
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@material-ui/core';
import moment from 'moment';
import usePageInfiniteScroll from 'hooks/usePageInfiniteScroll';
import BackToTop from 'components/BackToTop';

interface ITransaction {
  block: any;
  block_id: string;
  block_num: number;
  fee: string;
  from: any;
  to: any;
  from_user: string;
  pool_token: string;
  previous: string;
  producer: string;
  req_id: string;
  timestamp: string;
  to_user: string;
  transactions_trx_id: string;
  transactions_trx_transaction_actions_account: string;
  transactions_trx_transaction_actions_data__dp_wd_req__id: string;
  transactions_trx_transaction_actions_data__sync_auth__result: string;
  transactions_trx_transaction_actions_data_data: any;
  transactions_trx_transaction_actions_data_data_topic: string;
  transactions_trx_transaction_actions_data_id: string;
  transactions_trx_transaction_actions_data_meta: string;
  transactions_trx_transaction_actions_data_oracleservice: string;
  transactions_trx_transaction_actions_data_user_address: string;
  transactions_trx_transaction_actions_name: string;
  trx_id: string;
  trx_timestamp: string;
  type: string;
}

const Head = () => {
  return (
    <TableHead>
      <TableRow>
        <TableCell>类型</TableCell>
        <TableCell>资产A</TableCell>
        <TableCell>资产B</TableCell>
        <TableCell>交易对数量</TableCell>
        <TableCell>状态</TableCell>
        <TableCell>时间</TableCell>
        <TableCell>区块</TableCell>
      </TableRow>
    </TableHead>
  );
};

const typeNameMap: any = {
  ADD_LIQUID: '存入',
  RM_LIQUID: '取出',
  SWAP: '兑换',
};

const LIMIT = 15;

export default observer(() => {
  const { accountStore } = useStore();
  const state = useLocalStore(() => ({
    refresh: false,
    timestamp: '',
    isFetching: false,
    isFetched: false,
    transactions: [] as ITransaction[],
    hasMore: true,
    get isEmpty() {
      return this.transactions.length === 0;
    },
  }));

  const infiniteRef: any = usePageInfiniteScroll({
    loading: state.isFetching,
    hasNextPage: state.hasMore,
    threshold: 200,
    onLoadMore: () => {
      if (!state.isEmpty) {
        state.timestamp =
          state.transactions[state.transactions.length - 1].timestamp;
      }
    },
  });

  React.useEffect(() => {
    if (state.isFetching) {
      return;
    }
    if (state.refresh) {
      state.transactions = [];
      state.timestamp = '';
      state.isFetched = false;
      state.refresh = false;
    }
    (async () => {
      state.isFetching = true;
      try {
        const resp: any = await PrsAtm.fetch({
          id: 'exchange.queryStatement',
          actions: ['exchange', 'queryStatement'],
          args: [accountStore.account.account_name, state.timestamp, LIMIT],
        });
        state.transactions.push(...(resp as ITransaction[]));
        state.hasMore = state.transactions.length === LIMIT;
      } catch (err) {
        console.log(err);
      }
      state.isFetching = false;
      state.isFetched = true;
    })();
  }, [state, accountStore, state.timestamp, state.refresh]);

  return (
    <div className=" bg-white rounded-12 text-gray-6d relative">
      <div className="px-5 py-2">
        {!state.isFetched && (
          <div className="py-16">
            <Loading />
          </div>
        )}
        {state.isFetched && state.isEmpty && (
          <div className="py-20 text-center text-gray-af text-14">
            还没有记录
          </div>
        )}
        {state.isFetched && !state.isEmpty && (
          <div className="pt-4 pb-5 px-3" ref={infiniteRef}>
            <Paper>
              <Table>
                <Head />
                <TableBody>
                  {state.transactions.map((t) => (
                    <TableRow key={t.transactions_trx_id}>
                      <TableCell>
                        <div
                          className={classNames({
                            'text-green-500': t.type === 'ADD_LIQUID',
                            'text-red-400': t.type === 'RM_LIQUID',
                          })}
                        >
                          {typeNameMap[t.type] || t.type}
                        </div>
                      </TableCell>
                      <TableCell>
                        {t.type === 'ADD_LIQUID' && t.from[0]}
                        {t.type === 'RM_LIQUID' && t.to[0]}
                        {t.type === 'SWAP' && t.from}
                      </TableCell>
                      <TableCell>
                        {t.type === 'ADD_LIQUID' && t.from[1]}
                        {t.type === 'RM_LIQUID' && t.to[1]}
                        {t.type === 'SWAP' && t.to}
                      </TableCell>
                      <TableCell>
                        {t.type === 'SWAP' ? '-' : t.pool_token}
                      </TableCell>
                      <TableCell>已完成</TableCell>
                      <TableCell>
                        {moment(t.timestamp).format('yyyy-MM-DD HH:mm')}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-indigo-400 cursor-pointer"
                          onClick={() => Block.open(t.block_num)}
                        >
                          {t.block_num}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
            {state.isFetching && state.timestamp && state.hasMore && (
              <div className="mt-3 py-5">
                <Loading />
              </div>
            )}
          </div>
        )}
      </div>
      {state.transactions.length > LIMIT && <BackToTop />}
    </div>
  );
});
