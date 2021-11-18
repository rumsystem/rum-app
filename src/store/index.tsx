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
import { createGlobalLatestStatusStore } from './globalLatestStatus';
import { createSidebarStore } from './sidebar';

import type { Store } from './types';

export type { Store } from './types';

const storeContext = React.createContext<any>(null);

const createStore = () => {
  const store = {} as Store;

  store.modalStore = observable(createModalStore());
  store.snackbarStore = observable(createSnackbarStore());
  store.confirmDialogStore = observable(createConfirmDialogStore());
  store.groupStore = observable(createGroupStore());
  store.activeGroupStore = observable(createActiveGroupStore());
  store.authStore = observable(createAuthStore());
  store.nodeStore = observable(createNodeStore());
  store.seedStore = observable(createSeedStore());
  store.commentStore = observable(createCommentStore());
  store.notificationStore = observable(createNotificationStore());
  store.latestStatusStore = observable(createLatestStatusStore());
  store.globalLatestStatusStore = observable(createGlobalLatestStatusStore());
  store.sidebarStore = observable(createSidebarStore());

  return store;
};

export const store = createStore();

export const StoreProvider = ({ children }: { children: React.ReactNode }) => (
  <storeContext.Provider value={store}>{children}</storeContext.Provider>
);

export const useStore = () => {
  const store = React.useContext(storeContext);
  if (!store) {
    throw new Error('You have forgot to use StoreProvider');
  }
  (window as any).toJS = toJS;
  (window as any).store = store;
  return store as Store;
};
