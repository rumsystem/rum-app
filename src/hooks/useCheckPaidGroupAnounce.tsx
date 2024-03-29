import React from 'react';
import { IGroup } from 'apis/group';
import {
  isPublicGroup,
  isNoteGroup,
} from 'store/selectors/group';
import MVMApi, { ICoin } from 'apis/mvm';
import { formatEther, Contract } from 'ethers';
import * as ContractUtils from 'utils/contract';

export default () => React.useCallback(async (group: IGroup) => {
  if (isPublicGroup(group)
    || isNoteGroup(group)
  ) {
    return true;
  }
  try {
    const res = await MVMApi.coins();
    const coins = Object.values(res.data).filter((coin) => coin.rumSymbol !== 'RUM') as ICoin[];

    const contract = new Contract(ContractUtils.PAID_GROUP_CONTRACT_ADDRESS, ContractUtils.PAID_GROUP_ABI, ContractUtils.provider);
    const groupDetail = await contract.getPrice(ContractUtils.uuidToBigInt(group.group_id));

    const amount = formatEther(groupDetail.amount);
    const rumSymbol = coins.find((coin) => coin.rumAddress === groupDetail.tokenAddr)?.rumSymbol || '';

    if (+amount > 0 && rumSymbol) {
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}, []);
