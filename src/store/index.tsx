import React from 'react';
import { toJS, observable } from 'mobx';
import { createModalStore } from './modal';
import { createSnackbarStore } from './snackbar';
import { createConfirmDialogStore } from './confirmDialog';
import { createGroupStore } from './group';
import { createActiveGroupStore } from './activeGroup';
import { createAuthStore } from './auth';
import { createNodeStore } from './node';
import { createSeedStore } from './seed';
import { createCommentStore } from './comment';
import { createNotificationStore } from './notification';
import { createLatestStatusStore } from './latestStatus';
import { createSidebarStore } from './sidebar';

const storeContext = React.createContext<any>(null);

interface IProps {
  children: React.ReactNode
}

const createStore = () => ({
  modalStore: observable(createModalStore()),
  snackbarStore: observable(createSnackbarStore()),
  confirmDialogStore: observable(createConfirmDialogStore()),
  groupStore: observable(createGroupStore()),
  activeGroupStore: observable(createActiveGroupStore()),
  authStore: observable(createAuthStore()),
  nodeStore: observable(createNodeStore()),
  seedStore: observable(createSeedStore()),
  commentStore: observable(createCommentStore()),
  notificationStore: observable(createNotificationStore()),
  latestStatusStore: observable(createLatestStatusStore()),
  sidebarStore: observable(createSidebarStore()),
});

export const store = createStore();

export const StoreProvider = ({ children }: IProps) => (
  <storeContext.Provider value={store}>{children}</storeContext.Provider>
);

export type Store = ReturnType<typeof createStore>;

export const useStore = () => {
  const store = React.useContext(storeContext);
  if (!store) {
    throw new Error('You have forgot to use StoreProvider');
  }
  (window as any).toJS = toJS;
  (window as any).store = store;
  return store as Store;
};
