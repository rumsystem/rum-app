import type { createModalStore } from './modal';
import type { createSnackbarStore } from './snackbar';
import type { createConfirmDialogStore } from './confirmDialog';
import type { createGroupStore } from './group';
import type { createActiveGroupStore } from './activeGroup';
import type { createNodeStore } from './node';
import type { createCommentStore } from './comment';
import type { createNotificationStore } from './notification';
import type { createLatestStatusStore } from './latestStatus';
import type { createSidebarStore } from './sidebar';
import type { createApiConfigHistoryStore } from './apiConfigHistory';
import type { createFollowingStore } from './following';
import type { createMutedListStore } from './mutedList';
import type { createFontStore } from './font';
import type { createBetaFeatureStore } from './betaFeature';
import type { createNotificationSlideStore } from './notificationSlide';

export interface Store {
  modalStore: ReturnType<typeof createModalStore>
  snackbarStore: ReturnType<typeof createSnackbarStore>
  confirmDialogStore: ReturnType<typeof createConfirmDialogStore>
  groupStore: ReturnType<typeof createGroupStore>
  activeGroupStore: ReturnType<typeof createActiveGroupStore>
  nodeStore: ReturnType<typeof createNodeStore>
  commentStore: ReturnType<typeof createCommentStore>
  notificationStore: ReturnType<typeof createNotificationStore>
  latestStatusStore: ReturnType<typeof createLatestStatusStore>
  sidebarStore: ReturnType<typeof createSidebarStore>
  apiConfigHistoryStore: ReturnType<typeof createApiConfigHistoryStore>
  followingStore: ReturnType<typeof createFollowingStore>
  mutedListStore: ReturnType<typeof createMutedListStore>
  fontStore: ReturnType<typeof createFontStore>
  betaFeatureStore: ReturnType<typeof createBetaFeatureStore>
  notificationSlideStore: ReturnType<typeof createNotificationSlideStore>
}
