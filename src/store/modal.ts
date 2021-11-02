import * as CommentModel from 'hooks/useDatabase/models/comment';

interface ICommentReplyData {
  commentTrxId: string;
}

interface IObjectDetailData {
  objectTrxId: string;
  selectedCommentOptions?: {
    comment: CommentModel.IDbDerivedCommentItem;
    scrollBlock: 'center' | 'start' | 'end';
    disabledHighlight?: boolean;
  };
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
  };
}
