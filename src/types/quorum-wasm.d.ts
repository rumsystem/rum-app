declare const qwasm: {
  StartQuorum: (...p: Array<any>) => Promise<any>
  StopQuorum: (...p: Array<any>) => Promise<any>
  StartSync: (...p: Array<any>) => Promise<any>
  Announce: (...p: Array<any>) => Promise<any>
  GetGroupProducers: (...p: Array<any>) => Promise<any>
  GetAnnouncedGroupProducers: (...p: Array<any>) => Promise<any>
  GroupProducer: (...p: Array<any>) => Promise<any>
  CreateGroup: (...p: Array<any>) => Promise<any>
  MgrGrpBlkList: (...p: Array<any>) => Promise<any>
  GetDeniedUserList: (...p: Array<any>) => Promise<any>
  UpdateProfile: (...p: Array<any>) => Promise<any>
  GetTrx: (...p: Array<any>) => Promise<any>
  PostToGroup: (...p: Array<any>) => Promise<any>
  GetNodeInfo: (...p: Array<any>) => Promise<any>
  GetNetwork: (...p: Array<any>) => Promise<any>
  GetContent: (...p: Array<any>) => Promise<any>
  JoinGroup: (...p: Array<any>) => Promise<any>
  LeaveGroup: (...p: Array<any>) => Promise<any>
  ClearGroupData: (...p: Array<any>) => Promise<any>
  GetGroups: (...p: Array<any>) => Promise<any>
};
