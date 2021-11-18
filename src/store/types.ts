import type { createModalStore } from './modal';
import type { createSnackbarStore } from './snackbar';
import type { createConfirmDialogStore } from './confirmDialog';
import type { createGroupStore } from './group';
import type { createActiveGroupStore } from './activeGroup';
import type { createAuthStore } from './auth';
import type { createNodeStore } from './node';
import type { createSeedStore } from './seed';
import type { createCommentStore } from './comment';
import type { createNotificationStore } from './notification';
import type { createLatestStatusStore } from './latestStatus';
import type { createSidebarStore } from './sidebar';

export interface Store {
  modalStore: ReturnType<typeof createModalStore>
  snackbarStore: ReturnType<typeof createSnackbarStore>
  confirmDialogStore: ReturnType<typeof createConfirmDialogStore>
  groupStore: ReturnType<typeof createGroupStore>
  activeGroupStore: ReturnType<typeof createActiveGroupStore>
  authStore: ReturnType<typeof createAuthStore>
  nodeStore: ReturnType<typeof createNodeStore>
  seedStore: ReturnType<typeof createSeedStore>
  commentStore: ReturnType<typeof createCommentStore>
  notificationStore: ReturnType<typeof createNotificationStore>
  latestStatusStore: ReturnType<typeof createLatestStatusStore>
  sidebarStore: ReturnType<typeof createSidebarStore>
}
