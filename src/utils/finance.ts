import { larger, bignumber, largerEq, equal } from 'mathjs';

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

const exchangeCurrencyMinNumber: any = {
  PRS: '0.0001',
  CNB: '0.001',
  COB: '0.001',
};

const defaultMemo: any = {
  DEPOSIT: '转入 PRS ATM',
  WITHDRAW: '从 PRS ATM 转出',
};

const removeDecimalZero = (amount: string) => {
  if (!amount.includes('.')) {
    return amount;
  }
  const parts: any = amount.split('.');
  let decimal = parts[1];
  while (decimal.endsWith('0')) {
    decimal = decimal.slice(0, -1);
  }
  if (decimal) {
    return parts[0] + '.' + decimal;
  }
  return parts[0];
};

const toNumber = (amount: any) => {
  return bignumber(amount).toNumber();
};

const toString = (
  amount: any,
  options?: {
    precision: number;
  }
) => {
  const result = bignumber(amount).toString();
  if (result.includes('e')) {
    return removeDecimalZero(amount);
  }
  const parts: any = result.split('.');
  if (options && options.precision === 0) {
    return parts[0];
  }
  if (parts[1]) {
    parts[1] = parts[1].slice(0, (options && options.precision) || 4);
  }
  return removeDecimalZero(parts.join('.'));
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

const largerEqMinNumber = (amount: string, minNumber?: string) => {
  return largerEq(amount, minNumber || '0.000001');
};

const formatInputAmount = (amount: string) => {
  if (amount === '0' || amount === '.' || amount === '0.' || equal(amount, 0)) {
    return '';
  }
  if (amount.startsWith('.')) {
    return `0.${amount.replaceAll('.', '')}`;
  }
  return amount;
};

const isValidAmount = (amount: string, options: any = {}) => {
  const re = /^[0-9]+[.]?[0-9]*$/;
  if (amount === '') {
    return true;
  }
  if (!re.test(amount)) {
    return false;
  }
  const { maxDecimals = 6 } = options;
  if (amount.includes('.')) {
    return amount.split('.')[1].length <= maxDecimals;
  }
  return amount.length <= maxDecimals;
};

export default {
  currencyIconMap,
  exchangeCurrencyMinNumber,
  checkAmount,
  toString,
  toNumber,
  getDecimalsFromAmount,
  defaultMemo,
  defaultCurrencyIcon,
  larger,
  largerEq,
  replaceMixinDomain,
  largerEqMinNumber,
  formatInputAmount,
  isValidAmount,
  removeDecimalZero,
};
