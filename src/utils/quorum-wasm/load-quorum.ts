import { Go } from './wasm_exec';
import quorumWasmUrl from 'assets/lib.wasm';

const methodCache = new Map<string | symbol, any>();

(window as any).qwasm = new Proxy({}, {
  get: (_target, p) => {
    if (methodCache.has(p)) {
      return methodCache.get(p);
    }
    const method = async (...args: Array<any>) => {
      const res = await (window as any)[p](...args);
      const data = 'data' in res ? res.data : res;
      console.log(`${p as string}\n`, {
        args,
        res: data,
      });
      return data;
    };
    methodCache.set(p, method);
    return method;
  },
});

export const loadQuorumWasm = async (bootstraps: Array<string>) => {
  const go = new Go();
  const r = await WebAssembly.instantiateStreaming(fetch(quorumWasmUrl), go.importObject);

  go.run(r.instance);

  await qwasm.StartQuorum(
    'password',
    bootstraps.join(','),
  );
};
