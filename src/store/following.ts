import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';

const FOLLOWINGS_STORE_KEY = 'followings';

interface IFollowing {
  groupId: string
  publisher: string
  timestamp: number
}

export function createFollowingStore() {
  return {
    followings: [] as IFollowing[],

    init() {
      this.followings = (ElectronCurrentNodeStore.getStore().get(FOLLOWINGS_STORE_KEY) || []) as IFollowing[];
    },

    follow(options: {
      groupId: string
      publisher: string
    }) {
      this.followings.push({
        groupId: options.groupId,
        publisher: options.publisher,
        timestamp: Date.now(),
      });
      ElectronCurrentNodeStore.getStore().set(FOLLOWINGS_STORE_KEY, this.followings);
    },

    unFollow(options: {
      groupId: string
      publisher: string
    }) {
      this.followings = this.followings.filter((following) => following.groupId !== options.groupId && following.publisher !== options.publisher);
      ElectronCurrentNodeStore.getStore().set(FOLLOWINGS_STORE_KEY, this.followings);
    },
  };
}
