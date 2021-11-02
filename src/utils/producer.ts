import { default as PrsAtm } from './prsAtm';

const register = (privateKey: string, accountName: string, url?: string) => {
  return new Promise(async (resolve) => {
    const { accountStore } = (window as any).store;
    const resp: any = await PrsAtm.fetch({
      actions: ['producer', 'register'],
      args: [
        accountName,
        url || '',
        '',
        accountStore.isProducer ? accountStore.account.producer.producer_key : accountStore.publicKey,                
        privateKey,
      ],
      logging: true,
    });
    console.log({ resp });
    const account: any = await PrsAtm.fetch({
      actions: ['atm', 'getAccount'],
      args: [accountStore.account.account_name],
    });
    accountStore.setCurrentAccount(account);
    resolve(true);
  })
};

const check = (privateKey: string, accountName: string) => {
  const { accountStore } = (window as any).store;
  if (accountStore.isProducer) {
    return;
  } else {
    return register(privateKey,accountName);
  }
}

export default {
  check,
  register,
};
