export interface IElectronStoreNameOptions {
  peerId: string;
  groupId: string;
  resource: string;
}

export default {
  get(options: IElectronStoreNameOptions) {
    const { peerId, groupId, resource } = options;
    return `peer_${peerId}_group_${groupId}_${resource}`;
  },
};
