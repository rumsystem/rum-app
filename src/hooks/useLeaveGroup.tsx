import { useStore } from 'store';
import { runInAction } from 'mobx';
import { parseEther, Contract } from 'ethers';
import GroupApi, { IGroup } from 'apis/group';
import MVMApi from 'apis/mvm';
import removeGroupData from 'utils/removeGroupData';
import * as ContractUtils from 'utils/contract';
import { removeGroupFromDatabase } from './useDatabase/models/utils';
import useDatabase from './useDatabase';

export const useLeaveGroup = () => {
  const {
    activeGroupStore,
    groupStore,
    latestStatusStore,
  } = useStore();
  const database = useDatabase();

  return async (groupId: string) => {
    try {
      await GroupApi.leaveGroup(groupId);
      runInAction(() => {
        if (activeGroupStore.id === groupId) {
          const firstExistsGroupId = groupStore.groups.filter(
            (group) => group.group_id !== groupId,
          ).at(0)?.group_id ?? '';
          activeGroupStore.setId(firstExistsGroupId);
        }
        groupStore.deleteGroup(groupId);
        activeGroupStore.clearCache(groupId);
        latestStatusStore.remove(groupId);
        removeGroupFromDatabase(groupId);
      });
      await removeGroupData([database], groupId);
    } catch (err) {
      console.error(err);
    }
  };
};

export const useCheckWallet = () =>
  async (group: IGroup) => {
    try {
      const { data } = await MVMApi.coins();
      const coins = Object.values(data);
      const balanceUnit = parseEther('0.00000001');
      const balances = await Promise.all(coins.map(async (coin) => {
        if (coin.rumSymbol === 'RUM') {
          const balanceWEI = await ContractUtils.provider.getBalance(group.user_eth_addr);
          return balanceWEI;
        }
        const contract = new Contract(coin.rumAddress, ContractUtils.RUM_ERC20_ABI, ContractUtils.provider);
        const balance = await contract.balanceOf(group.user_eth_addr);
        return balance;
      }));
      for (const [index, coin] of coins.entries()) {
        if (balances[index].gte(balanceUnit)) {
          console.log(`you have ${coin.rumSymbol}`);
          return false;
        }
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };
