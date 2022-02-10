import request from '../request';
import qs from 'query-string';
import getBase from 'utils/getBase';

export interface IObject {
  type: string
  content: string
  name?: string
  inreplyto?: {
    trxid: string
  }
  image?: IImage[]
}

export type IContentItem = IObjectItem | IPersonItem | IVoteItem;

export interface IContentItemBasic {
  TrxId: string
  Publisher: string
  TypeUrl: string
  TimeStamp: number
}

export interface IObjectItem extends IContentItemBasic {
  Content: IObject
}

export interface IImage {
  mediaType: string
  name: string
  content: string
}

export interface IWalletItem {
  id: string
  type: string
  name: string
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


export interface IVoteItem extends IContentItemBasic {
  Content: IVote
}

export interface IVote {
  type: IVoteType
  objectTrxId: string
  objectType: IVoteObjectType
}

export enum IVoteType {
  up = 'up',
  down = 'down',
}

export enum IVoteObjectType {
  object = 'object',
  comment = 'comment',
}

export enum ContentTypeUrl {
  Object = 'quorum.pb.Object',
  Person = 'quorum.pb.Person',
  Vote = 'quorum.pb.Vote',
}

export interface IProfilePayload {
  type: string
  person: IPerson
  target: {
    id: string
    type: string
  }
}

export interface IContentPayload {
  type: string
  object: IObject
  target: {
    id: string
    type: string
  }
}

export interface IPostContentResult {
  trx_id: string
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
  postContent(content: IContentPayload) {
    return request('/api/v1/group/content', {
      method: 'POST',
      base: getBase(),
      body: content,
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
