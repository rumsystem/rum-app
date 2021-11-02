import { isEmpty, toPairs } from 'lodash';
import { Finance } from 'utils';

interface IBalance {
  [currency: string]: string;
}

export function createWalletStore() {
  return {
    loading: false,
    failed: false,
    balance: {} as IBalance,
    get isEmpty() {
      return isEmpty(this.balance);
    },
    get assets() {
      return toPairs(this.balance);
    },
    setLoading(value: boolean) {
      this.loading = value;
    },
    setFailed(value: boolean) {
      this.failed = value;
    },
    setBalance(balance: any) {
      for (const currency in balance) {
        balance[currency] = Finance.toString(balance[currency]);
      }
      this.balance = balance;
    },
  };
}
