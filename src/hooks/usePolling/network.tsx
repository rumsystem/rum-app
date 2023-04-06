import sleep from 'utils/sleep';
import NodeApi from 'apis/node';
import NetworkApi from 'apis/network';
import { store } from 'store';

export const network = async () => {
  const { nodeStore } = store;

  while (!nodeStore.quitting) {
    await fetchNetwork();
    await sleep(4000);
  }

  async function fetchNetwork() {
    try {
      const [info, network] = await Promise.all([
        NodeApi.fetchMyNodeInfo(),
        NetworkApi.fetchNetwork(),
      ]);

      nodeStore.setInfo(info);
      nodeStore.setNetwork(network);
    } catch (err) {
      console.error(err);
    }
  }
};
