import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action } from 'mobx';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import Loading from 'components/Loading';
import MVMApi, { ICoin } from 'apis/mvm';
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';
import formatAmount from 'utils/formatAmount';
import openDepositModal from 'standaloneModals/wallet/openDepositModal';
import getKeyName from 'utils/getKeyName';
import KeystoreApi from 'apis/keystore';
import {
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Select,
  MenuItem,
} from '@material-ui/core';
import inputFinanceAmount from 'utils/inputFinanceAmount';

export default observer(() => {
  const { snackbarStore, confirmDialogStore, nodeStore, notificationSlideStore } = useStore();
  const group = useActiveGroup();
  const groupId = group.group_id;
  const intGroupId = Contract.uuidToBigInt(groupId);
  const state = useLocalObservable(() => ({
    fetched: false,
    paying: false,
    amount: '',
    rumSymbol: '',
    coins: [] as ICoin[],
    oldAmount: '',
    oldRumSymbol: '',

    get coin() {
      return this.coins.find((coin) => coin.rumSymbol === state.rumSymbol)!;
    },
    gasLimit: ethers.BigNumber.from(1000000),
    gasPrice: ethers.BigNumber.from(0),
    invokeFee: ethers.BigNumber.from(0),
    paid: false,
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const res = await MVMApi.coins();
        state.coins = Object.values(res.data).filter((coin) => coin.rumSymbol !== 'RUM') as ICoin[];

        const contract = new ethers.Contract(Contract.PAID_GROUP_CONTRACT_ADDRESS, Contract.PAID_GROUP_ABI, Contract.provider);
        const groupDetail = await contract.getPrice(intGroupId);

        state.oldAmount = formatAmount(ethers.utils.formatEther(groupDetail.amount));
        state.oldRumSymbol = state.coins.find((coin) => coin.rumAddress === groupDetail.tokenAddr)?.rumSymbol || '';

        const gasPrice = await Contract.provider.getGasPrice();
        state.gasPrice = gasPrice;

        const ret = await contract.getDappInfo();
        state.invokeFee = ret.invokeFee;

        state.fetched = true;
      } catch (e: any) {
        let message = e?.error?.reason || e?.error?.message || e?.message || lang.somethingWrong;
        if (e.body) {
          try {
            console.log(JSON.parse(e.body).error.message);
            message = JSON.parse(e.body).error.message;
          } catch {}
        }
        console.log(message);
        snackbarStore.show({
          message,
          type: 'error',
        });
      }
    })();
  }, []);

  const handlePaidGroup = async () => {
    if (state.paying) {
      return;
    }
    console.log('paid');
    state.paying = true;
    try {
      const balanceWEI = await Contract.provider.getBalance(group.user_eth_addr);
      const balanceETH = ethers.utils.formatEther(balanceWEI);
      if (+ethers.utils.formatEther(state.gasLimit.mul(state.gasPrice).add(state.invokeFee)) > +balanceETH) {
        confirmDialogStore.show({
          content: `您的 RUM 不足 ${ethers.utils.formatEther(state.gasLimit.mul(state.gasPrice).add(state.invokeFee))}`,
          okText: '去充值',
          ok: async () => {
            confirmDialogStore.hide();
            await sleep(300);
            openDepositModal({
              rumSymbol: 'RUM',
            });
          },
        });
        state.paying = false;
        return;
      }
      const contract = new ethers.Contract(Contract.PAID_GROUP_CONTRACT_ADDRESS, Contract.PAID_GROUP_ABI, Contract.provider);
      const data = contract.interface.encodeFunctionData('addPrice', [
        Contract.uuidToBigInt(groupId),
        99999999,
        state.coin.rumAddress,
        ethers.utils.parseEther(state.amount),
      ]);
      const [keyName, nonce, gasPrice, network] = await Promise.all([
        getKeyName(nodeStore.storagePath, group.user_eth_addr),
        Contract.provider.getTransactionCount(group.user_eth_addr, 'pending'),
        Contract.provider.getGasPrice(),
        Contract.provider.getNetwork(),
      ]);
      if (!keyName) {
        state.paying = false;
        snackbarStore.show({
          message: lang.keyNotFound,
          type: 'error',
        });
        return;
      }
      const { data: signedTrx } = await KeystoreApi.signTx({
        keyname: keyName,
        nonce,
        to: Contract.PAID_GROUP_CONTRACT_ADDRESS,
        value: state.invokeFee.toHexString(),
        gas_limit: 300000,
        gas_price: gasPrice.toHexString(),
        data,
        chain_id: String(network.chainId),
      });
      console.log('signTx done');
      const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
      console.log('send done');
      notificationSlideStore.show({
        message: '正在设置',
        type: 'pending',
        link: {
          text: '查看详情',
          url: Contract.getExploreTxUrl(txHash),
        },
      });
      await Contract.provider.waitForTransaction(txHash);
      const receipt = await Contract.provider.getTransactionReceipt(txHash);
      console.log('receit done');
      if (receipt.status === 0) {
        state.paying = false;
        notificationSlideStore.show({
          message: '设置失败',
          type: 'failed',
          link: {
            text: '查看详情',
            url: Contract.getExploreTxUrl(txHash),
          },
        });
        return;
      }
      notificationSlideStore.show({
        message: '设置成功',
        duration: 5000,
        link: {
          text: '查看详情',
          url: Contract.getExploreTxUrl(txHash),
        },
      });
      state.paying = false;
      state.paid = true;
      return;
    } catch (e: any) {
      let message = e?.error?.reason || e?.error?.message || e?.message || lang.somethingWrong;
      if (e.body) {
        try {
          console.log(JSON.parse(e.body).error.message);
          message = JSON.parse(e.body).error.message;
        } catch {}
      }
      console.log(message);
      state.paying = false;
      if (message.includes('insufficient funds for gas * price + value')) {
        message = lang.insufficientRum;
      }
      snackbarStore.show({
        message,
        type: 'error',
      });
    }
  };

  if (!state.fetched) {
    return (<div className="pt-40 flex justify-center">
      <Loading />
    </div>);
  }

  return (
    <div className="mt-32 mx-auto">
      {+state.oldAmount === 0 && (
        <>
          <div className="text-16 mb-4 font-medium">使此付费群组生效，还需要设置付费合约信息:</div>
          <div className="py-4">
            <FormControl
              className="w-full text-left"
              size="small"
              variant="outlined"
            >
              <InputLabel>选择币种</InputLabel>
              <Select
                value={state.rumSymbol}
                label="选择币种"
                onChange={action((e) => {
                  state.rumSymbol = e.target.value as string;
                  state.amount = '';
                })}
              >
                {state.coins.map((coin) => (
                  <MenuItem key={coin.rumSymbol} value={coin.rumSymbol} className="flex items-center leading-none">{coin.rumSymbol}
                    <span className="ml-1 opacity-40 text-12">- {coin.name}</span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className="pt-2 leading-relaxed">
            <div>
              <div className="flex items-center justify-between">
                {lang.payableTip}
                <OutlinedInput
                  className="ml-2 w-40"
                  margin="dense"
                  value={state.amount}
                  onChange={(e) => {
                    const amount = inputFinanceAmount(e.target.value);
                    if (amount !== null) {
                      state.amount = amount;
                    }
                  }}
                  spellCheck={false}
                  endAdornment={<InputAdornment position="end">{state.coin?.rumSymbol || '-'}</InputAdornment>}
                />
              </div>
              <div className="mt-3 text-gray-bd text-14">
                {lang.createPaidGroupFeedTip(ethers.utils.formatEther(state.gasLimit.mul(state.gasPrice).add(state.invokeFee)), 'RUM')}
              </div>
            </div>
          </div>

          <Button
            className="mx-auto block mt-4"
            onClick={handlePaidGroup}
            isDoing={state.paying}
            disabled={state.paid}
          >
            {lang.yes}
          </Button>
        </>
      )}
    </div>
  );
});
