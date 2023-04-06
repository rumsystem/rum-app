import { ContentTaskManager } from './ContentTaskManager';
import { EmptyContentManager } from './EmptyContentManager';
import { SocketManager } from './SocketManager';

export const contentTaskManager = new ContentTaskManager();
export const emptyContentManager = new EmptyContentManager(contentTaskManager);
export const socketManager = new SocketManager(contentTaskManager, emptyContentManager);
