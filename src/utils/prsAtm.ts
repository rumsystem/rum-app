import { ipcRenderer } from 'electron';

interface IOptions {
  id: string;
  actions: string[];
  args?: any[];
  minPending?: number;
}
let timer: any = null;
let isDoing = false;

const sleep = (duration: number) =>
  new Promise((resolve: any) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });

const fetch = async (options: IOptions) => {
  const promise = new Promise((resolve, reject) => {
    ipcRenderer.send(
      'prs-atm',
      JSON.stringify({
        actions: options.actions,
        args: options.args || [],
        callbackEventName: options.id,
      })
    );
    ipcRenderer.on(options.id, (_event, resp) => {
      resolve(resp);
    });
    ipcRenderer.on(`prs-atm-${options.id}-error`, (_e, err) => {
      reject(err);
    });
  });
  const [resp] = await Promise.all([promise, sleep(options.minPending || 0)]);
  return resp;
};

const tryCancelPolling = () => {
  if (timer) {
    clearInterval(timer);
    isDoing = false;
  }
};

const polling = (asyncFn: any, duration = 2000) => {
  return new Promise((resolve, reject) => {
    timer = setInterval(async () => {
      if (isDoing) {
        return;
      }
      isDoing = true;
      try {
        const isDone = await asyncFn();
        if (isDone) {
          resolve(true);
          tryCancelPolling();
        }
      } catch (err) {
        reject(err);
        tryCancelPolling();
      }
      isDoing = false;
    }, duration);
  });
};

export default {
  fetch,
  tryCancelPolling,
  polling,
};
