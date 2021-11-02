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
import { divide, add } from 'mathjs';
import Tooltip from '@material-ui/core/Tooltip';

export default observer(() => {
  const {
    modalStore,
    confirmDialogStore,
    walletStore,
    accountStore,
    snackbarStore,
  } = useStore();
  const { account } = accountStore;
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

  const cancelTicket = () => {
    if (!accountStore.isLogin) {
      modalStore.auth.show();
      return;
    }
    modalStore.payment.show({
      title: '撤掉资源，换回 PRS',
      useBalance: true,
      balanceAmount: Finance.toString(
        add(
          Finance.toNumber(
            account.total_resources.cpu_weight.replace(' SRP', '')
          ),
          Finance.toNumber(
            account.total_resources.net_weight.replace(' SRP', '')
          )
        )
      ),
      balanceText: '可换回的 PRS 数量',
      memoDisabled: true,
      currency: 'PRS',
      pay: async (privateKey: string, accountName: string, amount: any) => {
        await PrsAtm.fetch({
          id: 'atm.delegate',
          actions: ['atm', 'undelegate'],
          args: [
            accountName,
            accountName,
            divide(amount, 2).toString(),
            divide(amount, 2).toString(),
            privateKey,
          ],
          minPending: 1500,
        });
        return '';
      },
      done: async () => {
        await sleep(500);
        confirmDialogStore.show({
          content:
            '这个操作正在上链，等待确认中，预计 3-5 分钟后完成。你可以前往【我的账号】页面查看 PRS 资产',
          okText: '我知道了',
          ok: () => confirmDialogStore.hide(),
          cancelDisabled: true,
        });
      },
    });
  };

  const buyTicket = () => {
    if (!accountStore.isLogin) {
      modalStore.auth.show();
      return;
    }
    modalStore.payment.show({
      title: '抵押 PRS 换取选票',
      useBalance: true,
      balanceAmount: walletStore.balance.PRS,
      balanceText: '余额',
      memoDisabled: true,
      currency: 'PRS',
      pay: async (privateKey: string, accountName: string, amount: any) => {
        await PrsAtm.fetch({
          id: 'atm.delegate',
          actions: ['atm', 'delegate'],
          args: [
            accountName,
            accountName,
            divide(amount, 2).toString(),
            divide(amount, 2).toString(),
            privateKey,
          ],
          minPending: 1500,
        });
        return '';
      },
      done: async () => {
        await sleep(500);
        confirmDialogStore.show({
          content:
            '这个操作正在上链，等待确认中，预计 3-5 分钟后完成。你可以前往【我的账号 > 基本信息】查看抵押所获得的资源（cpu 和 net）',
          okText: '我知道了',
          ok: () => confirmDialogStore.hide(),
          cancelDisabled: true,
        });
      },
    });
  };

  const vote = () => {
    confirmDialogStore.show({
      content: `给这 ${
        state.votedNames.length
      } 个节点投票<br />${state.votedNames.join('，')}`,
      okText: '确定',
      ok: () => {
        modalStore.verification.show({
          pass: async (privateKey: string, accountName: string) => {
            confirmDialogStore.setLoading(true);
            try {
              await PrsAtm.fetch({
                id: 'ballot.vote',
                actions: ['ballot', 'vote'],
                args: [accountName, state.votedNames, '', privateKey],
                minPending: 600,
              });
              confirmDialogStore.hide();
              await sleep(500);
              snackbarStore.show({
                message: '投票成功',
              });
              state.voteMode = false;
              state.votedSet.clear();
            } catch (err) {
              console.log(err);
              snackbarStore.show({
                message: '投票失败了',
                type: 'error',
              });
            }
            confirmDialogStore.setLoading(false);
          },
        });
      },
      cancelDisabled: true,
    });
  };

  return (
    <Page title="节点投票" loading={!state.isFetched}>
      <div className="p-8 bg-white rounded-12 relative">
        <div className="absolute top-0 right-0 -mt-12 flex items-center">
          {!state.voteMode && (
            <Tooltip
              placement="bottom"
              title="撤掉等量的资源（cpu 和 net），换回 PRS"
              arrow
            >
              <div>
                <Button size="small" color="red" onClick={cancelTicket}>
                  退票
                </Button>
              </div>
            </Tooltip>
          )}
          {!state.voteMode && (
            <Tooltip
              placement="bottom"
              title="抵押 PRS 换取等量的资源（cpu 和 net），用于投票"
              arrow
            >
              <div className="ml-5">
                <Button size="small" color="green" onClick={buyTicket}>
                  取票
                </Button>
              </div>
            </Tooltip>
          )}
          {!state.voteMode && (
            <Tooltip
              placement="bottom"
              title="帮助节点提高排名，增加出块几率，节点获得出块奖励，你也将获得 PRS 分成收益"
              arrow
            >
              <div className="ml-5">
                <Button
                  size="small"
                  onClick={() => {
                    state.voteMode = true;
                  }}
                >
                  投票
                </Button>
              </div>
            </Tooltip>
          )}
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
          {state.voteMode && (
            <div className="ml-5">
              <Button
                size="small"
                onClick={() => state.votedNames.length > 0 && vote()}
                color={state.votedNames.length > 0 ? 'primary' : 'gray'}
              >
                确定
              </Button>
            </div>
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
