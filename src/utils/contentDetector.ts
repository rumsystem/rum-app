import { array, Errors, intersection, literal, partial, string, Type, type, TypeOf, union } from 'io-ts';
import { function as fp, either } from 'fp-ts';
import { IContentItem } from 'apis/content';

const imageType = type({
  type: literal('Image'),
  mediaType: string,
  content: string,
});

export type ImageType = TypeOf<typeof imageType>;

const partialImages = partial({
  image: union([
    array(imageType),
    imageType,
  ]),
});

export const postBaseType = type({
  type: literal('Create'),
  object: intersection([
    partialImages,
    type({
      type: literal('Note'),
      id: string,
      content: string,
    }),
    partial({
      name: string,
    }),
  ]),
});

export const postExcludedType = type({
  type: literal('Create'),
  object: type({
    type: literal('Note'),
    inreplyto: type({
      type: literal('Note'),
      id: string,
    }),
  }),
});

export type PostType = TypeOf<typeof postBaseType>;

export const postType = new Type<PostType>(
  'post type',
  (u): u is PostType => postBaseType.is(u) && !postExcludedType.is(u),
  (u, c) => fp.pipe(
    postBaseType.validate(u, c),
    either.chain(() => fp.pipe(
      postExcludedType.validate(u, c),
      either.match(
        () => either.right(u),
        () => either.left([{
          value: u,
          context: c,
          message: 'item has unwanted properties',
        }] as Errors),
      ),
    )),
    either.map((v) => v as PostType),
  ),
  fp.identity,
);

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
    partialImages,
    partial({
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
    return either.isRight(postType.decode(item.Data));
  },
  isComment(item: IContentItem) {
    return either.isRight(commentType.decode(item.Data));
  },
  isPostDelete(item: IContentItem) {
    return either.isRight(postDeleteType.decode(item.Data));
  },
  isCounter(item: IContentItem) {
    return either.isRight(counterType.decode(item.Data));
  },
  isProfile(item: IContentItem) {
    return either.isRight(profileType.decode(item.Data));
  },
  isImage(item: IContentItem) {
    return either.isRight(imageActivityType.decode(item.Data));
  },
  isRelation(item: IContentItem) {
    return either.isRight(relationType.decode(item.Data));
  },
  isEmptyObject(item: IContentItem) {
    return !item.Data || (typeof item.Data === 'object' && Object.keys(item.Data).length === 0);
  },
};
