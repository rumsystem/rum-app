import { RumFullNodeClient } from 'rum-fullnode-sdk';
import type { Store } from 'store/types';


let base = '';
let jwt = '';

let client = RumFullNodeClient({
  baseURL: 'http://127.0.0.1:8000',
  jwt: 'eyJhbGciOiJI....',
});

export const getClient = () => {
  const { nodeStore } = (window as any).store as Store;
  const newBase = nodeStore.mode === 'EXTERNAL'
    ? nodeStore.apiConfig.origin
    : `http://127.0.0.1:${nodeStore.port}`;
  const newJwt = nodeStore.mode === 'EXTERNAL'
    ? nodeStore.apiConfig.jwt
    : '';

  if (newBase !== base || newJwt !== jwt) {
    client = RumFullNodeClient({
      baseURL: newBase,
      jwt: newJwt,
    });
    base = newBase;
    jwt = newJwt;
  }
  return client;
};
