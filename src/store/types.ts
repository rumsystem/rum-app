import type { createModalStore } from './modal';
import type { createSnackbarStore } from './snackbar';
import type { createConfirmDialogStore } from './confirmDialog';
import type { createGroupStore } from './group';
import type { createActiveGroupStore } from './activeGroup';
import type { createAuthStore } from './auth';
import type { createNodeStore } from './node';
import type { createCommentStore } from './comment';
import type { createNotificationStore } from './notification';
import type { createLatestStatusStore } from './latestStatus';
import type { createSidebarStore } from './sidebar';
import type { createApiConfigHistoryStore } from './apiConfigHistory';
import type { createFollowingStore } from './following';
import type { createMutedListStore } from './mutedList';

export interface Store {
  modalStore: ReturnType<typeof createModalStore>
  snackbarStore: ReturnType<typeof createSnackbarStore>
  confirmDialogStore: ReturnType<typeof createConfirmDialogStore>
  groupStore: ReturnType<typeof createGroupStore>
  activeGroupStore: ReturnType<typeof createActiveGroupStore>
  authStore: ReturnType<typeof createAuthStore>
  nodeStore: ReturnType<typeof createNodeStore>
  commentStore: ReturnType<typeof createCommentStore>
  notificationStore: ReturnType<typeof createNotificationStore>
  latestStatusStore: ReturnType<typeof createLatestStatusStore>
  sidebarStore: ReturnType<typeof createSidebarStore>
  apiConfigHistoryStore: ReturnType<typeof createApiConfigHistoryStore>
  followingStore: ReturnType<typeof createFollowingStore>
  mutedListStore: ReturnType<typeof createMutedListStore>
}
