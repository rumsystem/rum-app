import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Page from 'components/Page';
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Checkbox,
} from '@material-ui/core';
import { sleep, PrsAtm, Finance } from 'utils';
import moment from 'moment';
import { sum } from 'lodash';
import { IProducer } from 'types';
import Button from 'components/Button';
import classNames from 'classnames';
import { useStore } from 'store';
import { divide } from 'mathjs';

export default observer(() => {
  const { modalStore, snackbarStore } = useStore();
  const state = useLocalStore(() => ({
    voteMode: false,
    isFetched: false,
    producers: [] as IProducer[],
    get totalVotes() {
      return sum(this.producers.map((p) => p.total_votes));
    },
    votedSet: new Set(),
    get votedNames() {
      return Array.from(this.votedSet);
    },
  }));

  React.useEffect(() => {
    (async () => {
      const resp: any = await PrsAtm.fetch({
        id: 'getProducers',
        actions: ['producer', 'getAll'],
      });
      const derivedProducers: any = resp.rows.map((row: any) => {
        row.total_votes = parseInt(row.total_votes, 10);
        return row;
      });
      state.producers = derivedProducers;
      await sleep(1000);
      state.isFetched = true;
    })();
  }, []);

  const Head = () => {
    return (
      <TableHead>
        <TableRow>
          {state.voteMode && <TableCell>选择</TableCell>}
          <TableCell>排名</TableCell>
          <TableCell>名称</TableCell>
          <TableCell>票数</TableCell>
          <TableCell>票数占比</TableCell>
          <TableCell>待领取区块数</TableCell>
          <TableCell>状态</TableCell>
          <TableCell>最近一次领取</TableCell>
        </TableRow>
      </TableHead>
    );
  };

  const buyTicket = () => {
    modalStore.payment.show({
      title: '用 PRS 购买选票',
      currency: 'PRS',
      getPaymentUrl: async (
        privateKey: string,
        accountName: string,
        amount: any
      ) => {
        // try {
        //   await PrsAtm.fetch({
        //     id: 'cancelPaymentRequest',
        //     actions: ['atm', 'cancelPaymentRequest'],
        //     args: [privateKey, accountName],
        //   });
        // } catch (err) {}
        const resp: any = await PrsAtm.fetch({
          id: 'atm.delegate',
          actions: ['atm', 'delegate'],
          args: [
            accountName,
            accountName,
            divide(amount, 2).toString(),
            divide(amount, 2).toString(),
            privateKey,
          ],
        });
        console.log({ resp });
        return resp.paymentUrl;
      },
      checkResult: async (accountName: string, amount: string) => {
        // const newBalance: any = await PrsAtm.fetch({
        //   id: 'getBalance',
        //   actions: ['account', 'getBalance'],
        //   args: [accountName],
        // });
        // const comparedAmount = add(
        //   bignumber(balance[state.currency]),
        //   bignumber(amount)
        // );
        // const isDone = equal(
        //   bignumber(newBalance[state.currency]),
        //   comparedAmount
        // );
        // if (isDone) {
        //   walletStore.setBalance(newBalance);
        // }
        // return isDone;
      },
      done: async () => {
        await sleep(1500);
        snackbarStore.show({
          message: '资产转入成功，流水账单将在 3-5 分钟之后生成',
          duration: 3000,
        });
      },
    });
  };

  return (
    <Page title="节点投票" loading={!state.isFetched}>
      <div className="p-8 bg-white rounded-12 relative">
        <div className="absolute top-0 right-0 -mt-12 flex">
          {!state.voteMode && (
            <Button size="small" color="green" onClick={buyTicket}>
              取票
            </Button>
          )}
          <Button
            className="ml-5"
            size="small"
            onClick={() => {
              state.voteMode = true;
            }}
          >
            {state.voteMode ? '确定' : '投票'}
          </Button>
          {state.voteMode && (
            <Button
              className="ml-5"
              size="small"
              outline
              onClick={() => {
                state.voteMode = false;
                state.votedSet.clear();
              }}
            >
              取消
            </Button>
          )}
        </div>
        <Paper>
          <Table>
            <Head />
            <TableBody>
              {state.producers.map((p, index) => {
                return (
                  <TableRow
                    key={p.last_claim_time}
                    className={classNames({
                      'cursor-pointer active-hover': state.voteMode,
                    })}
                    onClick={() => {
                      if (state.votedSet.has(p.owner)) {
                        state.votedSet.delete(p.owner);
                      } else {
                        state.votedSet.add(p.owner);
                      }
                    }}
                  >
                    {state.voteMode && (
                      <TableCell>
                        <div className="pr-4">
                          <Checkbox
                            color="primary"
                            size="small"
                            checked={state.votedSet.has(p.owner)}
                          />
                        </div>
                      </TableCell>
                    )}
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <span className="font-bold text-gray-4a">{p.owner}</span>
                    </TableCell>
                    <TableCell>{p.total_votes || '-'}</TableCell>
                    <TableCell>
                      {Math.floor(
                        (p.total_votes / state.totalVotes) * 1000000
                      ) / 10000}
                      %
                    </TableCell>
                    <TableCell>{p.unpaid_blocks || '-'}</TableCell>
                    <TableCell>
                      {p.is_active ? (
                        '正常'
                      ) : (
                        <span className="text-red-400">停止</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {moment(p.last_claim_time).format('yyyy-MM-DD HH:mm')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
        <style jsx>{`
          .drawer {
            margin-left: 200px;
          }
        `}</style>
      </div>
    </Page>
  );
});
