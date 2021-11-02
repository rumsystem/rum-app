import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { PrsAtm, Finance, Block } from 'utils';
import { useStore } from 'store';
import Loading from 'components/Loading';
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
import classNames from 'classnames';

interface ITransaction {
  block: any;
  block_id: string;
  block_num: number;
  currency: string;
  detail: string;
  previous: string;
  producer: string;
  status: string;
  timestamp: string;
  transactions_trx_id: string;
  transactions_trx_transaction_actions_account: string;
  transactions_trx_transaction_actions_data__amount_quantity__amt: string;
  transactions_trx_transaction_actions_data__amount_quantity__cur: string;
  transactions_trx_transaction_actions_data__dp_wd_req__id: string;
  transactions_trx_transaction_actions_data__from_user: string;
  transactions_trx_transaction_actions_data__sync_auth__result: boolean;
  transactions_trx_transaction_actions_data__to_user: string;
  transactions_trx_transaction_actions_data_data: any;
  transactions_trx_transaction_actions_data_data_topic: string;
  transactions_trx_transaction_actions_data_id: string;
  transactions_trx_transaction_actions_data_meta: any;
  transactions_trx_transaction_actions_data_mixin_trace_id: string;
  transactions_trx_transaction_actions_data_oracleservice: string;
  transactions_trx_transaction_actions_data_type: string;
  transactions_trx_transaction_actions_data_user_address: string;
  transactions_trx_transaction_actions_name: string;
  type: string;
}

const Head = () => {
  return (
    <TableHead>
      <TableRow>
        <TableCell>类型</TableCell>
        <TableCell>数量</TableCell>
        <TableCell>资产</TableCell>
        <TableCell>区块</TableCell>
        <TableCell>状态</TableCell>
        <TableCell>时间</TableCell>
        <TableCell>备注</TableCell>
      </TableRow>
    </TableHead>
  );
};

const typeNameMap: any = {
  TRANSFER: '转账',
  DEPOSIT: '转入',
  WITHDRAW: '转出',
  REWARD: '收益',
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
          id: 'deposit',
          actions: ['statement', 'query'],
          args: [
            accountStore.account.account_name,
            state.timestamp,
            null,
            LIMIT,
          ],
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
    <div className="bg-white rounded-12 text-gray-6d">
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
                      {state.transactions.map((t, index) => {
                        let memo = '';
                        try {
                          memo =
                            t.transactions_trx_transaction_actions_data_meta
                              .request.memo;
                        } catch (err) {}
                        const dataType =
                          t.transactions_trx_transaction_actions_data_type ||
                          '';
                        return (
                          <TableRow
                            key={
                              t.transactions_trx_transaction_actions_data_mixin_trace_id ||
                              index
                            }
                          >
                            <TableCell>
                              <div
                                className={
                                  t.type === 'INCOME'
                                    ? 'text-green-500'
                                    : 'text-red-400'
                                }
                              >
                                {typeNameMap[dataType] || dataType}
                              </div>
                            </TableCell>
                            <TableCell>
                              {Finance.toString(
                                t.transactions_trx_transaction_actions_data__amount_quantity__amt
                              )}{' '}
                            </TableCell>
                            <TableCell>{t.currency}</TableCell>
                            <TableCell>
                              <span
                                className="text-indigo-400 cursor-pointer"
                                onClick={() => Block.open(t.block_num)}
                              >
                                {t.block_num}
                              </span>
                            </TableCell>
                            <TableCell>
                              {t.status === 'SUCCESS' ? '已完成' : t.status}
                            </TableCell>
                            <TableCell>
                              {moment(t.timestamp).format('yyyy-MM-DD HH:mm')}
                            </TableCell>
                            <TableCell>{memo}</TableCell>
                          </TableRow>
                        );
                      })}
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
            {state.cachedPagination[0] &&
              state.cachedPagination[0].length === LIMIT && (
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
              )}
          </div>
        )}
      </div>
    </div>
  );
});
