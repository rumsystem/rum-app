import ElectronCurrentNodeStore from 'store/electronCurrentNodeStore';

const STORE_KEY = 'betaFeatures';

type Item = 'PAID_GROUP' | 'RUM_EXCHANGE';

export function createBetaFeatureStore() {
  return {
    betaFeatures: [] as Item[],

    init() {
      this.betaFeatures = (ElectronCurrentNodeStore.getStore().get(STORE_KEY) || ['PAID_GROUP']) as Item[];
    },

    add(item: Item) {
      this.betaFeatures.push(item);
      ElectronCurrentNodeStore.getStore().set(STORE_KEY, this.betaFeatures);
    },

    remove(item: Item) {
      this.betaFeatures = this.betaFeatures.filter((_item) => _item !== item);
      ElectronCurrentNodeStore.getStore().set(STORE_KEY, this.betaFeatures);
    },

    toggle(item: Item) {
      if (this.betaFeatures.includes(item)) {
        this.remove(item);
      } else {
        this.add(item);
      }
    },
  };
}
