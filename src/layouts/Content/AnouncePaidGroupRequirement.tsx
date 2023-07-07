import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import useActiveGroup from 'store/selectors/useActiveGroup';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import Loading from 'components/Loading';
import MVMApi, { ICoin } from 'apis/mvm';
import { Contract, formatEther, parseEther } from 'ethers';
import * as ContractUtils from 'utils/contract';
import formatAmount from 'utils/formatAmount';
import openDepositModal from 'standaloneModals/wallet/openDepositModal';
import getKeyName from 'utils/getKeyName';
import KeystoreApi from 'apis/keystore';
import { FormControl, InputLabel, OutlinedInput, InputAdornment, Select, MenuItem } from '@mui/material';
import inputFinanceAmount from 'utils/inputFinanceAmount';

export default observer(() => {
  const { snackbarStore, confirmDialogStore, nodeStore, notificationSlideStore } = useStore();
  const group = useActiveGroup();
  const groupId = group.group_id;
  const intGroupId = ContractUtils.uuidToBigInt(groupId);
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
    gasLimit: 1000000n,
    gasPrice: 0n,
    invokeFee: 0n,
    paid: false,
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const res = await MVMApi.coins();
        state.coins = Object.values(res.data).filter((coin) => coin.rumSymbol !== 'RUM') as ICoin[];

        const contract = new Contract(ContractUtils.PAID_GROUP_CONTRACT_ADDRESS, ContractUtils.PAID_GROUP_ABI, ContractUtils.provider);
        const groupDetail = await contract.getPrice(intGroupId);

        state.oldAmount = formatAmount(formatEther(groupDetail.amount));
        state.oldRumSymbol = state.coins.find((coin) => coin.rumAddress === groupDetail.tokenAddr)?.rumSymbol || '';

        const gasPrice = (await ContractUtils.provider.getFeeData()).gasPrice;
        state.gasPrice = gasPrice ?? 0n;

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
      const balanceWEI = await ContractUtils.provider.getBalance(group.user_eth_addr);
      const balanceETH = formatEther(balanceWEI);
      if (+formatEther(state.gasLimit * state.gasPrice + state.invokeFee) > +balanceETH) {
        confirmDialogStore.show({
          content: `您的 RUM 不足 ${formatEther(state.gasLimit * state.gasPrice + state.invokeFee)}`,
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
      const contract = new Contract(ContractUtils.PAID_GROUP_CONTRACT_ADDRESS, ContractUtils.PAID_GROUP_ABI, ContractUtils.provider);
      const data = contract.interface.encodeFunctionData(+state.oldAmount === 0 ? 'addPrice' : 'updatePrice', [
        ContractUtils.uuidToBigInt(groupId),
        99999999,
        state.coin.rumAddress,
        parseEther(state.amount),
      ]);
      const [keyName, nonce, gasPrice, network] = await Promise.all([
        getKeyName(nodeStore.storagePath, group.user_eth_addr),
        ContractUtils.provider.getTransactionCount(group.user_eth_addr, 'pending'),
        ContractUtils.provider.getFeeData().then((v) => v.gasPrice ?? 0n),
        ContractUtils.provider.getNetwork(),
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
        to: ContractUtils.PAID_GROUP_CONTRACT_ADDRESS,
        value: `0x${state.invokeFee.toString(16)}`,
        gas_limit: 300000,
        gas_price: `0x${gasPrice.toString(16)}`,
        data,
        chain_id: String(network.chainId),
      });
      console.log('signTx done');
      const txHash = await ContractUtils.provider.send('eth_sendRawTransaction', [signedTrx]);
      console.log('send done');
      notificationSlideStore.show({
        message: '正在设置',
        type: 'pending',
        link: {
          text: '查看详情',
          url: ContractUtils.getExploreTxUrl(txHash),
        },
      });
      await ContractUtils.provider.waitForTransaction(txHash);
      const receipt = await ContractUtils.provider.getTransactionReceipt(txHash);
      console.log('receit done');
      if (receipt?.status === 0) {
        state.paying = false;
        notificationSlideStore.show({
          message: '设置失败',
          type: 'failed',
          link: {
            text: '查看详情',
            url: ContractUtils.getExploreTxUrl(txHash),
          },
        });
        return;
      }
      notificationSlideStore.show({
        message: '设置成功',
        duration: 5000,
        link: {
          text: '查看详情',
          url: ContractUtils.getExploreTxUrl(txHash),
        },
      });
      state.paying = false;
      state.paid = true;
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
      {(+state.oldAmount === 0 || !state.oldRumSymbol) && (
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
                onChange={(e) => runInAction(() => {
                  state.rumSymbol = e.target.value;
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
                {lang.createPaidGroupFeedTip(formatEther(state.gasLimit * state.gasPrice + state.invokeFee), 'RUM')}
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
