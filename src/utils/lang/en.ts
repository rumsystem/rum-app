import type { Content } from './cn';

export const content: Content = {
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
  shareSeed: 'Sharing Seed',
  shareContent: 'Sharing Content',
  seedNet: 'SeedNet',
  info: 'Info',
  exit: 'Exit',
  name: 'Name',
  owner: 'Owner',
  highestBlockId: 'Latest block',
  ethAddress: 'ETH Address',
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
  or: 'Or ',
  paste: 'Paste text',
  pasteSeedText: 'Paste seed text',
  pasteKeyBackupText: 'Paste key backup text',
  yes: 'OK',
  availablePublicGroups: 'Any SeedNets recommended?',
  chooseTemplate: 'Choose a template',
  groupTypeDesc: 'In Rum App, each SeedNet can be rendered into a unique application (interface). Through a combination of different templates, themes, layouts, permissions and economic system settings, a SeedNet can be used as a social group, a private tweet square, a feed subscription, a forum, a fanbase club or a single-person private doc tool, etc..',
  groupTypeDescNoModify: '*You temporarily can not modify the template setting after the SeedNet is created.',
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
  confirmToDeleteSeedNet: 'Are you sure to delete this SeedNet?',
  confirmToDeletePost: 'Are you sure to delete this Post?',
  leaveThisSeedNet: 'Leave this SeedNet',
  leaveTheseSeedNets: 'Leave these SeedNets',
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
  notFound2: (name: string) => `${name} does not exist or not been synced.`,
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
  waitForSyncingDone: 'Syncing profile data, edited profile will be shown after sync is completed.',
  syncFailedTipForProfile: 'Failed to sync SeedNet data, unable to update profile.',
  syncFailedTipForSubmit: 'Failed to sync SeedNet data, unable to post.',
  editProfile: 'Edit Profile',
  nickname: 'Nickname',
  connectMixinForTip: 'Link Mixin wallet to get rewards.',
  connectWallet: 'Link Wallet',
  noLinkedWallet: 'No Wallet',
  bindWallet: 'Link Wallet',
  bindNewWallet: 'Link New Wallet',
  connectedMixinId: (id: string) => `Link to the Mixin wallet, the address is ${id}`,
  beBannedTip: 'You are banned by the administrator of this SedNet from posting.',
  andNewIdea: 'What\'s new?',
  copy: 'Copy',
  copied: 'Copied',
  copySeed: 'Copy seed above',
  copySeedOr: 'or',
  downloadSeed: 'Download Seed File',
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
  tryReloadPage: 'Try Reload Page',
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
  loginNode: 'Use Node',
  loginNodeTip: 'Already have node.',
  setExternalNode: 'Set External Node',
  port: 'Port',
  failToOpenFile: 'Failed to read the file!',
  startingNodeTip1: 'Starting Node',
  startingNodeTip2: 'Successfully Connected, initializing, please wait...',
  startingNodeTip3: 'Coming soon...',
  startingNodeTip4: 'Loading...',
  startingNodeTip5: 'Trying to connect to the network, please wait...',
  startingNodeTip6: 'It\'s been a long time, maybe you can:',
  updatingQuorum: 'Updating Services',
  nodeDataNotExist: 'No node data in the folder you selected, please check.',
  keyStoreNotExist: 'No Keystore data in the folder, please check.',
  deprecatedNodeData: 'This folder was generated by the old version, it is not supported by the current version.', // Please downgrade or create a new folder.
  externalNode: 'External Node',
  externalMode: 'External Mode',
  wasmNode: 'Browser Node',
  wasmNodeTip: 'Run RUM in a Browser',
  externalNodeTip: 'Connect to available node',
  selectExternalNodeStoragePathTip: '<div style="text-align: left;">Running on external node may create some data temporarily. Select a folder for storage.</div>',
  storagePathTip: '<div style="text-align: left;">Please select a folder to store node data. The data belongs to you only. We do not store your data, so we cannot retrieve it for you. Please keep it in a safe place.</div>',
  storagePathTip2: 'Please select a folder to store node data. The data belongs to you only. We do not store your data, so we cannot retrieve it for you. Please keep it in a safe place.',
  storagePathLoginTip: '<div style="text-align: left;">You have selected a folder when a node was created, open the folder again to log in the node.</div>',
  storagePathLoginTip2: 'You have selected a folder when a node was created, open the folder again to log in the node.',
  edit: 'Edit',
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
  forward: 'Forward',
  open: 'Show More',
  lastReadHere: 'Last Read Here',
  replyYourComment: 'replied to you',
  replyYourContent: 'commented on your post',
  likeFor: (name: string) => `liked your ${name}`,
  object: 'Post',
  empty: (name: string) => `No ${name}`,
  isEmpty: 'It\'s empty',
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
  justNow: ' just now',
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
  transaction: 'Transaction',
  accountAndSettings: 'Account and Settings',
  detail: 'Info',
  maxImageCount: (count: number) => `No more than ${count} pictures`,
  maxByteLength: 'The total size of the picture exceeds the limit, please try to compress the picture, or reduce the number of pictures',
  manageGroup: 'Edit',
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
  muted: 'Unmuted',
  mute: 'Mute',
  follow: 'Follow',
  following: 'Following',
  followLabel: 'Follow',
  inputNickname: 'Please input nickname',
  inputUserID: 'Please input user ID',
  avatar: 'Avatar',
  thumbUp: 'Up',
  thumbDown: 'Down',
  myGroup: 'My SeedNets',
  searchSeedNets: 'Search SeedNets',
  selectAll: 'Select All',
  selectReverse: 'Reverse',
  announcement: 'Announcement',
  editAnnouncement: 'Edit Announcement',
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
  sidebarIconStyleMode: 'Icon View',
  sidebarListStyleMode: 'List View',
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
  updatedAt: (time: string) => `Updated: ${time}`,
  createFolder: 'Create Folder',
  exportKeyDataDone: 'Export Done',
  importKeyDataDone: 'Import Done',
  selectExportMode: 'Select Export Mode',
  exportForRumApp: 'Export to format for rum app',
  exportForWasm: 'Export to format for browser',
  selectImportMode: 'Select Import Mode',
  importForRumApp: 'Import backup in format for rum app',
  importForWasm: 'Import backup in format for browser',
  restoreBackupSeeds: 'Restoring SeedNets from backup file',
  exportCurrentNodeNeedToQuit: 'Export KeyData Of Current Node Need To Quit, Are You Sure?',
  invalidInput: (name: string) => `Invalid ${name}`,
  publisher: 'User ID',
  retryCount: 'retry count',
  retryTimes: (count: number) => `Retry ${count} times`,
  exportNode: 'Export Node',
  importNode: 'Import Node',
  language: 'Language',
  thisIsAPaidGroup: 'Pay to join this SeedNet',
  payAndUse: (amount: number, assetSymbol: string) => `Please pay ${amount} ${assetSymbol} to join this SeedNet.`,
  paidSuccessfully: 'Payment successfull, waiting for approval by initial node...',
  pay: 'Pay Now',
  paidTicket: 'Invoice',
  announced: 'Application Submitted!',
  announceAgain: 'Submit Application Again',
  feedTemplateName: 'Feed Template',
  bbsTemplateName: 'BBS Template',
  noteTemplateName: 'Private Note',
  payAmount: 'Amount',
  immutableGroupConfigTip: 'You can not modify these settings after the SeedNet is created: SeedNet name, r/w permission and template.',
  template: 'Template',
  authSettings: 'Default Permission of New Members',
  immutableAuthSettingsTip: 'This setting determines if new joiners are allowed to post/comment. *You temporarily can not modify this permission setting after the SeedNet is created.',
  defaultWriteTip: 'New joiners have write permission, including actions as post, comment, reply, thumb-up and reward. Administrators can modify the block list, which can block someone\'s write permission.',
  defaultWriteTypeTip: 'Public',
  defaultReadTip1: 'New joiners are read-only. They are not allowed for actions as post, comment, reply, thumb-up and reward.',
  defaultReadTip2: 'We will soon seperate the permission to post action from other actions.',
  defaultReadTip3: '. Administrators can modify the white list, which can give someone a write permission to post and other actions.',
  defaultReadTypeTip: 'Read-only For All',
  basicInfoSettings: 'Ordinary Settings',
  immutableGroupNameTip: '',
  payable: 'Joining Fee',
  payableTip: 'Charge a joining fee for membership of this SeedNet.',
  createPaidGroupFeedTip: (invokeFee: string | number, assetSymbol: string) => `You need to pay ${invokeFee} ${assetSymbol} (include gas) for the payment feature of your SeedNet.`,
  unchangedGroupConfigTip: 'You can not modify these settings after the SeedNet is created: SeedNet name, r/w permission and template.',
  apiConfigSettings: 'Node Configs',
  useNewApiConfig: 'Apply a new config.',
  useLatestApiConfig: 'Select a recent config.',
  writable: 'Write Permission',
  auth: 'Permission',
  confirmToRemove: 'Are you sure to remove？',
  added: 'Added',
  members: 'Members',
  duplicateMember: 'The member is already in the list.',
  addDefaultReadMember: 'Give Write Permission',
  addDefaultWriteMember: 'Add To Block List',
  manageDefaultReadMember: 'Writers List',
  manageDefaultWriteMember: 'Block List',
  checkingPaymentResult: 'Waiting for payment result...',
  paid: 'Paid',
  quit: 'Quit',
  cleanUpHistoryData: 'Clean up history data.',
  pending: 'Pending',
  fail: 'Fail',
  success: 'Success',
  pendingData: 'Pending Data',
  blockStatus: 'Block Status',
  block: 'Block',
  lab: 'Rum Lab',
  windowMinimize: 'Minimize Window',
  doNotRemind: 'Don\'t remind me again',
  runInBackground: 'RUM is going to run in background, you can find it later in system tray.',
  historicalObjects: 'Historical Objects',
  getNewHistoricalObjects: 'Historical Objects Received',
  rumLab: 'Rum Lab',
  paidFunc: 'Payment Function',
  debugQuorum: 'Export Quorum Debug Log',
  requireRelaunch: 'Restart to enable',
  testConnect: 'Connection status test',
  exportQuorumLog: 'Export quorum log package for debugging.',
  useTestNet: 'Link to rum test network, for developers only.',
  searchPublicNode: 'Improve connection performance by searching public node positively.',
  chargeBlitity: 'Allow you to create seedNet with payment function.',
  youCanJoinGroup: 'Please post feedback here:',
  helpUsImprove: 'to help us make improvement.',
  labTip1: 'Welcome to Rum Lab for new features which are not released yet,',
  labTip2: 'You can toggle these features in list below.',
  labTip3: 'Laboratory features are not stable which may cause malfunctions.',
  traffic: 'traffic',
  lastHour: 'last hour',
  lastDay: 'last day',
  lastMouth: 'last mouth',
  tipToAuthor: 'Reward to Author',
  walletPay: 'Use Wallet Pay',
  sureToPay: 'Sure To Pay',
  inputAmount: 'Please Input Amount',
  inputPassword: 'Please Input Password',
  myWallet: 'My Wallet',
  transferIn: 'Deposit',
  transferOut: 'Withdrawal',
  transferRecord: 'Transfer Record',
  searchCoin: 'Search Coin',
  hideUnfamousCoin: 'Hide Unfamous Coin',
  amountOverrun: 'Amount Overrun',
  failToGetRecipientAddr: 'Fail To Get Recipient Address',
  toAuthor: 'To Author',
  keyNotFound: 'Key Not Found',
  addPriceFailed: 'add paidgroup price failed',
  needSomeRum: (amount: string) => `need ${amount} RUM as gas fee to ensure join this SeedNet.`,
  pleaseWaitAnouncePaidGroup: 'This seedNet havn\'t finished announce paidgroup contract yet, please wait for that to join this seedNet.',
  wrongPubkey: 'Pubkey of user is wrong format',
  walletNoEmpty: 'The wallet of this SeedNet is not empty!',
  someWalletNoEmpty: 'Some wallet of this SeedNet is not empty!',
  insufficientRum: 'Insufficient RUM for miner produces block',
  exchange: 'Exchange',
  custom: 'Custom',
  share2: 'share',
  autoUpdate: 'Auto Update',
  enableAutoUpdate: 'Enable Auto Update',
  disableAutoUpdate: 'Disable Auto Update, you can manual update.',
  userIdFoundTip1: 'User ID can be found in content detail page.',
  userIdFoundTip2: 'Copy ID of sender is ok.',
  more: 'more...',
  migrate: 'Migrate',
  migrateOut: 'Migrate Out',
  migrateIn: 'Migrate In',
  saveBackupFile: 'Saving backup file to local',
  saveWasmBackupFileTip: 'Migrate to Rum Web version？',
  saveWasmBackupFile: 'Click to Export Rum Web version Backup File',
  restoreFromBackupFile: 'Import data from backupfile',
  currentTotalTraffic: 'Total Traffic after start node',
  currentTraffic: 'Current',
};
