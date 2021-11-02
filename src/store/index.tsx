import React from 'react';
import { toJS } from 'mobx';
import { useLocalStore } from 'mobx-react-lite';
import { createAccountStore } from './account';
import { createModalStore } from './modal';
import { createSnackbarStore } from './snackbar';
import { createConfirmDialogStore } from './confirmDialog';
import { createWalletStore } from './wallet';
import { createPoolStore } from './pool';
import { createGroupStore } from './group';

const storeContext = React.createContext<any>(null);

interface IProps {
  children: React.ReactNode;
}

const useCreateStore = () => ({
  accountStore: useLocalStore(createAccountStore),
  modalStore: useLocalStore(createModalStore),
  snackbarStore: useLocalStore(createSnackbarStore),
  confirmDialogStore: useLocalStore(createConfirmDialogStore),
  walletStore: useLocalStore(createWalletStore),
  poolStore: useLocalStore(createPoolStore),
  groupStore: useLocalStore(createGroupStore),
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
