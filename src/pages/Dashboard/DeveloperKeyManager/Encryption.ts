import cryptoRandomString from 'crypto-random-string';

const CRS = (length: number) => cryptoRandomString(length);

const aesKey256 = () =>
  Array.from(
    {
      length: 32,
    },
    () => Math.floor(Math.random() * 32)
  );

const randomNumber = (bit: number) => {
  let str = '';
  let i = 0;
  while (i < bit) {
    const number = Math.round(Math.random() * 9);
    if (str || number > 0) {
      str += number;
      i++;
    }
  }
  return Number(str);
};

const createEncryption = () => {
  const encryption: any = {
    accountKeystorePassword: CRS(32),
    sessionKeys: [CRS(32)],
    jwtKey: CRS(64),
    aes256Cbc: {
      key: CRS(64),
      ivPrefix: CRS(64),
    },
    aesKey256: aesKey256(),
  };
  delete encryption.aes256Cbc;
  return encryption;
};

const createWalletEncryption = () => ({
  salt: randomNumber(6),
  aesKey256: aesKey256(),
});

export default {
  createEncryption,
  createWalletEncryption,
  CRS,
};
