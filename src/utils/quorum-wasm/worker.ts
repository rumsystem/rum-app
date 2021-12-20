import { Go } from './wasm_exec';
import quorumWasmUrl from 'assets/lib.wasm';

const init = async () => {
  const go = new Go();
  const r = await WebAssembly.instantiateStreaming(fetch(quorumWasmUrl), go.importObject);

  go.run(r.instance);
  global.postMessage('inited');
};

global.addEventListener('message', async (e) => {
  try {
    const data = e.data;
    const { method, args, id } = data;

    const result = await (global as any)[method](...args).then((res: any) => {
      const data = 'data' in res ? res.data : res;
      return { data };
    }, (error: any) => {
      console.error(error);
      return { error };
    });
    global.postMessage({
      ...result,
      id,
    });
  } catch (e) {
    console.error(e);
  }
});

init();
