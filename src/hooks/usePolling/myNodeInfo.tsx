import sleep from 'utils/sleep';
import NodeApi from 'apis/node';
import * as Quorum from 'utils/quorum';
import { BOOTSTRAPS } from 'utils/constant';
import { store } from 'store';

let errorCount = 0;

export const myNodeInfo = async () => {
  const { nodeStore } = store;

  if (!nodeStore.quitting) {
    await fetchMyNodeInfo();
    await sleep(4000);
  }

  async function fetchMyNodeInfo() {
    try {
      const info = await NodeApi.fetchMyNodeInfo();
      nodeStore.updateStatus(info.node_status);
      errorCount = 0;
      nodeStore.setConnected(true);
      (window as any).Quorum = Quorum;
    } catch (err) {
      if (errorCount > 0 && nodeStore.connected) {
        nodeStore.setConnected(false);
        if (nodeStore.mode === 'INTERNAL') {
          Quorum.down();
          await sleep(2000);
          console.log('Restarting node');
          const { data } = await Quorum.up({
            bootstraps: BOOTSTRAPS,
            storagePath: nodeStore.storagePath,
            password: localStorage.getItem(`p${nodeStore.storagePath}`) || nodeStore.password,
            debugQuorum: localStorage.getItem(`d${nodeStore.storagePath}`) === 'y',
          });
          const status = {
            ...data,
            logs: '',
          };
          console.log('NODE_STATUS', status);
          nodeStore.setStatus(status);
          nodeStore.setApiConfig({
            origin: nodeStore.apiConfig.origin,
            jwt: nodeStore.apiConfig.jwt || '',
          });
        }
      }
      errorCount += 1;
      console.error(err);
    }
  }
};
