import { array, Errors, intersection, literal, partial, string, Type, type, TypeOf, union } from 'io-ts';
import { function as fp, either } from 'fp-ts';
import { IContentItem } from 'apis/content';

const imageContentType = type({
  type: literal('Image'),
  mediaType: string,
  content: string,
});

const imageLinkType = intersection([
  type({
    type: literal('Image'),
    url: string,
  }),
  partial({
    mediaType: string,
  }),
]);

const imageType = union([imageContentType, imageLinkType]);

const partialImages = partial({
  image: union([
    array(imageType),
    imageType,
  ]),
});

const partialImageContents = partial({
  image: union([
    array(imageContentType),
    imageContentType,
  ]),
});

export const postBaseType = intersection([
  type({
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
      partial({
        object: type({
          type: literal('Note'),
          id: string,
        }),
      }),
    ]),
  }),
  partial({
    published: string,
  }),
]);

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

export const commentType = intersection([
  type({
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
  }),
  partial({
    published: string,
  }),
]);

export const postDeleteType = intersection([
  type({
    type: literal('Delete'),
    object: type({
      type: literal('Note'),
      id: string,
    }),
  }),
  partial({
    published: string,
  }),
]);

export const nonUndoCounterType = intersection([
  type({
    type: union([literal('Like'), literal('Dislike')]),
    object: type({
      type: literal('Note'),
      id: string,
    }),
  }),
  partial({
    published: string,
  }),
]);
export const undoCounterType = intersection([
  type({
    type: literal('Undo'),
    object: nonUndoCounterType,
  }),
  partial({
    published: string,
  }),
]);
export const counterType = union([nonUndoCounterType, undoCounterType]);

export const profileType = intersection([
  type({
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
      partialImageContents,
      partial({
        wallet: array(type({
          id: string,
          type: string,
          name: string,
        })),
      }),
    ]),
  }),
  partial({
    published: string,
  }),
]);

export const imageActivityType = intersection([
  type({
    type: literal('Create'),
    object: intersection([
      imageContentType,
      type({
        id: string,
      }),
    ]),
  }),
  partial({
    published: string,
  }),
]);

export const nonUndoRelationType = intersection([
  type({
    type: union([literal('Follow'), literal('Block')]),
    object: type({
      type: literal('Person'),
      id: string,
    }),
  }),
  partial({
    published: string,
  }),
]);
export const undoRelationType = intersection([
  type({
    type: literal('Undo'),
    object: nonUndoRelationType,
  }),
  partial({
    published: string,
  }),
]);
export const relationType = union([nonUndoRelationType, undoRelationType]);

export type ImageContentType = TypeOf<typeof imageContentType>;
export type ImageLinkType = TypeOf<typeof imageLinkType>;
export type ImageType = TypeOf<typeof imageType>;
export type PostType = TypeOf<typeof postBaseType>;
export type CommentType = TypeOf<typeof commentType>;
export type PostDeleteType = TypeOf<typeof postDeleteType>;
export type NonUndoCounterType = TypeOf<typeof nonUndoCounterType>;
export type UndoCounterType = TypeOf<typeof undoCounterType>;
export type CounterType = TypeOf<typeof counterType>;
export type ProfileType = TypeOf<typeof profileType>;
export type ImageActivityType = TypeOf<typeof imageActivityType>;
export type NonUndoRelationType = TypeOf<typeof nonUndoRelationType>;
export type UndoRelationType = TypeOf<typeof undoRelationType>;
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
