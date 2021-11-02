import { larger, bignumber, largerEq } from 'mathjs';

const defaultCurrencyIcon = 'https://i.xue.cn/6504120.png';

const currencyIconMap: any = {
  CNB: 'https://img-cdn.xue.cn/1025-cnb.png',
  BTC: 'https://img-cdn.xue.cn/1024-btc.png',
  ETH: 'https://img-cdn.xue.cn/1024-eth.png',
  EOS: 'https://img-cdn.xue.cn/1024-eos.png',
  BOX: 'https://img-cdn.xue.cn/1024-box.png',
  PRS: 'https://img-cdn.xue.cn/1024-prs.png',
  XIN: 'https://img-cdn.xue.cn/1024-xin.png',
  COB: defaultCurrencyIcon,
};

const getCurrencyName = (currency: string) => {
  const map: any = {
    CNBCOB: 'CNB-COB',
  };
  return map[currency] || currency;
};

const maxAmount: any = {
  CNB: 1000000,
  BTC: 0.01,
  ETH: 0.1,
  EOS: 10,
  BOX: 20,
  PRS: 1000,
  XIN: 0.1,
};

const defaultMemo: any = {
  DEPOSIT: '转入 PRS ATM',
  WITHDRAW: '从 PRS ATM 转出',
};

const toNumber = (amount: string) => {
  return bignumber(amount).toNumber();
};

const toString = (
  amount: any,
  options?: {
    precision: number;
  }
) => {
  const result = bignumber(amount).toString();
  const parts: any = result.split('.');
  if (parts[1]) {
    parts[1] = parts[1].slice(0, (options && options.precision) || 8);
  }
  return parts.join('.');
};

const checkAmount = (amount: string, currency: string, balance?: any) => {
  if (!amount) {
    return {
      message: `请输入金额`,
      type: 'error',
    };
  }
  if (balance) {
    const isGtBalance = larger(
      bignumber(amount),
      bignumber(balance[currency] || 0)
    );
    if (isGtBalance) {
      return {
        message: `你的余额只有 ${toString(balance[currency] || 0)} ${currency}`,
        type: 'error',
      };
    }
  }
  const isGtMax = Number(amount) > maxAmount[currency];
  if (isGtMax) {
    return {
      message: `${currency} 单次交易金额不能超过 ${maxAmount[currency]} 个`,
      type: 'error',
    };
  }
  return {
    ok: true,
  };
};

const getDecimalsFromAmount = (amount: string) => {
  const derivedAmount = toString(amount);
  if (!derivedAmount.includes('.')) {
    return 0;
  }
  const afterDot = derivedAmount.split('.').pop();
  if (afterDot) {
    return afterDot.length;
  }
  return 0;
};

const replaceMixinDomain = (url: string) => {
  return url.replace('https://mixin.one', 'https://mixin-www.zeromesh.net');
};

export default {
  currencyIconMap,
  checkAmount,
  toString,
  toNumber,
  getDecimalsFromAmount,
  defaultMemo,
  getCurrencyName,
  defaultCurrencyIcon,
  larger,
  largerEq,
  replaceMixinDomain,
};
