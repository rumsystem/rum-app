import type { IDbDerivedCommentItem } from 'hooks/useDatabase/models/comment';

export interface ICommentReplyData {
  commentTrxId: string
}

export interface IObjectDetailData {
  objectTrxId: string
  selectedCommentOptions?: {
    comment: IDbDerivedCommentItem
    scrollBlock: 'center' | 'start' | 'end'
    disabledHighlight?: boolean
  }
}

export interface IMixinPaymentProps {
  name: string
  mixinUID: string
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

    mixinPayment: {
      open: false,
      props: {} as IMixinPaymentProps,
      show(props: IMixinPaymentProps) {
        this.open = true;
        this.props = props;
      },
      hide() {
        this.open = false;
        this.props = {} as IMixinPaymentProps;
      },
    },
  };
}
