import * as jsBase64 from 'js-base64';
import * as ethers from 'ethers';

const uint8ArrayToHex = (buffer: Uint8Array) =>
  new Uint8Array(buffer).reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');

export const pubkeyToAddr = (base64: string) => {
  const u8s = jsBase64.toUint8Array(base64);
  const publicKey = uint8ArrayToHex(u8s);
  const address = ethers.utils.computeAddress(`0x${publicKey}`);
  return address;
};
