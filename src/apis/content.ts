import request from '../request';
import qs from 'query-string';
import getBase from 'utils/getBase';

export enum ContentTypeUrl {
  Object = 'quorum.pb.Object',
  Person = 'quorum.pb.Person',
}

export interface IPostContentResult {
  trx_id: string
}

export type IContentItem = INoteItem | ILikeItem | IPersonItem;

export interface IContentItemBasic {
  TrxId: string
  Publisher: string
  TypeUrl: string
  TimeStamp: number
}

export interface INoteItem extends IContentItemBasic {
  Content: INote
}

export interface ILikeItem extends IContentItemBasic {
  Content: ILike
}

export interface INote {
  type: 'Note'
  content: string
  name?: string
  inreplyto?: {
    trxid: string
  }
  image?: IImage[]
}

export interface ILike {
  type: LikeType
  id: string
}

export interface IImage {
  mediaType: string
  name: string
  content: string
}

export interface INotePayload {
  type: string
  object: INote
  target: {
    id: string
    type: string
  }
}

export enum LikeType {
  Like = 'Like',
  Dislike = 'Dislike',
}

export interface ILikePayload {
  type: LikeType
  object: {
    id: string
  }
  target: {
    id: string
    type: string
  }
}

export interface IPersonItem extends IContentItemBasic {
  Content: IPerson
}

export interface IPerson {
  name: string
  image?: {
    mediaType: string
    content: string
  }
  wallet?: Array<IWalletItem>
}


export interface IProfilePayload {
  type: string
  person: IPerson
  target: {
    id: string
    type: string
  }
}

export interface IWalletItem {
  id: string
  type: string
  name: string
}

export default {
  fetchContents(
    groupId: string,
    options: {
      num: number
      starttrx?: string
      reverse?: boolean
    },
  ) {
    return request(
      `/app/api/v1/group/${groupId}/content?${qs.stringify(options)}`,
      {
        method: 'POST',
        base: getBase(),
        body: { senders: [] },
        jwt: true,
      },
    ) as Promise<null | Array<IContentItem>>;
  },
  postNote(content: INotePayload) {
    return request('/api/v1/group/content', {
      method: 'POST',
      base: getBase(),
      body: content,
      jwt: true,
    }) as Promise<IPostContentResult>;
  },
  like(likeContent: ILikePayload) {
    return request('/api/v1/group/content', {
      method: 'POST',
      base: getBase(),
      body: likeContent,
      jwt: true,
    }) as Promise<IPostContentResult>;
  },
  updateProfile(profile: IProfilePayload) {
    return request('/api/v1/group/profile', {
      method: 'POST',
      base: getBase(),
      body: profile,
      jwt: true,
    }) as Promise<IPostContentResult>;
  },
};
