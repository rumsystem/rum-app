import { OBJECT_STATUS_DELETED_LABEL } from 'utils/constant';
import { IContentItem, INoteItem, ILikeItem, ContentTypeUrl, LikeType } from 'apis/content';

export default {
  isUpdateAction(item: IContentItem) {
    return item.TypeUrl === ContentTypeUrl.Object && !!(item as INoteItem).Content.id;
  },

  isDeleteAction(item: IContentItem) {
    return item.TypeUrl === ContentTypeUrl.Object && !!(item as INoteItem).Content.id && (item as INoteItem).Content.content === OBJECT_STATUS_DELETED_LABEL;
  },

  isObject(item: IContentItem) {
    return item.TypeUrl === ContentTypeUrl.Object && (item as INoteItem).Content.type === 'Note' && !('inreplyto' in item.Content) && !('attributedTo' in item.Content);
  },

  isComment(item: IContentItem) {
    return item.TypeUrl === ContentTypeUrl.Object && (item as INoteItem).Content.type === 'Note' && 'inreplyto' in item.Content;
  },

  isAttributedTo(item: IContentItem) {
    return item.TypeUrl === ContentTypeUrl.Object && (item as INoteItem).Content.type === 'Note' && 'attributedTo' in item.Content;
  },

  isLike(item: IContentItem) {
    return item.TypeUrl === ContentTypeUrl.Object && [LikeType.Like, LikeType.Dislike].includes((item as ILikeItem).Content.type);
  },

  isPerson(item: IContentItem) {
    return item.TypeUrl === ContentTypeUrl.Person;
  },
};
