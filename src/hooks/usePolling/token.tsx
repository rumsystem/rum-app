import sleep from 'utils/sleep';
import GroupApi from 'apis/group';
import { store } from 'store';

export const token = async () => {
  const { nodeStore, apiConfigHistoryStore } = store;

  if (nodeStore.mode !== 'EXTERNAL') {
    return;
  }

  if (!nodeStore.quitting) {
    await refreshToken();
    await sleep(1000);
  }

  async function refreshToken() {
    try {
      const { token } = await GroupApi.refreshToken();
      const apiConfig = {
        ...nodeStore.apiConfig,
        jwt: token,
      };
      nodeStore.setApiConfig(apiConfig);
      apiConfigHistoryStore.update(apiConfig);
    } catch (err) { }
  }
};
