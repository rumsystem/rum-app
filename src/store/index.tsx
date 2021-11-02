import React from 'react';
import { toJS } from 'mobx';
import { useLocalObservable } from 'mobx-react-lite';
import { createModalStore } from './modal';
import { createSnackbarStore } from './snackbar';
import { createConfirmDialogStore } from './confirmDialog';
import { createGroupStore } from './group';
import { createActiveGroupStore } from './activeGroup';
import { createAuthStore } from './auth';
import { createNodeStore } from './node';
import { createSeedStore } from './seed';

const storeContext = React.createContext<any>(null);

interface IProps {
  children: React.ReactNode;
}

const useCreateStore = () => ({
  modalStore: useLocalObservable(createModalStore),
  snackbarStore: useLocalObservable(createSnackbarStore),
  confirmDialogStore: useLocalObservable(createConfirmDialogStore),
  groupStore: useLocalObservable(createGroupStore),
  activeGroupStore: useLocalObservable(createActiveGroupStore),
  authStore: useLocalObservable(createAuthStore),
  nodeStore: useLocalObservable(createNodeStore),
  seedStore: useLocalObservable(createSeedStore),
});

export const StoreProvider = ({ children }: IProps) => {
  const store = useCreateStore();
  return (
    <storeContext.Provider value={store}>{children}</storeContext.Provider>
  );
};

export const useStore = () => {
  const store = React.useContext(storeContext);
  if (!store) {
    throw new Error('You have forgot to use StoreProvider');
  }
  (window as any).toJS = toJS;
  (window as any).store = store;
  return store as ReturnType<typeof useCreateStore>;
};
