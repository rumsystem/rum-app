import { ContentTaskManager } from './ContentTaskManager';
import { SocketManager } from './SocketManager';

export const contentTaskManager = new ContentTaskManager();
export const socketManager = new SocketManager(contentTaskManager);
