import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { action } from 'mobx';
import Button from 'components/Button';
import sleep from 'utils/sleep';
import useActiveGroup from 'store/selectors/useActiveGroup';
import UserApi from 'apis/user';
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
  const { snackbarStore, confirmDialogStore, nodeStore } = useStore();
  const group = useActiveGroup();
  const groupId = group.group_id;
  const intGroupId = Contract.uuidToBigInt(groupId);
  const state = useLocalObservable(() => ({
    fetched: false,
    paying: false,
    amount: '0',
    paid: false,
    rumSymbol: '',
    coins: [] as ICoin[],

    get coin() {
      return this.coins.find((coin) => coin.rumSymbol === state.rumSymbol)!;
    },
    gasLimit: ethers.BigNumber.from(1000000),
    gasPrice: ethers.BigNumber.from(0),
    invokeFee: '',
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const res = await MVMApi.coins();
        state.coins = Object.values(res.data).filter((coin) => coin.rumSymbol !== 'RUM') as ICoin[];

        const contract = new ethers.Contract(Contract.PAID_GROUP_CONTRACT_ADDRESS, Contract.PAID_GROUP_ABI, Contract.provider);
        const groupDetail = await contract.getPrice(intGroupId);

        console.log(groupDetail);

        state.amount = formatAmount(ethers.utils.formatEther(groupDetail.amount));
        state.rumSymbol = state.coins.find((coin) => coin.rumAddress === groupDetail.tokenAddr)?.rumSymbol || '';

        const gasPrice = await Contract.provider.getGasPrice();
        state.gasPrice = gasPrice;

        const ret = await contract.getDappInfo();
        state.invokeFee = ethers.utils.formatEther(ret.invokeFee);

        const paid = await contract.isPaid(group.user_eth_addr, intGroupId);
        state.paid = paid;
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
    console.log('paid');
    try {
      const balanceWEI = await Contract.provider.getBalance(group.user_eth_addr);
      const balanceETH = ethers.utils.formatEther(balanceWEI);
      if (+ethers.utils.formatEther(state.gasLimit.mul(state.gasPrice)) > +balanceETH) {
        confirmDialogStore.show({
          content: `您的 *RUM 不足 ${ethers.utils.formatEther(state.gasLimit.mul(state.gasPrice))}`,
          okText: '去充值',
          ok: async () => {
            confirmDialogStore.hide();
            await sleep(300);
            openDepositModal({
              rumSymbol: 'RUM',
            });
          },
        });
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
        return lang.keyNotFound;
      }
      const { data: signedTrx } = await KeystoreApi.signTx({
        keyname: keyName,
        nonce,
        to: Contract.PAID_GROUP_CONTRACT_ADDRESS,
        value: ethers.utils.parseEther(state.invokeFee).toHexString(),
        gas_limit: 300000,
        gas_price: gasPrice.toHexString(),
        data,
        chain_id: String(network.chainId),
      });
      console.log('signTx done');
      const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
      console.log('send done');
      await Contract.provider.waitForTransaction(txHash);
      const receipt = await Contract.provider.getTransactionReceipt(txHash);
      console.log('receit done');
      if (receipt.status === 0) {
        return lang.addPriceFailed;
      }
      const announceRet = await UserApi.announce({
        group_id: groupId,
        action: 'add',
        type: 'user',
        memo: group.user_eth_addr,
      });
      console.log({ announceRet });
      state.creating = false;
      return null;
    } catch (e: any) {
      let message = e?.error?.reason || e?.error?.message || e?.message || lang.somethingWrong;
      if (e.body) {
        try {
          console.log(JSON.parse(e.body).error.message);
          message = JSON.parse(e.body).error.message;
        } catch {}
      }
      console.log(message);
      return message;
    }
  };

  if (!state.fetched) {
    return (<div className="pt-40 flex justify-center">
      <Loading />
    </div>);
  }

  return (
    <div className="mt-32 mx-auto">
      {+state.amount === 0 && (
        <>
          <div className="py-4">
            <FormControl
              className="w-full text-left"
              size="small"
              variant="outlined"
            >
              <InputLabel>选择币种</InputLabel>
              <Select
                value={state.rumSymbol}
                renderValue={() => state.coin?.symbol || ''}
                label="选择币种"
                onChange={action((e) => {
                  state.rumSymbol = e.target.value as string;
                  state.amount = '';
                })}
              >
                {state.coins.map((coin) => (
                  <MenuItem key={coin.rumSymbol} value={coin.rumSymbol} className="flex items-center leading-none">{coin.symbol}
                    <span className="ml-1 opacity-40 text-12">- {coin.name}</span>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className="pt-2 leading-relaxed">
            <div>
              <div className="flex items-center">
                {lang.payableTip}
                <OutlinedInput
                  className="mx-2 w-30"
                  margin="dense"
                  value={state.amount}
                  onChange={(e) => {
                    const amount = inputFinanceAmount(e.target.value);
                    if (amount !== null) {
                      state.amount = amount;
                    }
                  }}
                  spellCheck={false}
                  endAdornment={<InputAdornment position="end">{state.coin?.symbol || '-'}</InputAdornment>}
                />
              </div>
              {
                // <div className="mt-3 text-gray-bd text-14">
                //   {lang.createPaidGroupFeedTip(state.invokeFee ? parseFloat(state.invokeFee) : '-', state.rumSymbol || '-')}
                // </div>
              }
            </div>
          </div>
          <div
            className="text-gray-70 text-center text-16 leading-loose tracking-wide"
          >
            {lang.thisIsAPaidGroup}
          </div>

          <Button
            className="mx-auto block mt-4"
            onClick={handlePaidGroup}
            isDoing={state.paying}
            disabled={state.paid}
          >
            {state.paid ? lang.paidSuccessfully : lang.pay}
          </Button>
        </>
      )}
    </div>
  );
});
