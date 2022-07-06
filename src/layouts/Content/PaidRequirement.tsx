import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import useActiveGroup from 'store/selectors/useActiveGroup';
import UserApi from 'apis/user';
import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import Loading from 'components/Loading';
import { shell } from '@electron/remote';
import MVMApi, { ICoin } from 'apis/mvm';
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';
import formatAmount from 'utils/formatAmount';
import openDepositModal from 'standaloneModals/wallet/openDepositModal';

const USER_PAID_FOR_GROUP_MAP_KEY = 'userPaidForGroupMap';
const USER_ANNOUNCED_RECORDS_KEY = 'userAnnouncedRecords';

export default observer(() => {
  const { snackbarStore, confirmDialogStore } = useStore();
  const group = useActiveGroup();
  const groupId = group.group_id;
  const intGroupId = ethers.BigNumber.from('0x' + groupId.replace(/-/g, ''));
  const state = useLocalObservable(() => ({
    fetched: false,
    paying: false,
    userPaidForGroupMap: (ElectronCurrentNodeStore.getStore().get(USER_PAID_FOR_GROUP_MAP_KEY) || {}) as any,
    amount: 0,
    paid: false,
    assetSymbol: '',
    coins: [] as ICoin[],
    balanceMap: {} as Record<string, string>,

    get transactionUrl() {
      return this.userPaidForGroupMap[groupId];
    },
    get coin() {
      return this.coins.find((coin) => coin.symbol === state.assetSymbol)!;
    },
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const res = await MVMApi.coins();
        state.coins = Object.values(res.data);

        const balances = await Promise.all(state.coins.map(async (coin) => {
          const contract = new ethers.Contract(coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
          const balance = await contract.balanceOf(group.user_eth_addr);
          return ethers.utils.formatEther(balance);
        }));
        for (const [index, coin] of state.coins.entries()) {
          state.balanceMap[coin.symbol] = formatAmount(balances[index]);
        }

        const contract = new ethers.Contract(Contract.PAID_GROUP_CONTRACT_ADDRESS, Contract.PAID_GROUP_ABI, Contract.provider);
        const groupDetail = await contract.getPrice(intGroupId);

        state.amount = parseInt(ethers.utils.formatEther(groupDetail.amount) || '', 10);
        state.assetSymbol = state.coins.find((coin) => coin.rumAddress === groupDetail.tokenAddr)?.symbol || '';

        const paid = await contract.isPaid(group.user_eth_addr, intGroupId);
        state.paid = paid;
        if (paid) {
          await announce(groupId, group.user_eth_addr);
        }
      } catch (err) {
        console.log(err);
      }
      state.fetched = true;
    })();
  }, []);

  const handlePay = async () => {
    state.paying = true;
    try {
      const contract = new ethers.Contract(Contract.PAID_GROUP_CONTRACT_ADDRESS, Contract.PAID_GROUP_ABI, Contract.provider);
      const paid = await contract.isPaid(group.user_eth_addr, intGroupId);
      if (paid) {
        await announce(groupId, group.user_eth_addr);
        state.paid = true;
        state.paying = false;
        return;
      }
      if (+state.amount > +state.balanceMap[state.assetSymbol]) {
        confirmDialogStore.show({
          content: `您的余额不足 ${state.amount} ${state.assetSymbol}`,
          okText: '去充值',
          ok: async () => {
            confirmDialogStore.hide();
            await sleep(300);
            openDepositModal({
              symbol: state.assetSymbol,
            });
          },
        });
        state.paying = false;
        return;
      }
      confirmDialogStore.show({
        content: `确定支付 ${state.amount} ${state.assetSymbol} 吗？`,
        ok: async () => {
          if (confirmDialogStore.loading) {
            return;
          }
          confirmDialogStore.setLoading(true);
          await Contract.getFee(group.user_eth_addr);
          console.log('should after get fee done');
          const contract = new ethers.Contract(state.coin.rumAddress, Contract.RUM_ERC20_ABI, Contract.provider);
          const data = contract.interface.encodeFunctionData('rumTransfer', [
            state.recipient,
            ethers.utils.parseEther(state.amount),
            `${uuid} ${uuidV1()}`,
          ]);
          const [keyName, nonce, gasPrice, network] = await Promise.all([
            getKeyName(nodeStore.storagePath, activeGroup.user_eth_addr),
            Contract.provider.getTransactionCount(activeGroup.user_eth_addr, 'pending'),
            Contract.provider.getGasPrice(),
            Contract.provider.getNetwork(),
          ]);
          if (!keyName) {
            console.log('keyName not found');
            return;
          }
          const { data: signedTrx } = await KeystoreApi.signTx({
            keyname: keyName,
            nonce,
            to: state.coin.rumAddress,
            value: '0',
            gas_limit: 300000,
            gas_price: gasPrice.toHexString(),
            data,
            chain_id: String(network.chainId),
          });
          const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
          confirmDialogStore.hide();
          props.close();
          notificationSlideStore.show({
            message: '正在打赏',
            type: 'pending',
            link: {
              text: '查看详情',
              url: Contract.getExploreTxUrl(txHash),
            },
          });
          await Contract.provider.waitForTransaction(txHash);
          const receipt = await Contract.provider.getTransactionReceipt(txHash);
          if (receipt.status === 0) {
            notificationSlideStore.show({
              message: '打赏失败',
              type: 'failed',
              link: {
                text: '查看详情',
                url: Contract.getExploreTxUrl(txHash),
              },
            });
          } else {
            notificationSlideStore.show({
              message: '打赏成功',
              duration: 5000,
              link: {
                text: '查看详情',
                url: Contract.getExploreTxUrl(txHash),
              },
            });
          }
        },
      });
      if (transactionUrl) {
        await announce(groupId, group.user_eth_addr);
        await sleep(400);
        state.userPaidForGroupMap[groupId] = transactionUrl;
        ElectronCurrentNodeStore.getStore().set(USER_PAID_FOR_GROUP_MAP_KEY, state.userPaidForGroupMap);
        state.paid = true;
      }
    } catch (err) {
      snackbarStore.show({
        message: lang.somethingWrong,
        type: 'error',
      });
    }
    state.paying = false;
  };

  const announce = async (groupId: string, userAddress: string) => {
    const announceRet = await UserApi.announce({
      group_id: groupId,
      action: 'add',
      type: 'user',
      memo: userAddress,
    });
    console.log({ announceRet });
    const userAnnouncedRecords = (ElectronCurrentNodeStore.getStore().get(USER_ANNOUNCED_RECORDS_KEY) || []) as any;
    userAnnouncedRecords.push(announceRet);
    ElectronCurrentNodeStore.getStore().set(USER_ANNOUNCED_RECORDS_KEY, userAnnouncedRecords);
  };

  if (!state.fetched) {
    return (<div className="pt-40 flex justify-center">
      <Loading />
    </div>);
  }

  return (
    <div className="mt-32 mx-auto">
      <div
        className="text-gray-70 text-center text-16 leading-loose tracking-wide"
      >
        {lang.thisIsAPaidGroup}
        <br />
        {lang.payAndUse(state.amount, state.assetSymbol)}
      </div>

      <Button
        className="mx-auto block mt-4"
        onClick={handlePay}
        isDoing={state.paying}
        disabled={state.paid}
      >
        {state.paid ? lang.paidSuccessfully : lang.pay}
      </Button>
      {state.paid && (
        <div className="flex items-center mt-3 justify-center">
          {state.transactionUrl && (
            <div
              className="text-12 text-blue-400 cursor-pointer mr-4"
              onClick={() => {
                shell.openExternal(state.transactionUrl);
              }}
            >
              {lang.paidTicket}
            </div>
          )}
          <div
            className="text-12 text-blue-400 cursor-pointer"
            onClick={async () => {
              await announce(groupId, group.user_eth_addr);
              snackbarStore.show({
                message: lang.announced,
              });
            }}
          >
            <span>
              {lang.announceAgain}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});
