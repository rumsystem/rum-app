import { lang } from 'utils/lang';

export const CURRENCIES = [
  {
    name: 'Quorum Token',
    token: 'RUM',
    asset_id: '4f2ec12c-22f4-3a9e-b757-c84b6415ea8f',
  },
  {
    name: 'Bitcoin',
    token: 'BTC',
    asset_id: 'c6d0c728-2624-429b-8e0d-d9d19b6592fa',
  },
  {
    name: 'Ether',
    token: 'ETH',
    asset_id: '43d61dcd-e413-450d-80b8-101d5e903357',
  },
  {
    name: 'Tether USD',
    token: 'USDT',
    asset_id: '4d8c508b-91c5-375b-92b0-ee702ed2dac5',
  },
  {
    name: 'BOX Token',
    token: 'BOX',
    asset_id: 'f5ef6b5d-cc5a-3d90-b2c0-a2fd386e7a3c',
  },
  {
    name: 'MobileCoin',
    token: 'MOB',
    asset_id: 'eea900a8-b327-488c-8d8d-1428702fe240',
  },
  {
    name: 'EOS',
    token: 'EOS',
    asset_id: '6cfe566e-4aad-470b-8c9a-2fd35b49c68d',
  },
  {
    name: 'Dogecoin',
    token: 'DOGE',
    asset_id: '6770a1e5-6086-44d5-b60f-545f9d9e8ffd',
  },
  {
    name: 'USD Coin',
    token: 'USDC',
    asset_id: '9b180ab6-6abe-3dc0-a13f-04169eb34bfa',
  },
  {
    name: 'Pando USD',
    token: 'PUSD',
    asset_id: '31d2ea9c-95eb-3355-b65b-ba096853bc18',
  },
  {
    name: 'Mixin',
    token: 'XIN',
    asset_id: 'c94ac88f-4671-3976-b60a-09064f1811e8',
  },
];

export const checkAmount = (amount: string) => {
  if (!amount) {
    return {
      message: lang.input(lang.tokenAmount),
      type: 'error',
    };
  }
  return {
    ok: true,
  };
};

export const getMixinPaymentUrl = (options = {} as any) => {
  const {
    toMixinClientId,
    asset,
    amount,
    trace,
    memo,
  } = options;
  return (
    'https://mixin-www.zeromesh.net/pay'
    + '?recipient=' + encodeURIComponent(toMixinClientId)
    + '&asset=' + encodeURIComponent(asset)
    + '&amount=' + encodeURIComponent(amount)
    + '&trace=' + encodeURIComponent(trace)
    + '&memo=' + encodeURIComponent(memo)
  );
};
