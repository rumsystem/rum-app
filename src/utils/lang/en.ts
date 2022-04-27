export const content = {
  refresh: 'Reload',
  reload: 'Restart',
  restoreDefault: 'Restore default',
  reloadForUpdate: 'Restart to update',
  checkForUpdate: 'Check for updates',
  dev: 'Debug',
  devtools: 'Developer Tools',
  modeToggle: 'Switch Internal/External Mode',
  exportLogs: 'Export Logs...',
  clearCache: 'Clear Local Cache...',
  relaunch: 'Relaunch...',
  help: 'Help',
  manual: 'Manual...',
  report: 'Report Issues...',
  about: 'About Rum',
  switchLang: 'Language',
  exportKey: 'Key Export...',
  importKey: 'Key Import...',
  allSeedNets: 'All SeedNets',
  noSeedNetSearchResult: 'No matched SeedNets.',
  filterByType: 'Filter with template',
  share: 'Share',
  shareSeed: 'Sharing seed',
  seedNet: 'SeedNet',
  info: 'Info',
  exit: 'Exit',
  name: 'Name',
  owner: 'Owner',
  highestBlockId: 'Latest block',
  highestHeight: 'Number of blocks',
  lastUpdated: 'Last Updated',
  status: 'Status',
  groupInfo: 'SeedNet Info.',
  joinGroup: 'Join a SeedNet',
  joinSeedGroup: 'Join this SeedNet',
  openSeedGroup: 'Open this SeedNet',
  createGroup: 'Create new SeedNet',
  welcomeToUseRum: 'Welcome to Rum',
  youCanTry: 'Now you could:',
  noTypeGroups: 'There is no SeedNet of this template type',
  selectSeedFile: 'Open a local seed file',
  selectedSeedFile: 'Seed has been read from a file',
  selectSeedToJoin: 'Select the seed file to join the SeedNet',
  seedParsingError: 'Parsing seed failed',
  selectKeyBackupFile: 'Select backup file',
  selectFolderToSaveKeyBackupFile: 'Select folder to save backup file',
  selectedKeyBackupFile: 'Backup file is selected',
  selectKeyBackupToImport: 'Select the backup file to import the Key',
  or: 'Or',
  paste: 'Paste text',
  pasteSeedText: 'Paste seed text',
  pasteKeyBackupText: 'Paste key backup text',
  yes: 'OK',
  availablePublicGroups: 'Any SeedNets recommended?',
  chooseTemplate: 'Choose a template',
  groupTypeDesc: 'The template type are assigned for how members could distribute and interact with contents in the SeedNet. Each template has been specialized designed and optimized for its usage, and will be different in terms of publishing methods, economic systems, social relationships, administrator permissions, member managements and other functions. ',
  sns: 'Feed',
  forum: 'BBS',
  note: 'Private Note',
  notebook: 'Notebook',
  all: 'All',
  allType: 'All Types',
  joined: 'Successfully Joined',
  created: 'Successfully Created',
  existMember: 'You are already a member of this SeedNet.',
  document: 'Document',
  snsDesc: "A Twitter-like SNS template. All posts are presented on the timeline and readable to all members in this SeedNet. Members can post short text w/wo images, or leave comments, like and reward others' posts. Someone can be muted from one's timeline or the SeedNet. A certain amount of post fee can be set by owner.",
  forumDesc: 'A forum or bulletin-board template. Posts can be organized by owner-created categories. All members can submit posts that are then liked-up or thumb-down by others. Six layers of replies are supported under each post to encourage in-depth discussions. A certain amount of post fee and reply fee can be set by owner.',
  noteDesc: 'A private notebook template. Owner or members with permissions only, can submit or read/decrypt notes. All notes are encrypted and stored on the chain. It can be used as private notebook, multi-author diary or for archiving and encrypting docs. Owner can build several nodes to maintain a small private SeedNet to backup and synchronize data through decentralized network.',
  cancel: 'Cancel',
  save: 'Save',
  saved: 'Saved',
  savedAndWaitForSyncing: 'Saved, syncing in progress, It usually takes 20 seconds.',
  storageDir: 'Data-storage Folder',
  nodeParams: 'Params',
  version: 'Version',
  networkStatus: 'Network',
  myNode: 'My Node',
  connectedNodes: (n: number) => `${n} nodes connected`,
  failToSync: 'Sync failed',
  comment: 'Comment',
  reply: 'Reply',
  noMessages: 'No messages received ~',
  receiveNewContent: 'Something New',
  ago: '1 hour ago',
  anyIdeas: 'What\'s Up?',
  publish: 'Post',
  publishFirstTimeline: 'Publish your first content',
  publishFirstPost: 'Publish your first post',
  back: 'Back',
  backOneStep: 'Previous Step',
  input: (name: string) => `Please enter ${name}`,
  title: 'Title',
  content: 'Content',
  delete: 'Delete',
  deleted: 'Deleted',
  exited: 'Leaved',
  somethingWrong: 'Oops, something went wrong.',
  confirmToExit: 'Are you sure to leave this SeedNet?',
  confirmToExitAll: 'Are you sure to leave these SeedNets?',
  confirmToDelete: 'Are you sure to delete this SeedNet?',
  settingDone: 'Setting successfully saved.',
  submittedWaitForSync: 'The request has been submitted, waiting for other nodes to synchronize',
  confirmToBan: 'Are you sure to ban this user from posting in this SeedNet?',
  confirmToUnban: 'Are you sure to unban this user from posting in this SeedNet?',
  blockInfo: 'Block Info',
  sender: 'Sender',
  group: 'SeedNet',
  data: 'Data',
  sign: 'Signature',
  timestamp: 'Timestamp',
  failToLoad: 'Failed to Load',
  idle: 'Idle',
  syncing: 'Syncing',
  syncFailed: 'Sync failed',
  require: (name: string) => `Please enter ${name}`,
  requireMaxLength: (name: string, length: number) => `Maximum allowed ${length} characters for ${name}.`,
  notFound: (name: string) => `${name} does not exist.`,
  groupName: 'SeedNet Name',
  desc: 'Description',
  groupDesc: 'SeedNet Description',
  connected: 'Connected',
  failToFetchMixinProfile: 'Failed to obtain Mixin Profile',
  connectMixinPrivacyTip: 'Your Mixin account will be exposed to the one who transfered crypto to you. Anonymous transaction feature is upcoming.',
  tipByMixinPrivacyTip: 'Your Mixin Account will be exposed to whom you rewarded. Anonymous transaction feature is upcoming.',
  mixinScanToConnect: 'Scan QR Code with Mixin to link your wallet.',
  noMixinOnYourPhone: 'No Mixin installed?',
  toDownload: 'Download Mixin...',
  waitForSyncingDoneToSubmitProfile: 'Syncing SedNet data, you can edit the profile after sync is completed.',
  waitForSyncingDone: 'Syncing profile data, edited profile will be shown after sync is completed.',
  syncFailedTipForProfile: 'Failed to sync SeedNet data, unable to update profile.',
  waitForSyncingDoneToSubmit: 'Syncing SedNet data, you can post after sync is completed.',
  syncFailedTipForSubmit: 'Failed to sync SeedNet data, unable to post.',
  editProfile: 'Edit Profile',
  nickname: 'Nickname',
  connectMixinForTip: 'Link Mixin wallet to get rewards.',
  connectWallet: 'Link Wallet',
  bindWallet: 'Link Wallet',
  bindNewWallet: 'Link New Wallet',
  connectedMixinId: (id: string) => `Link to the Mixin wallet, the address is ${id}`,
  beBannedTip: 'You are banned by the administrator of this SedNet from posting.',
  andNewIdea: 'What\'s new?',
  copy: 'Copy',
  copied: 'Copied',
  copySeed: 'Copy seed above',
  copySeedOr: 'or',
  downloadSeed: 'Download seed file',
  downloadedThenShare: 'Download complete! Share the seed file to your friends now.',
  downloadBackup: 'Download Backup File',
  downloadedBackup: 'Download Complete',
  exitNode: 'Exit Node',
  exitConfirmTextWithGroupCount: (ownerGroupCount: number) => `Your node is producing blocks for ${ownerGroupCount} SeedNets. These SeedNets will fail for members to post new content if the node is offline. Are you sure to take it offline?`,
  exitConfirmText: 'Your node is about to go offline, are you sure to quit?', // to "quit" rum app
  syncingContentTip: 'Syncing for new content, please wait.',
  syncingContentTip2: 'Syncing to other nodes, click to check status.',
  invalidPassword: 'Invalid password, please re-input.',
  failToStartNode: 'Failed to start node, please try again.',
  reEnter: 'Re-input',
  reset: 'Reset',
  failToAccessExternalNode: (host: string, port: string) => `The external node cannot be accessed.<br />${host}: ${port}`,
  tryAgain: 'Try Again',
  tipped: 'Rewarded Successfully!',
  search: 'Search',
  selectToken: 'Select Cryptocurrency',
  selectOtherToken: 'Select Other Cryptocurrency',
  tipTo: 'Reward to',
  amount: 'Amount',
  tipNote: 'Notes',
  optional: 'Optional',
  next: 'Next',
  mixinPay: 'Use Mixin to scan and pay.',
  scanQrCodeByMixin: 'Please use Mixin to scan the QR code.',
  willRefreshAfterPayment: 'The page will refresh automatically after the payment is completed.',
  exiting: 'Node is going offline.',
  connectedPeerCount: (count: number) => `Connected ${count} nodes`,
  connectedPeerCountTip: (count: number) => `Your node is connected to ${count} nodes in the network`,
  signupNode: 'Create Node',
  signupNodeTip: 'First time to use.',
  loginNode: 'Bring Node Online',
  loginNodeTip: 'Already have a node before.',
  setExternalNode: 'Set External Node',
  port: 'Port',
  tslCert: 'TLS Certificate',
  failToOpenFile: 'Failed to read the file!',
  startingNodeTip1: 'Starting Node',
  startingNodeTip2: 'Successfully Connected, initializing, please wait...',
  startingNodeTip3: 'Coming soon...',
  startingNodeTip4: 'Loading...',
  startingNodeTip5: 'Trying to connect to the network, please wait...',
  updatingQuorum: 'Updating Services',
  nodeDataNotExist: 'No node data in the folder you selected, please check.',
  keyStoreNotExist: 'No Keystore data in the folder, please check.',
  deprecatedNodeData: 'This folder was generated by the old version, it is not supported by the current version.', // Please downgrade or create a new folder.
  externalNode: 'External Node',
  externalMode: 'External Mode',
  wasmNode: 'Browser Node',
  wasmNodeTip: 'Run RUM in a Browser',
  externalNodeTip: 'Connect to available node',
  selectExternalNodeStoragePathTip1: 'Running on external node may create some data temporarily.',
  selectExternalNodeStoragePathTip2: 'Select a folder for storage.',
  storagePathTip1: 'Please select a folder to store node data.',
  storagePathTip2: 'The data belongs to you only', // mark
  storagePathTip3: 'We do not store your data, so we cannot retrieve it for you.',
  storagePathTip4: 'Please keep it in a safe place.', // It is on your own to keep it safe.
  storagePathLoginTip1: 'You have selected a folder when a node was created, open the folder again to log into to the node.',
  storagePathLoginTip2: '',
  storagePathLoginTip3: '',
  storagePathLoginTip4: '',
  edit: 'Modify',
  selectFolder: 'Select Folder',
  tip: 'Reward',
  contentCount: (count: number) => `${count} Posts`,
  confirmToExitNode: 'Are you sure to take the node offline?',
  nodeInfo: 'Node Info',
  nodeAndNetwork: 'Node and Network...',
  savePassword: 'Remember Password',
  savePasswordTip: 'Autofill the password next time.',
  confirmPassword: 'Confirm Password',
  enterNewPassword: 'Set Password',
  enterPassword: 'Enter Password',
  password: 'Password',
  passwordNotMatch: 'Password do not match',
  unableToUseAutoUpdate: 'Failed to fetch the latest version, please contact us to download the latest version.',
  gotIt: 'I got it',
  unableToDownloadUpdate: 'Failed to update automatically, click to download the latest version.',
  download: 'Download',
  updateNextTime: 'Skip This Version',
  newVersion: 'New Version',
  published: 'Published',
  update: 'Update',
  doItLater: 'Do It Later',
  reloadAfterDownloaded: 'Latest version of Rum is ready now, restart to use.',
  isLatestVersion: 'Your Rum is up to date!',
  downloadingNewVersionTip: 'Downloading a new version... You will be notified when the upgrade can be installed.',
  downloadingNewVersion: 'Downloading a new version',
  clickToSync: 'Click to synchronize the latest content',
  myHomePage: 'My Home Page',
  like: 'Like',
  open: 'Show More',
  lastReadHere: 'Last Read Here',
  replyYourComment: 'replied to you',
  replyYourContent: 'commented on your post',
  likeFor: (name: string) => `liked your ${name}`,
  object: 'Post',
  empty: (name: string) => `No ${name}`,
  message: 'Message',
  ban: 'Ban',
  banned: 'Banned',
  unban: 'Unban',
  checkMoreComments: (count: number) => `${count} comments, click to show all`,
  expandComments: (count?: number) => `Show ${count} replies `,
  totalReply: (count: number) => `${count} replies`,
  totalObjects: (count: number) => `${count} items`,
  createFirstOne: (type: string) => `Your first ${type} will be here~`, // "publish" is not suitable for private contents.
  forumPost: 'Post',
  getNewObject: 'New Post Received',
  loading: 'Loading...',
  noMore: (type: string) => `No more ${type}`,
  emptySearchResult: 'No results found~',
  emptyImageSearchResult: 'No pictures found for your search criteria~',
  expandContent: '...Show More...',
  unExpandContent: '...Show Less...',
  tipWithRum: 'Ye Buy Me Rum!',
  imageSearchTip1: 'Try another keyword',
  imageSearchTip2: 'Or try another language',
  pixabayLicenseTip: 'All pictures are released under the Pixabay License, which are free to use.',
  keyword: 'Keyword',
  latestForumPost: 'Latest Posts',
  createForumPost: 'New Post',
  createFirstForumPost: 'Publish your first post',
  latest: 'Latest',
  hot: 'Hot',
  publishYourComment: 'Submit your comment...',
  add: 'Add',
  text: 'Text',
  heading: 'Heading',
  list: 'List',
  quote: 'Quote',
  link: 'Link',
  marker: 'Highlight',
  table: 'Table',
  bold: 'Bold',
  italic: 'Italic',
  image: 'Picture',
  moveUp: 'Move up',
  moveDown: 'Move down',
  addALink: 'Add link',
  searchText: 'Please enter a search term',
  confirmToFollow: 'Are you sure to unmute this member?',
  mutedList: 'Muted',
  cancelBlock: 'Unmute',
  confirmToClearCacheData: 'Are you sure to clear cache data from Rum? ',
  expand: 'Unfold',
  shrink: 'Fold',
  selectFromImageLib: 'Select From Gallery',
  makeAnAvatar: 'Make An Avatar',
  selectAvatar: 'Select Avatar',
  uploadImage: 'Upload Image',
  selectProvider: 'Processing Method',
  moveOrDragImage: 'Move or Zoom',
  replace: 'Replace',
  upload: 'Upload',
  tokenAmount: 'Amount',
  reconnecting: 'The service has been disconnected, reconnecting...',
  justNow: 'Just now',
  minutesAgo: ' minutes ago',
  hoursAgo: ' hours ago',
  easymde: {
    bold: 'Bold',
    italic: 'Italic',
    heading: 'Heading',
    quote: 'Quote',
    ul: 'ul',
    ol: 'ol',
    image: 'Image',
    link: 'Link',
    preview: 'Preview',
  },
  singleProducerConfirm: 'You are the only producer of this SedNet. It will be permanently disabled after you leave.<br /><br />Adding other producer before leave is strongly recommended.<br /><br />',
  singleProducerConfirmAll: 'You are the only producer of some SedNets. They will be permanently disabled after you leave.<br /><br />Adding other producers before leave is strongly recommended.<br /><br />',
  addProducerFeedback: 'Your application has been approved. You are welcomed to be a producer of this SeedNet.',
  removeProducerFeedback: 'You have been removed from the producers list. You are no longer a producer of this SeedNet.',
  emptyAnnouncement: 'There are no announcements.',
  submitAnnouncement: 'Apply',
  clickToSubmitAnnouncement: 'Click to Apply',
  announcements: 'Announcements',
  announcementReviewing: (owner: string) => `Application submitted，waiting for ${owner} to review.`,
  wantToBeProducer: 'I want to apply to be a producer.',
  dontWantToBeProducer: "I don't want to be a producer anymore.",
  announcementMemo: (memo: string) => `, reason：${memo}`,
  remove: 'Remove',
  allow: 'Aprove',
  revoke: 'Revoke',
  removed: 'Removed',
  allowed: 'Aproved',
  revoked: 'Revoked',
  confirmToAllowProducer: 'Aprove the producer application?',
  confirmToRemoveProducer: 'Remove from producers?',
  announceToExit: 'Ask to quit.',
  announceToBeProducer: 'Apply to be a producer.',
  isProducer: 'You are currently a producer.',
  confirmToAnnounceExit: 'Are you sure to quit?',
  reason: 'Reason',
  producerNBlocks: (n: number) => `produced <span className="font-bold mx-[2px]">${n}</span> blocks`,
  producer: 'Producer',
  createBlock: 'Produce',
  canNotTipYourself: 'Can not reward yourself',
  others: 'Other',
  accountAndSettings: 'Account and Settings',
  detail: 'Info',
  maxImageCount: (count: number) => `No more than ${count} pictures`,
  maxByteLength: 'The total size of the picture exceeds the limit, please try to compress the picture, or reduce the number of pictures',
  manageGroup: 'Edit SeedNet',
  manageGroupTitle: 'SeedNet Info',
  manageGroupSkip: 'Skip, set up later',
  exitGroup: 'Exit',
  exitGroupShort: 'Exit',
  encryptedContent: 'Encrypted Content',
  failedToReadBackipFile: 'Failed to read backup file.',
  notAValidZipFile: 'Not a valid zip file.',
  isNotEmpty: 'Folder is not empty.',
  incorrectPassword: 'Password is incorrect.',
  writePermissionDenied: 'Do not have permission to write in the folder.',
  allHaveReaded: 'Mark All As Read',
  blocked: 'Unmuted',
  block: 'Mute',
  follow: 'Follow',
  following: 'Following',
  followLabel: 'Follow',
  inputNickname: 'Please input nickname',
  avatar: 'Avatar',
  thumbUp: 'Up',
  thumbDown: 'Down',
  myGroup: 'My SeedNets',
  searchSeedNets: 'Search SeedNets',
  selectAll: 'Select All',
  selectReverse: 'Reverse',
  announcement: 'Announcement',
  openImage: 'Open Image',
  nodeRole: 'Role',
  ownerRole: 'Owner',
  noneRole: 'None',
  allRole: 'All Kind',
  selected: 'Selected',
  option: '',
  cleanSelected: 'Clean Selections',
  profile: 'Profile',
  allProfile: 'All Profiles',
  create: 'Create ',
  requireAvatar: 'Please choose or upload an avatar',
  item: '',
  changeProfile: 'Change Profile',
  bindOrUnbindWallet: 'Bind/Unbind Wallet',
  unbind: 'Unbind',
  sidebarIconStyleMode: 'icon',
  sidebarListStyleMode: 'list',
  updateAt: 'update at',
  default: 'default',
  initProfile: 'Init Profile',
  selectProfile: 'Select Profile for New SeedNet',
  selectProfileFromDropdown: 'Select Profile from Dropdown',
  selectMixinUID: 'Select Wallet for New SeedNet',
  selectMixinUIDFromDropdown: 'Select Wallet from Dropdown',
  changeFontSize: 'Change Font Size',
  small: 'Small',
  normal: 'Normal',
  large: 'Large',
  youSelected: 'Font Size: ',
  smallSizeFont: 'Small',
  normalSizeFont: 'Normal',
  largeSizeFont: 'Large',
  extraLargeSizeFont: 'Extra Large',
  updatedAt: (time: string) => `Updated at ${time}`,
  createFolder: 'Create Folder',
  exportKeyDataDone: 'Export Done',
  importKeyDataDone: 'Import Done',
  exportCurrentNodeNeedToQuit: 'Export KeyData Of Current Node Need To Quit, Are You Sure?',
  invalidInput: (name: string) => `Invalid ${name}`,
  publisher: 'User ID',
  retryCount: 'retry Count',
  exportNode: 'Export Node',
  importNode: 'Import Node',
  language: 'Language',
  thisIsAPaidGroup: '这是一个收费的种子网络',
  payAndUse: (amount: number, assetSymbol: string) => `请先支付 ${amount} ${assetSymbol} 以使用该种子网络`,
  paidSuccessfully: '已支付成功，等待创建者确认通过...',
  pay: '去支付',
  paidTicket: '支付凭证',
  announced: '成功发起申请',
  announceAgain: '再次发起申请',
  feedTemplateName: '发布/Feed',
  bbsTemplateName: '论坛/BBS',
  noteTemplateName: '私密笔记/Private Note',
  payAmount: '支付金额',
  immutableGroupConfigTip: '种子网络建立后，将无法修改名称、权限设置和模板',
  template: '模板',
  authSettings: '权限设置',
  immutableAuthSettingsTip: '设置新成员加入后的内容发布权限。种子网络建立后，无法修改默认权限',
  defaultWriteTip: '新加入成员默认拥有可写权限，包括发表主帖，评论主贴，回复评论，点赞等操作。管理员可以对某一成员作禁言处理。',
  defaultWriteTypeTip: '新成员默认可写',
  defaultWriteExampleTipForFeed: '新加入成员默认可写的 Feed 类模版，适用于时间线呈现的微博客类社交应用。',
  defaultWriteExampleTipForBBS: '新加入成员默认可写的 BBS 模版，适用于话题开放，讨论自由的论坛应用。',
  defaultReadTip1: '新加入成员默认拥有可写权限，包括发表主帖，评论主贴，回复评论，点赞等操作。管理员可以对某一成员作禁言处理。',
  defaultReadTip2: '管理员可以对某一成员开放权限。',
  defaultReadTip3: '限制成员发帖但是允许成员评论、回复、点赞的权限管理功能即将开放。',
  defaultReadTypeTip: '新成员默认只读',
  defaultReadExampleTipForFeed: '新加入成员默认只评的 Feed 类模版，适用于开放讨论的博客、内容订阅、知识分享等内容发布应用。',
  defaultReadExampleTipForBBS: '新加入成员默认只评的 Feed 类模版，适用于开放讨论的博客、内容订阅、知识分享等内容发布应用。',
  basicInfoSettings: '设置基本信息',
  immutableGroupNameTip: '种子网络建立后不可更改',
  payable: '收费',
  payableTip: '其他成员加入本网络需要向你支付',
  createPaidGroupFeedTip: (invokeFee: string | number, assetSymbol: string) => `你需要支付 ${invokeFee} ${assetSymbol} 手续费以开启收费功能`,
  unchangedGroupConfigTip: '种子网络建立后，将无法修改名称、权限设置和模板',
  apiConfigSettings: '节点配置',
  useNewApiConfig: '使用新的配置',
  useLatestApiConfig: '选择最近使用过的配置',
  writable: '可写权限',
  auth: '权限',
  confirmToRemove: '确定移除吗？',
  added: '已添加',
  members: '成员',
  duplicateMember: '该用户已在列表中',
  addDefaultReadMember: '添加只读成员',
  addDefaultWriteMember: '添加只读成员',
  manageDefaultReadMember: '添加只读成员',
  manageDefaultWriteMember: '添加只读成员',
  checkingPaymentResult: '核对中',
  paid: '我已支付',
};
