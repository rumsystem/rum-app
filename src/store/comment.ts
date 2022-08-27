import { groupBy } from 'lodash';
import { runInAction } from 'mobx';
import type { IDbDerivedCommentItem } from 'hooks/useDatabase/models/comment';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';

export function createCommentStore() {
  return {
    total: 0,

    map: {} as Record<string, IDbDerivedCommentItem>,

    trxIdsSet: new Set(),

    newCommentIdsSet: new Set(),

    selectedTopComment: null as IDbDerivedCommentItem | null,

    openEditorEntryDrawer: false,

    hasMoreComments: false,

    highlightDomElementId: '',

    get comments() {
      return this.trxIds.map((rId: string) => this.map[rId]);
    },

    get commentsGroupMap() {
      const map = groupBy(
        this.comments,
        (comment) => comment.Content.objectTrxId,
      ) as Record<string, IDbDerivedCommentItem[]>;
      return map;
    },

    get trxIds() {
      return Array.from(this.trxIdsSet) as string[];
    },

    get subCommentsGroupMap() {
      const map = groupBy(this.comments, (comment) => {
        const { threadTrxId } = comment.Content;
        if (threadTrxId && !this.map[threadTrxId]) {
          return 0;
        }
        return threadTrxId || 0;
      }) as Record<string, IDbDerivedCommentItem[]>;
      delete map[0];
      return map;
    },

    clear() {
      this.map = {} as Record<string, IDbDerivedCommentItem>;
      this.trxIdsSet.clear();
      this.total = 0;
    },

    setTotal(total: number) {
      this.total = total;
    },

    setHasMoreComments(hasMoreComments: boolean) {
      this.hasMoreComments = hasMoreComments;
    },

    addComments(comments: IDbDerivedCommentItem[]) {
      runInAction(() => {
        for (const comment of comments) {
          const { TrxId } = comment;
          this.map[TrxId] = comment;
          this.trxIdsSet.add(TrxId);
          for (const subComment of comment.Extra.comments || []) {
            const { TrxId } = subComment;
            this.map[TrxId] = subComment;
            this.trxIdsSet.add(TrxId);
          }
        }
      });
    },

    updateComments(comments: IDbDerivedCommentItem[]) {
      runInAction(() => {
        this.newCommentIdsSet.clear();
        for (const comment of comments) {
          const { TrxId } = comment;
          this.map[TrxId] = comment;
          this.trxIdsSet.delete(TrxId);
          this.trxIdsSet.add(TrxId);
          for (const subComment of comment.Extra.comments || []) {
            const { TrxId } = subComment;
            this.map[TrxId] = subComment;
            this.trxIdsSet.delete(TrxId);
            this.trxIdsSet.add(TrxId);
          }
        }
      });
    },

    addComment(comment: IDbDerivedCommentItem, head?: boolean) {
      runInAction(() => {
        const { TrxId } = comment;
        this.map[TrxId] = comment;
        if (head) {
          this.trxIdsSet = new Set([TrxId, ...this.trxIds]);
        } else {
          this.trxIdsSet.add(TrxId);
        }
        this.newCommentIdsSet.add(comment.TrxId);
        this.total += 1;
      });
    },

    updateComment(trxId: string, updatedComment: IDbDerivedCommentItem) {
      this.map[trxId] = updatedComment;
    },

    addCommentToMap(trxId: string, comment: IDbDerivedCommentItem) {
      this.map[trxId] = comment;
    },

    markAsSynced(trxId: string) {
      runInAction(() => {
        this.map[trxId].Status = ContentStatus.synced;
      });
    },

    removeComment(trxId: string) {
      this.newCommentIdsSet.delete(trxId);
      delete this.map[trxId];
      this.trxIdsSet.delete(trxId);
      this.total -= 1;
    },

    setSelectedTopComment(comment: IDbDerivedCommentItem) {
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
