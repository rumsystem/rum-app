import type { IDbDerivedCommentItem } from 'hooks/useDatabase/models/comment';

export interface ICommentReplyData {
  commentTrxId: string
}

export interface IObjectDetailData {
  objectTrxId: string
  selectedCommentOptions?: ISelectedCommentOptions
}

export interface IForumObjectDetailData {
  objectTrxId: string
  selectedCommentOptions?: ISelectedCommentOptions
  scrollToComments?: boolean
}

interface ISelectedCommentOptions {
  comment: IDbDerivedCommentItem
  scrollBlock: 'center' | 'start' | 'end'
  disabledHighlight?: boolean
}

export function createModalStore() {
  return {
    pageLoading: {
      open: false,
      show() {
        this.open = true;
      },
      hide() {
        this.open = false;
      },
    },

    commentReply: {
      open: false,
      data: {} as ICommentReplyData,
      show(data: ICommentReplyData) {
        this.data = data;
        this.open = true;
      },
      hide() {
        this.open = false;
      },
    },

    objectDetail: {
      open: false,
      data: {} as IObjectDetailData,
      show(data: IObjectDetailData) {
        this.data = data;
        this.open = true;
      },
      hide() {
        this.open = false;
      },
    },

    forumObjectDetail: {
      open: false,
      data: {} as IForumObjectDetailData,
      show(data: IForumObjectDetailData) {
        this.data = data;
        this.open = true;
      },
      hide() {
        this.open = false;
      },
    },

    myNodeInfo: {
      show: false,
      open() {
        this.show = true;
      },
      close() {
        this.show = false;
      },
    },
  };
}
