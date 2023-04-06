import { groupBy } from 'lodash';
import { runInAction } from 'mobx';
import type { IDBComment } from 'hooks/useDatabase/models/comment';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';

export function createCommentStore() {
  return {
    total: 0,

    map: {} as Record<string, IDBComment>,

    idsSet: new Set(),

    newCommentIdsSet: new Set(),

    selectedTopComment: null as IDBComment | null,

    openEditorEntryDrawer: false,

    hasMoreComments: false,

    highlightDomElementId: '',

    get comments() {
      return this.ids.map((rId: string) => this.map[rId]);
    },

    get commentsGroupMap() {
      const map = groupBy(
        this.comments,
        (comment) => comment.postId,
      ) as Record<string, IDBComment[]>;
      return map;
    },

    get ids() {
      return Array.from(this.idsSet) as string[];
    },

    get subCommentsGroupMap() {
      const map = groupBy(this.comments, (comment) => {
        const threadId = comment.threadId;
        if (threadId && !this.map[threadId]) {
          return 0;
        }
        return threadId || 0;
      }) as Record<string, IDBComment[]>;
      delete map[0];
      return map;
    },

    clear() {
      this.map = {} as Record<string, IDBComment>;
      this.idsSet.clear();
      this.total = 0;
    },

    setTotal(total: number) {
      this.total = total;
    },

    setHasMoreComments(hasMoreComments: boolean) {
      this.hasMoreComments = hasMoreComments;
    },

    addComments(comments: IDBComment[]) {
      runInAction(() => {
        for (const comment of comments) {
          const { id } = comment;
          this.map[id] = comment;
          this.idsSet.add(id);
        }
      });
    },

    updateComments(comments: IDBComment[]) {
      runInAction(() => {
        this.newCommentIdsSet.clear();
        for (const comment of comments) {
          const { id } = comment;
          this.map[id] = comment;
          this.idsSet.delete(id);
          this.idsSet.add(id);
        }
      });
    },

    addComment(comment: IDBComment, head?: boolean) {
      runInAction(() => {
        const { id } = comment;
        this.map[id] = comment;
        if (head) {
          this.idsSet = new Set([id, ...this.ids]);
        } else {
          this.idsSet.add(id);
        }
        this.newCommentIdsSet.add(comment.id);
        this.total += 1;
      });
    },

    updateComment(id: string, updatedComment: IDBComment) {
      this.map[id] = updatedComment;
    },

    addCommentToMap(id: string, comment: IDBComment) {
      this.map[id] = comment;
    },

    markAsSynced(id: string) {
      runInAction(() => {
        this.map[id].status = ContentStatus.synced;
      });
    },

    removeComment(id: string) {
      this.newCommentIdsSet.delete(id);
      delete this.map[id];
      this.idsSet.delete(id);
      this.total -= 1;
    },

    setSelectedTopComment(comment: IDBComment) {
      this.selectedTopComment = comment;
    },

    setOpenEditorEntryDrawer(status: boolean) {
      this.openEditorEntryDrawer = status;
    },

    setHighlightDomElementId(domElementId: string) {
      this.highlightDomElementId = domElementId;
    },
  };
}
