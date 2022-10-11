import { OBJECT_STATUS_DELETED_LABEL } from 'utils/constant';
import { IContentItem, INoteItem, ILikeItem, ContentTypeUrl, LikeType } from 'apis/content';

export default {
  isUpdateAction(item: IContentItem) {
    return !isJsonNoteContent(item) && item.TypeUrl === ContentTypeUrl.Object && !!(item as INoteItem).Content.id;
  },

  isDeleteAction(item: IContentItem) {
    return !isJsonNoteContent(item) && item.TypeUrl === ContentTypeUrl.Object && !!(item as INoteItem).Content.id && (item as INoteItem).Content.content === OBJECT_STATUS_DELETED_LABEL;
  },

  isObject(item: IContentItem) {
    return !isJsonNoteContent(item) && item.TypeUrl === ContentTypeUrl.Object && (item as INoteItem).Content.type === 'Note' && !('inreplyto' in item.Content) && !('attributedTo' in item.Content);
  },

  isComment(item: IContentItem) {
    return !isJsonNoteContent(item) && item.TypeUrl === ContentTypeUrl.Object && (item as INoteItem).Content.type === 'Note' && 'inreplyto' in item.Content;
  },

  isAttributedTo(item: IContentItem) {
    return !isJsonNoteContent(item) && item.TypeUrl === ContentTypeUrl.Object && (item as INoteItem).Content.type === 'Note' && 'attributedTo' in item.Content;
  },

  isLike(item: IContentItem) {
    return !isJsonNoteContent(item) && item.TypeUrl === ContentTypeUrl.Object && [LikeType.Like, LikeType.Dislike].includes((item as ILikeItem).Content.type);
  },

  isPerson(item: IContentItem) {
    return item.TypeUrl === ContentTypeUrl.Person;
  },
};

const isJsonNoteContent = (item: IContentItem) => {
  try {
    if (item.TypeUrl === ContentTypeUrl.Object && (item as INoteItem).Content.type === 'Note') {
      return isJson((item as INoteItem).Content.content);
    }
  } catch (_) {}
  return false;
};

const isJson = (_item: any) => {
  let item = _item;
  item = typeof item !== 'string' ? JSON.stringify(item) : item;

  try {
    item = JSON.parse(item);
  } catch (e) {
    return false;
  }

  if (typeof item === 'object' && item !== null) {
    return true;
  }

  return false;
};
