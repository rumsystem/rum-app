import { getClient } from './client';

export default {
  fetchMyNodeInfo() {
    return getClient().Node.get();
  },
};
