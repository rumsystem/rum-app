import { wsBootstraps } from './constant';

const WASM_BOOTSTRAP_STORAGE_KEY = 'WASM_BOOTSTRAP_STORAGE_KEY';

export const getWasmBootstraps = () => {
  let bootstraps = [...wsBootstraps];
  const item = localStorage.getItem(WASM_BOOTSTRAP_STORAGE_KEY) ?? '';
  try {
    const data = JSON.parse(item);
    if (Array.isArray(data) && data.every((v) => typeof v === 'string')) {
      bootstraps = data;
    }
  } catch (e) {}
  return bootstraps;
};

export const saveWasmBootstraps = (bs: Array<string>) => {
  localStorage.setItem(WASM_BOOTSTRAP_STORAGE_KEY, JSON.stringify(bs));
};
