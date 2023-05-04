import { action, observable } from 'mobx';

const state = observable({
  id: 0,
  componentMap: new Map<number, {
    id: number
    name: string
    props: any
  }>(),
  get components() {
    return Array.from(this.componentMap.values());
  },
});

const createModal = action(() => {
  state.id += 1;
  const id = state.id;
  return {
    addModal: action((name: string, props?: any) => {
      state.componentMap.set(id, {
        id,
        name,
        props,
      });
    }),
    destoryModal: action(() => {
      state.componentMap.delete(id);
    }),
  };
});

export const modalService = {
  state,
  createModal,
};
