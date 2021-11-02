export interface GetGroupsResult {
  groups: Array<Group> | null
}

export interface Group {
  OwnerPubKey: string
  GroupId: string
  GroupName: string
  LastUpdate: number
  LatestBlockNum: number
  LatestBlockId: string
  GroupStatus: 'GROUP_READY' | 'GROUP_SYNCING'
}

export interface CreateGroupsResult {
  genesis_block: GenesisBlock
  group_id: string
  group_name: string
  owner_pubkey: string
  signature: string
}

export interface GenesisBlock {
  Cid: string
  GroupId: string
  PrevBlockId: string
  BlockNum: number
  Timestamp: number
  Hash: string
  PreviousHash: string
  Producer: string
  Signature: string
  Trxs: null
}

export interface GroupResult {
  group_id: string
  signature: string
}

export interface ContentItem {
  TrxId: string
  Publisher: string
  Content: {
    content: string
    name: string
    type: string
  }
  TimeStamp: number
}

export interface PostContentResult {
  trx_id: string
}

export interface DeleteGroupResult extends GroupResult{
  owner_pubkey: string
}

export interface NodeInfo {
  node_publickey: string
  node_status: string
  node_version: string
}

export interface Trx {
  Msg: {
    TrxId: string
    MsgType: number
    Sender: string
    GroupId: string
    Data: string
    Version: string
    TimeStamp: number
  }
  Data: string
  Consensus: Array<string>
}
