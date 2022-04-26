import type { Content } from './cn';

export const content: Content = {
  refresh: 'Reload App',
  reload: 'reload',
  checkForUpdate: 'Check Update',
  dev: 'Developer',
  devtools: 'Toogle Devtools',
  modeToggle: 'Switch Internal/External Mode',
  exportLogs: 'Export Logs',
  clearCache: 'Clear Local Cache',
  help: 'Help',
  manual: 'Manual',
  report: 'Report Issue',
  about: 'About Rum',
  switchLang: 'Change Language',
  filterByType: '',
  shareSeed: '',
  info: '',
  exit: '',
  name: '',
  owner: '',
  highestBlockId: '',
  highestHeight: '',
  lastUpdated: '',
  status: '',
  groupInfo: '',
  joinGroup: '',
  createGroup: '',
  welcomeToUseRum: '',
  youCanTry: '',
  noTypeGroups: '',
  selectSeedFile: '',
  selectedSeedFile: '',
  selectSeedToJoin: '',
  or: '',
  paste: '',
  pasteSeedText: '',
  yes: 'yes',
  availablePublicGroups: '',
  chooseTemplate: '',
  groupTypeDesc: '',
  sns: '',
  forum: '',
  note: '',
  all: '',
  joined: '',
  created: '',
  existMember: '',
  document: '',
  snsDesc: '',
  forumDesc: '',
  noteDesc: '',
  cancel: '',
  noteAndNetwork: '',
  storageDir: '',
  versionAndStatus: '',
  version: '',
  networkStatus: '',
  myNode: '',
  connectedNodes: (n: number) => `已连接 ${n} 个节点`,
  failToSync: '',
  comment: '',
  reply: '',
  noMessages: '',
  publishComment: '',
  receiveNewContent: '',
  nContent: (n: number) => `${n} 条内容`,
  ago: '',
  anyIdeas: '',
  publish: '',
  publishFirstPost: '',
  back: '',
  input: (name: string) => `请输入${name}`,
  title: '',
  content: '',
  publishFirstNote: '',
  unFollowing: '',
  delete: '',
  exited: '',
  somethingWrong: '',
  confirmToExit: '',
  confirmToDelete: '',
  settingDone: '',
  confirmToUnBan: '',
  confirmToBan: '',
  submittedWaitForSync: '',
  confirmToDelDenied: '',
  unFollowHim: '',
  followHim: '',
  blockInfo: '',
  sender: '',
  group: '',
  data: '',
  sign: '',
  timestamp: '',
  failToLoad: '',
  idle: '',
  syncing: '',
  syncFailed: '',
  require: (name: string) => `请输入${name}`,
  requireMinLength: (name: string, length: number) => `${name}至少要输入${length}个字哦`,
  requireMaxLength: (name: string, length: number) => `${name}不能超过${length}个字哦`,
  notFound: (name: string) => `${name}不存在`,
  groupName: '',
  applyToAll: '',
  applyToAllForProfile: '',
  connected: '',
  failToFetchMixinProfile: '',
  connectMixinPrivacyTip: '',
  tipByMixinPrivacyTip: '',
  mixinScanToConnect: '',
  noMixinOnYourPhone: '',
  toDownload: '',
  waitForSyncingDoneToSubmitProfile: '',
  waitForSyncingDone: '',
  syncFailedTipForProfile: '',
  waitForSyncingDoneToSubmitContent: '',
  syncFailedTipForContent: '',
  editProfile: '',
  nickname: '',
  connectMixinForTip: '',
  connectWallet: '',
  connectedMixinId: (id: string) => `已连接 Mixin 钱包，地址是 ${id}`,
  beBannedTip: '',
  beBannedTip2: '',
  beBannedTip3: '',
  beBannedTip4: '',
  beBannedTip6: '',
  andNewIdea: '',
  copy: '',
  copied: '',
  copySeed: '',
  downloadSeed: '',
  downloadedThenShare: '',
  exitNode: '',
  exitConfirmTextWithGroupCount: (ownerGroupCount: number) => `你创建的 ${ownerGroupCount} 个群组需要你保持在线，维持出块。如果你的节点下线了，这些群组将不能发布新的内容，确定退出吗？`,
  exitConfirmText: '',
  syncingContentTip: '',
  syncingContentTip2: '',
  invalidPassword: '',
  failToStartNode: '',
  reEnter: '',
  reset: '',
  hasReset: '',
  failToAccessExternalNode: (host: string, port: number) => `开发节点无法访问，请检查一下<br />${host}:${port}`,
  tryAgain: '',
  tipped: '',
  search: '',
  selectToken: '',
  selectOtherToken: '',
  tipTo: '',
  amount: '',
  tipNote: '',
  optional: '',
  next: '',
  mixinPay: '',
  scanQrCodeByMixin: '',
  willRefreshAfterPayment: '',
  exiting: '',
  connectedPeerCount: (count: number) => `已连接 ${count} 个节点`,
  connectedPeerCountTip: (count: number) => `你的节点已连接上网络中的 ${count} 个节点`,
  signupNode: '',
  signupNodeTip: '',
  loginNode: '',
  loginNodeTip: '',
  proxyToExternalNode: '',
  port: '',
  tslCert: '',
  selectCert: '',
  failToOpenFile: '',
  startingNodeTip1: '',
  startingNodeTip2: '',
  startingNodeTip3: '',
  startingNodeTip4: '',
  startingNodeTip5: '',
  updatingQuorum: '',
  nodeDataNotExist: '',
  keyStoreNotExist: '',
  deprecatedNodeData: '',
  externalNode: '',
  selectExternalNodeStoragePath: '',
  storagePathTip1: '',
  storagePathTip2: '',
  storagePathTip3: '',
  storagePathTip4: '',
  storagePathLoginTip1: '',
  storagePathLoginTip2: '',
  storagePathLoginTip3: '',
  storagePathLoginTip4: '',
  edit: '',
  selectFolder: '',
  tip: '',
  contentCount: (count: number) => `<span className="text-14 font-bold mr-1">${count}</span>条内容`,
  confirmToExitNode: '',
  exitBeforeEditingExternalNodeInfo: '',
  nodeInfo: '',
  nodeAndNetwork: '',
  savePassword: '',
  savePasswordTip: '',
  confirmPassword: '',
  enterNewPassword: '',
  enterPassword: '',
  password: '',
  passwordNotMatch: '',
  unableToUseAutoUpdate: '',
  gotIt: '',
  unableToDownloadUpdate: '',
  download: '',
  updateNextTime: '',
  newVersion: '',
  published: '',
  update: '',
  doItLater: '',
  reloadAfterDownloaded: '',
  isLatestVersion: '',
  downloadingNewVersionTip: '',
  downloadingNewVersion: '',
  clickToSync: '',
  myHomePage: '',
  like: '',
  open: '',
  lastReadHere: '',
  replyYourComment: '',
  replyYourContent: '',
  likeFor: (name: string) => `赞了你的${name}`,
  object: '',
  empty: (name: string) => `还没有${name}`,
  message: '',
  afterUnFollowTip: '',
  confirmToUnFollow: '',
  ban: '',
  unBan: '',
  checkMoreComments: (count: number) => `共${count}条评论，点击查看`,
  expandComments: (count?: number) => `展开${count}条回复 `,
  totalReply: (count: number) => `共${count}条回复`,
  totalObjects: (count: number) => `${count} 条内容`,
  createFirstOne: (type: string) => `发布你的第一条${type}吧 ~`,
  forumPost: '',
  getNewObject: '',
  loading: '',
  noMore: (type: string) => `没有更多${type}了哦`,
  emptySearchResult: '',
  emptyImageSearchResult: '',
  expandContent: '',
  unExpandContent: '',
  tipWithRum: '',
  imageSearchTip1: '',
  imageSearchTip2: '',
  pixabayLicenseTip: '',
  keyword: '',
  latestForumPost: '',
  createForumPost: '',
  createFirstForumPost: '',
  sortByHot: '',
  sortByDate: '',
  latest: '',
  hot: '',
  publishYourComment: '',
  htmlCode: '',
  quotePlaceholder: '',
  clickToTune: '',
  orDragToMove: '',
  convertTo: '',
  add: '',
  text: '',
  heading: '',
  list: '',
  quote: '',
  delimiter: '',
  rawHTML: '',
  link: '',
  marker: '',
  table: '',
  bold: '',
  italic: '',
  image: '',
  moveUp: '',
  moveDown: '',
  addALink: '',
  canDisplayedBlock: '',
  searchText: '',
  confirmToFollow: '',
  unFollowingList: '',
  follow: '',
  confirmToClearCacheData: '',
  expand: '',
  selectFromImageLib: '',
  selectAvatar: '',
  uploadImage: '',
  selectProvider: '',
  moveOrDragImage: '',
  replace: '',
  upload: '',
  tokenAmount: '',
  reconnecting: '',
  justNow: '',
  minutesAgo: '',
  hoursAgo: '',
};
