import React from 'react';
import { toJS } from 'mobx';
import { useLocalStore } from 'mobx-react-lite';
import { createAccountStore } from './account';
import { createModalStore } from './modal';
import { createSnackbarStore } from './snackbar';
import { createConfirmDialogStore } from './confirmDialog';
import { createGroupStore } from './group';
import { createAuthStore } from './auth';
import { createNodeStore } from './node';

const storeContext = React.createContext<any>(null);

interface IProps {
  children: React.ReactNode;
}

const useCreateStore = () => ({
  accountStore: useLocalStore(createAccountStore),
  modalStore: useLocalStore(createModalStore),
  snackbarStore: useLocalStore(createSnackbarStore),
  confirmDialogStore: useLocalStore(createConfirmDialogStore),
  groupStore: useLocalStore(createGroupStore),
  authStore: useLocalStore(createAuthStore),
  nodeStore: useLocalStore(createNodeStore),
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
