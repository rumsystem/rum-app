import { ipcRenderer } from 'electron';

interface IOptions {
  id: string;
  actions: string[];
  args?: any[];
}

export default {
  fetch: (options: IOptions) => {
    return new Promise((resolve, reject) => {
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
        console.log(err);
        reject(err);
      });
    });
  },
};
