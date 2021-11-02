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
import { divide, add, subtract, bignumber } from 'mathjs';
import Tooltip from '@material-ui/core/Tooltip';
import { FaVoteYea } from 'react-icons/fa';
import BackToTop from 'components/BackToTop';
import { MdInfo, MdSearch } from 'react-icons/md';
import SearchInput from 'components/SearchInput';
import Fade from '@material-ui/core/Fade';

export default observer(() => {
  const {
    modalStore,
    confirmDialogStore,
    walletStore,
    accountStore,
    snackbarStore,
  } = useStore();
  const { account, isLogin } = accountStore;
  const state = useLocalStore(() => ({
    voteMode: false,
    isFetched: false,
    producers: [] as IProducer[],
    filterKeyword: '',
    showSearch: false,
    backToTopEnabled: false,
    get totalVotes() {
      return sum(this.producers.map((p) => p.total_votes));
    },
    votedSet: new Set(),
    get votedOwners() {
      return Array.from(this.votedSet);
    },
    addVotedSet: new Set(),
    get addVotedOwners() {
      return Array.from(this.addVotedSet);
    },
    removeVotedSet: new Set(),
    get removeVotedOwners() {
      return Array.from(this.removeVotedSet);
    },
  }));

  const fetchProducers = React.useCallback(() => {
    (async () => {
      const resp: any = await PrsAtm.fetch({
        actions: ['producer', 'getAll'],
      });
      const derivedProducers: any = resp.rows.map((row: any) => {
        row.total_votes = parseInt(row.total_votes, 10);
        return row;
      });
      state.producers = derivedProducers;
      if (accountStore.isLogin) {
        const ballotResult: any = await PrsAtm.fetch({
          actions: ['ballot', 'queryByOwner'],
          args: [account.account_name],
        });
        for (const owner of ballotResult.producers) {
          state.votedSet.add(owner);
        }
      }
      await sleep(800);
      state.isFetched = true;
      await sleep(2000);
      state.backToTopEnabled = true;
    })();
  }, []);

  React.useEffect(() => {
    fetchProducers();
  }, [fetchProducers, account]);

  const Head = () => {
    return (
      <TableHead>
        <TableRow>
          {isLogin && !state.voteMode && state.votedSet.size > 0 && (
            <TableCell>已投</TableCell>
          )}
          {state.voteMode && <TableCell>选择</TableCell>}
          <TableCell>排名</TableCell>
          <TableCell>名称</TableCell>
          <TableCell>获得投票数</TableCell>
          <TableCell>票数占比</TableCell>
          <TableCell>待领取区块数</TableCell>
          <TableCell>类型</TableCell>
          <TableCell>最近一次领取</TableCell>
        </TableRow>
      </TableHead>
    );
  };

  const cancelTicket = () => {
    if (!isLogin) {
      modalStore.auth.show();
      return;
    }
    modalStore.payment.show({
      title: '撤掉资源，换回 PRS',
      useBalance: true,
      balanceAmount: Finance.toString(
        subtract(
          add(
            bignumber(account.total_resources.cpu_weight.replace(' SRP', '')),
            bignumber(account.total_resources.net_weight.replace(' SRP', ''))
          ),
          bignumber(4)
        )
      ),
      balanceText: '可换回的 PRS 数量',
      memoDisabled: true,
      currency: 'PRS',
      pay: async (privateKey: string, accountName: string, amount: any) => {
        await PrsAtm.fetch({
          actions: ['atm', 'undelegate'],
          args: [
            accountName,
            accountName,
            divide(bignumber(amount), bignumber(2)).toString(),
            divide(bignumber(amount), bignumber(2)).toString(),
            privateKey,
          ],
          minPending: 1500,
          logging: true,
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
        await sleep(2000);
        try {
          const balance: any = await PrsAtm.fetch({
            actions: ['account', 'getBalance'],
            args: [accountStore.account.account_name],
          });
          walletStore.setBalance(balance);
        } catch (err) {}
        try {
          const account: any = await PrsAtm.fetch({
            actions: ['atm', 'getAccount'],
            args: [accountStore.account.account_name],
          });
          accountStore.setAccount(account);
        } catch (err) {}
      },
    });
  };

  const buyTicket = () => {
    if (!isLogin) {
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
          actions: ['atm', 'delegate'],
          args: [
            accountName,
            accountName,
            divide(amount, 2).toString(),
            divide(amount, 2).toString(),
            privateKey,
          ],
          minPending: 1500,
          logging: true,
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
        await sleep(2000);
        try {
          const balance: any = await PrsAtm.fetch({
            actions: ['account', 'getBalance'],
            args: [accountStore.account.account_name],
          });
          walletStore.setBalance(balance);
        } catch (err) {}
        try {
          const account: any = await PrsAtm.fetch({
            actions: ['atm', 'getAccount'],
            args: [accountStore.account.account_name],
          });
          accountStore.setAccount(account);
        } catch (err) {}
      },
    });
  };

  const vote = () => {
    if (!isLogin) {
      modalStore.auth.show();
      return;
    }
    confirmDialogStore.show({
      content: `把票投给 ${
        state.addVotedOwners.length
      } 个节点<br />${state.addVotedOwners.join('，')}`,
      okText: '确定',
      ok: () => {
        modalStore.verification.show({
          pass: async (privateKey: string, accountName: string) => {
            confirmDialogStore.setLoading(true);
            try {
              if (!accountStore.isProducer) {
                const resp: any = await PrsAtm.fetch({
                  actions: ['producer', 'register'],
                  args: [
                    accountName,
                    '',
                    '',
                    accountStore.publicKey,
                    privateKey,
                  ],
                  logging: true,
                });
                console.log({ resp });
              }
              await PrsAtm.fetch({
                actions: ['ballot', 'vote'],
                args: [
                  accountName,
                  state.addVotedOwners,
                  state.removeVotedOwners,
                  privateKey,
                ],
                minPending: 600,
                logging: true,
              });
              confirmDialogStore.hide();
              await sleep(500);
              snackbarStore.show({
                message: '投票成功',
              });
              state.votedSet.clear();
              for (const owner of state.addVotedOwners) {
                state.votedSet.add(owner);
              }
              state.voteMode = false;
              state.addVotedSet.clear();
              state.removeVotedSet.clear();
              (async () => {
                await sleep(500);
                fetchProducers();
              })();
            } catch (err) {
              console.log(err.message);
              snackbarStore.show({
                message: '投票失败了',
                type: 'error',
              });
            }
            confirmDialogStore.setLoading(false);
          },
        });
      },
    });
  };

  return (
    <Page title="节点投票" loading={!state.isFetched}>
      <div className="px-6 py-6 bg-white rounded-12 relative">
        <div className="absolute top-0 right-0 -mt-12 flex items-center h-8">
          {!state.showSearch && (
            <Tooltip
              placement="bottom"
              title="采用 DPOS 机制。由持币人抵押 PRS 为系统提供 cpu 和 net，并选出稳定可靠的出块节点。最多可投 30 个节点。由 PRS 官方基金会为节点提供一定的补贴。首年补贴总额 540 万 PRS"
            >
              <div className="mr-6 text-gray-af text-12 flex items-center mt-3-px">
                <MdInfo className="text-18 text-gray-bf" />
                排名前 21 名将成为出块节点
              </div>
            </Tooltip>
          )}
          {!state.showSearch && (
            <div
              className="flex items-center px-3 mr-3 text-indigo-400 mt-2-px cursor-pointer"
              onClick={() => {
                state.showSearch = true;
              }}
            >
              <MdSearch className="text-24" />
            </div>
          )}
          {state.showSearch && (
            <Fade in={true} timeout={500}>
              <div className="mr-6">
                <SearchInput
                  className="w-46"
                  placeholder="输入节点名称"
                  size="small"
                  search={(keyword: string) => {
                    state.filterKeyword = keyword;
                  }}
                />
              </div>
            </Fade>
          )}
          {!state.voteMode && (
            <Tooltip
              placement="bottom"
              title="撤掉等量的资源（cpu 和 net），换回 PRS，该申请需等待 72 小时后生效"
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
                  换票
                </Button>
              </div>
            </Tooltip>
          )}
          {!state.voteMode && (
            <Tooltip
              placement="bottom"
              title="PRS持有者参与社区决策，选出稳定可靠的出块节点。最少可投 1 个，最多 30 个节点，可投自己。投票后将自动成为节点。节点可获得节点补贴（收益）。影响收益的因素：是否为出块节点，cpu + net的数值，获得投票数占比等"
              arrow
            >
              <div className="ml-5">
                <Button
                  size="small"
                  onClick={() => {
                    for (const owner of state.votedOwners) {
                      state.addVotedSet.add(owner);
                    }
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
              size="small"
              outline
              onClick={() => {
                state.voteMode = false;
                state.addVotedSet.clear();
                state.removeVotedSet.clear();
              }}
            >
              取消
            </Button>
          )}
          {state.voteMode && (
            <div className="ml-5">
              <Button
                size="small"
                onClick={() => state.addVotedOwners.length > 0 && vote()}
                color={state.addVotedOwners.length > 0 ? 'primary' : 'gray'}
              >
                确定
              </Button>
            </div>
          )}
        </div>
        <div className="table-container overflow-y-auto">
          <Paper>
            <Table>
              <Head />
              <TableBody>
                {state.producers
                  .filter((p) => {
                    if (!state.filterKeyword) {
                      return true;
                    }
                    return p.owner.includes(state.filterKeyword);
                  })
                  .map((p, index) => {
                    if (!p.is_active) {
                      return null;
                    }
                    return (
                      <TableRow
                        key={p.last_claim_time + index}
                        className={classNames({
                          'cursor-pointer active-hover': state.voteMode,
                          'border-b-4 border-indigo-300': index + 1 === 21,
                        })}
                        onClick={() => {
                          if (state.addVotedSet.has(p.owner)) {
                            state.addVotedSet.delete(p.owner);
                            if (state.votedSet.has(p.owner)) {
                              state.removeVotedSet.add(p.owner);
                            }
                          } else {
                            state.addVotedSet.add(p.owner);
                            state.removeVotedSet.delete(p.owner);
                          }
                        }}
                      >
                        {isLogin && !state.voteMode && state.votedSet.size > 0 && (
                          <TableCell>
                            {state.votedSet.has(p.owner) && (
                              <Tooltip
                                placement="top"
                                title="你给这个节点投了票，如需修改，可点击【投票】按钮，重新勾选节点，再投一次"
                                arrow
                              >
                                <div>
                                  <FaVoteYea className="text-indigo-400 text-24" />
                                </div>
                              </Tooltip>
                            )}
                          </TableCell>
                        )}
                        {state.voteMode && (
                          <TableCell>
                            <div className="pr-4">
                              <Checkbox
                                color="primary"
                                size="small"
                                checked={state.addVotedSet.has(p.owner)}
                              />
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="h-6 flex items-center">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-gray-4a">
                            {p.owner}
                          </span>
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
                          {index + 1 <= 21 && (
                            <Tooltip
                              placement="top"
                              title="排名前21自动成为出块节点"
                              arrow
                            >
                              <div>出块节点</div>
                            </Tooltip>
                          )}
                          {index + 1 > 21 && (
                            <Tooltip
                              placement="top"
                              title="需要完成服务器操作，保证节点能够正常出块，才有机会投票进入21名"
                              arrow
                            >
                              <div>候选节点</div>
                            </Tooltip>
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
        </div>
        {state.backToTopEnabled && (
          <BackToTop
            element={document.querySelector('.table-container') as HTMLElement}
          />
        )}
        <style jsx>{`
          .table-container {
            height: calc(100vh - 135px);
          }
        `}</style>
      </div>
    </Page>
  );
});
