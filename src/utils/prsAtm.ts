import { ipcRenderer } from 'electron';

interface IOptions {
  actions: string[];
  args?: any[];
  minPending?: number;
  logging?: boolean;
  for?: string;
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
    const id: string =
      (options.actions || []).join('.') + '.' + new Date().getTime();
    const logId: string = id + (options.for ? `(${options.for})` : '');
    ipcRenderer.send(
      'prs-atm',
      JSON.stringify({
        actions: options.actions,
        args: options.args || [],
        callbackEventName: id,
      })
    );
    try {
      if (options.logging) {
        console.log(`PRS-ATM ${logId}: execute`);
      }
    } catch (err) {}
    ipcRenderer.on(id, (_event, resp) => {
      resolve(resp);
      try {
        if (options.logging) {
          console.log(`PRS-ATM ${logId}: response`);
          console.log(resp);
        }
      } catch (err) {}
    });
    ipcRenderer.on(`prs-atm-${id}-error`, (_e, err) => {
      reject(err);
      try {
        if (options.logging) {
          console.log(`PRS-ATM ${logId}: failed`);
          console.log(err);
        }
      } catch (err) {}
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
