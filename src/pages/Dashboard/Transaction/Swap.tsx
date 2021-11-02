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
import { BsArrowRightShort, BsArrowLeftShort } from 'react-icons/bs';

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
        <TableCell>区块</TableCell>
        <TableCell>状态</TableCell>
        <TableCell>时间</TableCell>
      </TableRow>
    </TableHead>
  );
};

const typeNameMap: any = {
  ADD_LIQUID: '注入',
  RM_LIQUID: '赎回',
  SWAP: '兑换',
};

const LIMIT = 10;

export default observer(() => {
  const { accountStore } = useStore();
  const state = useLocalStore(() => ({
    page: 0,
    timestamp: '',
    isFetching: false,
    isFetched: false,
    isFixedHeight: false,
    transactions: [] as ITransaction[],
    cachedPagination: {} as any,
    get hasMore() {
      return (
        state.transactions.length > 0 && state.transactions.length === LIMIT
      );
    },
    get isEmpty() {
      return this.page === 0 && this.transactions.length === 0;
    },
  }));

  React.useEffect(() => {
    if (state.isFetching) {
      return;
    }
    (async () => {
      state.isFetching = true;
      try {
        const resp: any = await PrsAtm.fetch({
          actions: ['exchange', 'queryStatement'],
          args: [accountStore.account.account_name, state.timestamp, LIMIT],
        });
        state.transactions = resp as ITransaction[];
        state.cachedPagination[state.page] = state.transactions;
        if (state.transactions.length === LIMIT) {
          state.isFixedHeight = true;
        }
      } catch (err) {
        console.log(err);
      }
      state.isFetching = false;
      state.isFetched = true;
    })();
  }, [state, accountStore, state.timestamp]);

  React.useEffect(() => {
    if (state.cachedPagination[state.page]) {
      state.transactions = state.cachedPagination[state.page] as ITransaction[];
    }
  }, [state, state.page]);

  const goPrev = () => {
    if (state.isFetching) {
      return;
    }
    state.page -= 1;
  };

  const goNext = () => {
    if (state.isFetching) {
      return;
    }
    state.page += 1;
    if (!state.cachedPagination[state.page + 1]) {
      state.timestamp =
        state.transactions[state.transactions.length - 1].timestamp;
    }
  };

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
          <div className="pt-4 pb-5 px-3">
            <div
              style={{
                height: state.isFixedHeight ? 536 : 'auto',
              }}
            >
              {!state.isFetching && (
                <Paper>
                  <Table>
                    <Head />
                    <TableBody>
                      {state.transactions.map((t, index) => (
                        <TableRow key={t.transactions_trx_id || index}>
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
                          <TableCell>
                            <span
                              className="text-indigo-400 cursor-pointer"
                              onClick={() => Block.open(t.block_num)}
                            >
                              {t.block_num}
                            </span>
                          </TableCell>
                          <TableCell>已完成</TableCell>
                          <TableCell>
                            {moment(t.timestamp).format('yyyy-MM-DD HH:mm')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
              {!state.isFetching &&
                state.page > 0 &&
                state.transactions.length === 0 && (
                  <div className="pt-64">
                    <div className="text-center text-gray-af text-14">
                      没有更多了~
                    </div>
                  </div>
                )}
              {state.isFetching && (
                <div className="pt-64">
                  <Loading />
                </div>
              )}
            </div>
            <div className="flex text-28 pt-4 justify-center text-gray-d8">
              <div
                className={classNames(
                  {
                    'cursor-pointer text-indigo-400': state.page > 0,
                  },
                  'p-2'
                )}
                onClick={() => state.page > 0 && goPrev()}
              >
                <BsArrowLeftShort />
              </div>
              <div className="px-1" />
              <div
                className={classNames(
                  {
                    'cursor-pointer text-indigo-400': state.hasMore,
                  },
                  'p-2'
                )}
                onClick={() => state.hasMore && goNext()}
              >
                <BsArrowRightShort />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
