import { array, intersection, literal, partial, string, type, TypeOf, union } from 'io-ts';
import { IContentItem } from 'apis/content';
import { either } from 'fp-ts';

const imageType = type({
  type: literal('Image'),
  mediaType: string,
  content: string,
});

export type ImageType = TypeOf<typeof imageType>;

const partialImages = partial({
  images: array(imageType),
});

export const postType = type({
  type: literal('Create'),
  object: intersection([
    partialImages,
    type({
      type: literal('Note'),
      id: string,
      name: string,
      content: string,
    }),
  ]),
});
export type PostType = TypeOf<typeof postType>;

export const commentType = type({
  type: literal('Create'),
  object: intersection([
    partialImages,
    type({
      type: literal('Note'),
      id: string,
      content: string,
      inreplyto: type({
        type: literal('Note'),
        id: string,
      }),
    }),
  ]),
});
export type CommentType = TypeOf<typeof commentType>;

export const postDeleteType = type({
  type: literal('Delete'),
  object: type({
    type: literal('Note'),
    id: string,
  }),
});
export type PostDeleteType = TypeOf<typeof postDeleteType>;

export const nonUndoCounterType = type({
  type: union([literal('Like'), literal('Dislike')]),
  object: type({
    type: literal('Note'),
    id: string,
  }),
});
export type NonUndoCounterType = TypeOf<typeof nonUndoCounterType>;
export const undoCounterType = type({
  type: literal('Undo'),
  object: nonUndoCounterType,
});
export type UndoCounterType = TypeOf<typeof undoCounterType>;
export const counterType = union([nonUndoCounterType, undoCounterType]);
export type CounterType = TypeOf<typeof counterType>;

export const profileType = type({
  type: literal('Create'),
  object: intersection([
    type({
      type: literal('Profile'),
      name: string,
      describes: type({
        type: literal('Person'),
        id: string,
      }),
    }),
    partial({
      avatar: imageType,
      wallet: array(type({
        id: string,
        type: string,
        name: string,
      })),
    }),
  ]),
});
export type ProfileType = TypeOf<typeof profileType>;

export const imageActivityType = type({
  type: literal('Create'),
  object: intersection([
    imageType,
    type({
      id: string,
    }),
  ]),
});
export type ImageActivityType = TypeOf<typeof imageActivityType>;

export const nonUndoRelationType = type({
  type: union([literal('Follow'), literal('Block')]),
  object: type({
    type: literal('Person'),
    id: string,
  }),
});
export type NonUndoRelationType = TypeOf<typeof nonUndoRelationType>;
export const undoRelationType = type({
  type: literal('Undo'),
  object: nonUndoRelationType,
});
export type UndoRelationType = TypeOf<typeof undoRelationType>;
export const relationType = union([nonUndoRelationType, undoRelationType]);
export type RelationType = TypeOf<typeof relationType>;

export default {
  isPost(item: IContentItem) {
    return either.isRight(postType.decode(item.Content));
  },
  isComment(item: IContentItem) {
    return either.isRight(commentType.decode(item.Content));
  },
  isPostDelete(item: IContentItem) {
    return either.isRight(postDeleteType.decode(item.Content));
  },
  isCounter(item: IContentItem) {
    return either.isRight(counterType.decode(item.Content));
  },
  isProfile(item: IContentItem) {
    return either.isRight(profileType.decode(item.Content));
  },
  isImage(item: IContentItem) {
    return either.isRight(imageActivityType.decode(item.Content));
  },
  isRelation(item: IContentItem) {
    return either.isRight(relationType.decode(item.Content));
  },
};
