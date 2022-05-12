export const content = {
  refresh: '重新加载',
  reload: '重启',
  reloadForUpdate: '重启并更新',
  checkForUpdate: '检查更新',
  dev: '开发者调试',
  devtools: '切换开发者工具',
  modeToggle: '切换内置/外部节点',
  exportLogs: '导出调试包',
  clearCache: '清除缓存',
  relaunch: '重启应用',
  help: '关于和帮助',
  manual: '帮助手册',
  report: '反馈问题',
  about: '关于 Rum',
  switchLang: '切换语言',
  exportKey: '导出密钥',
  importKey: '导入密钥',
  allSeedNets: '全部种子网络',
  noSeedNetSearchResult: '没有搜到符合的种子网络',
  filterByType: '按模板类型选择',
  share: '分享',
  shareSeed: '分享种子',
  seedNet: '种子网络',
  info: '详情',
  exit: '退出',
  name: '名称',
  owner: '创建人',
  highestBlockId: '最新区块',
  highestHeight: '区块数',
  lastUpdated: '最近更新',
  status: '状态',
  groupInfo: '种子网络详情',
  joinGroup: '添加已有种子',
  joinSeedGroup: '加入种子网络',
  openSeedGroup: '打开种子网络',
  createGroup: '新建种子网络',
  welcomeToUseRum: '欢迎使用 Rum',
  youCanTry: '你可以试试',
  noTypeGroups: '没有该类型的种子网络',
  selectSeedFile: '点击选择种子文件',
  selectedSeedFile: '种子文件已选中',
  selectSeedToJoin: '选择要加入网络的种子文件',
  seedParsingError: '种子文件解析错误',
  selectKeyBackupFile: '点击选择备份文件',
  selectedKeyBackupFile: '备份文件已选中',
  selectKeyBackupToImport: '选择要导入密钥的备份文件',
  or: '或者',
  paste: '粘贴文本',
  pasteSeedText: '粘贴种子文本',
  pasteKeyBackupText: '粘贴密钥备份文本',
  yes: '确定',
  availablePublicGroups: '有哪些公开的种子网络可以加入？',
  chooseTemplate: '选择种子网络的模板',
  groupTypeDesc: '模板会决定你所创建的产品分发信息及内容呈现的形态。 每一个模板都针对使用场景做了专门的设计和功能优化， 对发布功能、经济系统、社交关系、管理员权限、成员管理等功能的支持会有所不同。',
  sns: '微博/群组',
  forum: '论坛',
  note: '笔记本',
  all: '全部',
  allType: '全部类型',
  joined: '已加入',
  created: '创建成功',
  existMember: '你已经是这个种子网络的成员',
  document: '档案',
  snsDesc: '以时间线形式呈现该种子网络内发布的内容。所有加入该网络的成员都可以用短文本或图片来即时发布自己的想法或状态，或点赞、回复、打赏其它人的发布。你可以静音其中一些成员的发布。管理员可对发帖设定一定数量的手续费。',
  forumDesc: '以主题贴的形式呈现该种子网络里发布的内容。支持6层回复，可对某主题进行深入讨论。可以对主题帖点“赞”或“踩” 以决定它的排序状况。一般不鼓励重复发布相同的讨论内容。管理员可以设定主题帖的分类，可对发帖或讨论设置一定金额的手续费。',
  noteDesc: '只有创建者或得到创建者许可的成员可以发布内容、阅读/解密内容。所有内容都是加密保存到链上。可用于私人笔记、日记、不公开的多人笔记或加密存档个人文档。你可以自建几个节点来维持这个小型私密网络，以去中心化方式备份同步这个种子网络里的数据。',
  cancel: '取消',
  save: '保存',
  saved: '已保存',
  savedAndWaitForSyncing: '已保存，正在同步中，大约 30 秒之后完成',
  storageDir: '储存文件夹',
  nodeParams: '节点参数',
  version: '版本',
  networkStatus: '网络状态',
  myNode: '我的节点',
  connectedNodes: (n: number) => `已连接 ${n} 个节点`,
  failToSync: '同步失败',
  comment: '评论',
  reply: '回复',
  noMessages: '还没有收到消息 ~',
  receiveNewContent: '收到新的内容',
  ago: '1小时前',
  anyIdeas: '有什么想法？',
  publish: '发布',
  publishFirstTimeline: '发布第一个内容',
  publishFirstPost: '发布第一个帖子',
  back: '返回',
  backOneStep: '返回上一步',
  input: (name: string) => `请输入${name}`,
  title: '标题',
  content: '正文',
  publishFirstNote: '记录你的第一篇笔记吧 ~',
  delete: '删除',
  exited: '已退出',
  somethingWrong: '貌似出错了',
  confirmToExit: '确定要退出这个种子网络吗？',
  confirmToExitAll: '确定要退出这些种子网络吗？',
  confirmToDelete: '确定要删除这个种子网络吗？',
  settingDone: '设置成功',
  confirmToUnBan: '确定要显示 Ta 的内容吗？',
  confirmToBan: '确定禁止 Ta 发布内容？',
  submittedWaitForSync: '请求已提交，等待其他节点同步，即将生效',
  confirmToDelDenied: '确定允许 Ta 发布内容？',
  unFollowHim: '不看 Ta',
  followHim: '关注 Ta',
  blockInfo: '区块详情',
  sender: '发送人',
  group: '种子网络',
  data: '数据',
  sign: '签名',
  timestamp: '时间戳',
  failToLoad: '加载失败',
  idle: '空闲',
  syncing: '同步中',
  syncFailed: '同步失败',
  require: (name: string) => `请输入${name}`,
  requireMinLength: (name: string, length: number) => `${name}至少要输入${length}个字哦`,
  requireMaxLength: (name: string, length: number) => `${name}不能超过${length}个字哦`,
  notFound: (name: string) => `${name}不存在`,
  groupName: '种子网络名称',
  desc: '简介',
  groupDesc: '种子网络简介',
  connected: '已连接',
  failToFetchMixinProfile: '获取mixin信息失败',
  connectMixinPrivacyTip: '别人向您转账之后，他将知道您的 mixin 帐号，将来我们会提供更加匿名的转账方式，以避免暴露您的 mixin 帐号',
  tipByMixinPrivacyTip: '当您打赏成功之后，对方会知道您的 mixin 帐号，将来我们会提供更加匿名的转账方式，以避免暴露您的 mixin 帐号',
  mixinScanToConnect: 'Mixin 扫码连接钱包',
  noMixinOnYourPhone: '手机还没有安装 Mixin ?',
  toDownload: '前往下载',
  waitForSyncingDoneToSubmitProfile: '种子网络正在同步，完成之后即可编辑资料',
  waitForSyncingDone: '个人资料已提交，正在同步，完成之后即可生效',
  syncFailedTipForProfile: '种子的数据同步失败了，无法编辑资料',
  waitForSyncingDoneToSubmit: '种子的数据正在同步，完成之后即可发送',
  syncFailedTipForSubmit: '种子的数据同步失败了，无法发送',
  editProfile: '编辑资料',
  nickname: '昵称',
  connectMixinForTip: '连接 Mixin 钱包，用于接收打赏',
  connectWallet: '连接钱包',
  bindWallet: '钱包绑定',
  bindNewWallet: '绑定新钱包',
  connectedMixinId: (id: string) => `已连接 Mixin 钱包，地址是 ${id}`,
  beBannedTip: '管理员已禁止你发布内容',
  beBannedTip2: '你被禁止发言了，需要管理员解禁才能发言和查看新内容',
  beBannedTip3: 'Ta 被禁言了，内容无法显示',
  beBannedTip4: '已被禁止发布内容',
  beBannedTip6: '你被禁言了，内容无法显示',
  andNewIdea: '有什么想法？',
  copy: '复制',
  copied: '已复制',
  copySeed: '复制以上种子',
  copySeedOr: '或',
  downloadSeed: '下载种子文件',
  downloadedThenShare: '已下载，去分享给好友吧~',
  copyBackup: '请复制备份内容或者直接下载备份文件',
  downloadBackup: '下载备份文件',
  downloadedBackup: '已下载',
  exitNode: '退出节点',
  exitConfirmTextWithGroupCount: (ownerGroupCount: number) => `你创建的 ${ownerGroupCount} 个种子网络需要你保持在线，维持出块。如果你的节点下线了，这个种子网络将无法发布新的内容。你确定要退出吗？`,
  exitConfirmText: '你的节点即将下线，确定退出吗？',
  syncingContentTip: '正在检查并同步种子网络的最新内容，请您耐心等待',
  syncingContentTip2: '正在同步到其他节点',
  invalidPassword: '密码错误，请重新输入',
  failToStartNode: '节点没能正常启动，请再尝试一下',
  reEnter: '重新输入',
  reset: '重置',
  hasReset: '已重置',
  failToAccessExternalNode: (host: string, port: string) => `外部节点无法访问，请检查一下<br />${host}:${port}`,
  tryAgain: '再次尝试',
  tipped: '打赏成功',
  search: '搜索',
  selectToken: '选择币种',
  selectOtherToken: '选择其他币种',
  tipTo: '打赏给',
  amount: '数量',
  tipNote: '备注',
  optional: '可选',
  next: '下一步',
  mixinPay: 'Mixin 扫码支付',
  scanQrCodeByMixin: '请使用 Mixin 扫描二维码',
  willRefreshAfterPayment: '支付成功后页面会自动刷新',
  exiting: '节点正在退出',
  connectedPeerCount: (count: number) => `已连接 ${count} 个节点`,
  connectedPeerCountTip: (count: number) => `你的节点已连接上网络中的 ${count} 个节点`,
  signupNode: '创建节点',
  signupNodeTip: '第一次使用',
  loginNode: '登录节点',
  loginNodeTip: '已经拥有节点',
  setExternalNode: '指定外部节点',
  port: '端口',
  tslCert: 'tls证书',
  failToOpenFile: '读取文件失败！',
  startingNodeTip1: '正在启动节点',
  startingNodeTip2: '连接成功，正在初始化，请稍候',
  startingNodeTip3: '已完成初始化，请稍候',
  startingNodeTip4: '正在努力加载中',
  startingNodeTip5: '节点还在启动中，请稍候',
  updatingQuorum: '正在更新服务',
  nodeDataNotExist: '该文件夹没有节点数据，请重新选择哦',
  keyStoreNotExist: '该文件夹没有keystore数据，请重新选择哦',
  deprecatedNodeData: '该文件夹由旧版本生成，现已不支持，请重新创建',
  externalNode: '外部节点',
  externalMode: '外部节点模式',
  externalNodeTip: '连接到公开可访问的节点',
  selectExternalNodeStoragePathTip1: '使用外部节点会产生一些临时数据',
  selectExternalNodeStoragePathTip2: '请选择一个文件夹来存储它们',
  storagePathTip1: '请选择一个文件夹来储存节点数据',
  storagePathTip2: '这份数据只是属于你',
  storagePathTip3: '我们不会储存数据，也无法帮你找回',
  storagePathTip4: '请务必妥善保管',
  storagePathLoginTip1: '创建节点时您选择了一个文件夹',
  storagePathLoginTip2: '里面保存了您的节点信息',
  storagePathLoginTip3: '现在请重新选中该文件夹',
  storagePathLoginTip4: '以登录该节点',
  edit: '编辑',
  selectFolder: '选择文件夹',
  tip: '打赏',
  contentCount: (count: number) => `${count}条内容`,
  confirmToExitNode: '确定退出节点吗？',
  nodeInfo: '节点信息',
  nodeAndNetwork: '节点与网络',
  savePassword: '记住密码',
  savePasswordTip: '每次打开无需重复输入密码',
  confirmPassword: '确认密码',
  enterNewPassword: '设置密码',
  enterPassword: '输入密码',
  password: '密码',
  passwordNotMatch: '密码不一致',
  unableToUseAutoUpdate: '检查更新失败了，你可以联系工作人员下载最新版本',
  gotIt: '我知道了',
  unableToDownloadUpdate: '自动更新遇到了一点问题，请点击下载',
  download: '下载',
  updateNextTime: '暂不更新',
  newVersion: '新版本',
  published: '已发布',
  update: '更新',
  doItLater: '稍后',
  reloadAfterDownloaded: '新版本已下载，重启即可使用',
  isLatestVersion: '当前已经是最新版本',
  downloadingNewVersionTip: '检测到新版本，正在为你下载，完成之后会提醒你重启安装',
  downloadingNewVersion: '正在下载新版本',
  clickToSync: '点击同步最新内容',
  myHomePage: '我的主页',
  like: '点赞',
  open: '点击查看',
  lastReadHere: '上次看到这里',
  replyYourComment: '回复了你的评论',
  replyYourContent: '评论了你的内容',
  likeFor: (name: string) => `赞了你的${name}`,
  object: '内容',
  empty: (name: string) => `还没有${name}`,
  message: '消息',
  afterUnFollowTip: '已静音，点击右上角菜单，可以查看已静音的人',
  confirmToUnFollow: '确定要隐藏 Ta 的内容吗？',
  ban: '禁言',
  banned: '已禁言',
  checkMoreComments: (count: number) => `共${count}条评论，点击查看`,
  expandComments: (count?: number) => `展开${count}条回复 `,
  totalReply: (count: number) => `共${count}条回复`,
  totalObjects: (count: number) => `共 ${count} 条发布`,
  createFirstOne: (type: string) => `发布你的第一条${type}吧 ~`,
  forumPost: '帖子',
  getNewObject: '收到新的发布',
  loading: '加载中',
  noMore: (type: string) => `没有更多${type}了哦`,
  emptySearchResult: '没有搜索到相关的内容 ~',
  emptyImageSearchResult: '没有搜索到相关的图片呢',
  expandContent: '......展开剩余内容......',
  unExpandContent: '......折叠过长内容......',
  tipWithRum: '给TA买一杯',
  imageSearchTip1: '换个关键词试试',
  imageSearchTip2: '也可以换英文试一试',
  pixabayLicenseTip: '图片由 Pixabay 提供，都是免费可自由使用的',
  keyword: '关键词',
  latestForumPost: '最新帖子',
  createForumPost: '发帖',
  createFirstForumPost: '发布第一个帖子',
  latest: '最新',
  hot: '热门',
  publishYourComment: '发布你的评论 ...',
  htmlCode: '输入 HTML 代码',
  quotePlaceholder: '输入你要引用的内容',
  clickToTune: '点击打开菜单',
  orDragToMove: '或者按住、拖动',
  convertTo: '转换为',
  add: '添加',
  text: '文本',
  heading: '标题',
  list: '列表',
  quote: '引用',
  delimiter: '分割线',
  rawHTML: 'HTML 代码',
  link: '链接',
  marker: '高亮',
  table: '表格',
  bold: '加粗',
  italic: '斜体',
  image: '图片',
  moveUp: '上移',
  moveDown: '下移',
  addALink: '添加链接',
  canDisplayedBlock: '出错了，内容无法正常显示出来',
  searchText: '请输入要搜索的内容',
  confirmToFollow: '确定要显示 Ta 的内容吗？',
  mutedList: '已静音的成员',
  cancelBlock: '取消静音',
  confirmToClearCacheData: '确定清除客户端的缓存数据吗？',
  expand: '展开',
  shrink: '收起',
  selectFromImageLib: '在图库中选择',
  selectAvatar: '选择头像',
  uploadImage: '上传图片',
  selectProvider: '选择操作方式',
  moveOrDragImage: '移动或缩放图片',
  replace: '更换',
  upload: '上传',
  tokenAmount: '金额',
  reconnecting: '服务已断开，正在尝试重新连接',
  justNow: '刚刚',
  minutesAgo: '分钟前',
  hoursAgo: '小时前',
  easymde: {
    bold: '加粗',
    italic: '斜体',
    heading: '标题',
    quote: '引用',
    ul: '列表',
    ol: '有序列表',
    link: '链接',
    preview: '预览',
  },
  singleProducerConfirm: '你是本群组唯一的出块节点，你退出之后，群组将永久作废，也无法正常使用。<br /><br />如果退出之后，仍然想要群组能继续正常运行，你可以添加另外一个出块节点来承担出块的工作<br /><br />',
  singleProducerConfirmAll: '你是一些群组唯一的出块节点，你退出之后，群组将永久作废，也无法正常使用。<br /><br />如果退出之后，仍然想要群组能继续正常运行，你可以添加另外一个出块节点来承担出块的工作<br /><br />',
  addProducerFeedback: '我已经通过了你的申请，欢迎你成为本群组的出块节点',
  removeProducerFeedback: '我已经将你从出块节点的名单中移除，你不再是本群组的出块节点',
  emptyAnnouncement: '暂时没有需要处理的申请',
  submitAnnouncement: '提交申请',
  clickToSubmitAnnouncement: '点击提交申请',
  announcements: '申请列表',
  announcementReviewing: (owner: string) => `已提交申请，等待 ${owner} 通过`,
  wantToBeProducer: '我想成为出块节点',
  dontWantToBeProducer: '我不想再继续做出块节点',
  announcementMemo: (memo: string) => `，理由是：${memo}`,
  remove: '移除',
  allow: '允许',
  revoke: '撤回',
  removed: '移除',
  allowed: '允许',
  revoked: '撤回',
  confirmToAllowProducer: '允许 Ta 成为出块节点？',
  confirmToRemoveProducer: '不再将 Ta 作为出块节点？',
  announceToExit: '申请退出',
  announceToBeProducer: '申请成为出块节点',
  isProducer: '您当前是出块节点',
  confirmToAnnounceExit: '想要申请退出吗？',
  reason: '理由',
  producerNBlocks: (n: number) => `生产了 <span className="font-bold mx-[2px]">${n}</span> 个区块`,
  producer: '出块节点',
  createBlock: '出块',
  canNotTipYourself: '不能打赏给自己哦',
  others: '其他',
  accountAndSettings: '账号与设置',
  detail: '详细信息',
  maxImageCount: (count: number) => `最多添加 ${count} 张图片`,
  maxByteLength: '图片的总体积超过限制，请尝试压缩图片，或减少图片数量',
  manageGroup: '编辑种子网络',
  manageGroupTitle: '种子网络基本信息',
  manageGroupSkip: '跳过，以后再设置',
  exitGroup: '退出种子网络',
  exitGroupShort: '退出',
  encryptedContent: '内容已加密',
  failedToReadBackipFile: '读取备份文件失败',
  notAValidZipFile: '备份文件无效',
  isNotEmpty: '文件夹不为空',
  incorrectPassword: '密码错误',
  writePermissionDenied: '对该文件夹没有写入权限',
  allHaveReaded: '全部标为已读',
  blocked: '已静音',
  block: '不看 Ta',
  follow: '收藏 Ta',
  following: '已收藏',
  followLabel: '收藏',
  inputNickname: '请输入昵称',
  avatar: '头像',
  thumbUp: '顶',
  thumbDown: '踩',
  myGroup: '我的种子网络',
  searchSeedNets: '搜索种子网络',
  joinTime: '加入时间',
  createTime: '创建时间',
  selectAll: '全选',
  selectReverse: '反选',
  announcement: '公告',
  openImage: '查看图片',
  nodeRole: '节点角色',
  ownerRole: '创建者',
  noneRole: '没有角色',
  allRole: '全部角色',
  selected: '选中',
  option: '项',
  cleanSelected: '清空选择',
  profile: '身份资料',
  allProfile: '全部资料',
  create: '新建',
  requireAvatar: '请选择和上传头像',
  item: '个',
  changeProfile: '修改身份资料',
  bindOrUnbindWallet: '钱包绑定/解绑',
  unbind: '解绑',
  sidebarIconStyleMode: '图标模式',
  sidebarListStyleMode: '列表管理模式',
  updateAt: '更新于',
  default: '默认',
  initProfile: '初始化资料',
  initProfileTitle: '即将加入:',
  selectProfile: '请选择应用到该种子网络的身份资料',
  selectProfileFromDropdown: '下拉选择身份资料',
  selectMixinUID: '绑定到该种子网络的钱包',
  selectMixinUIDFromDropdown: '下拉选择钱包',
  changeFontSize: '修改字体大小',
  small: '小',
  normal: '普通',
  large: '大',
  youSelected: '你选择了',
  smallSizeFont: '小字体',
  normalSizeFont: '普通字体',
  largeSizeFont: '大字体',
  extraLargeSizeFont: '超大字体',
};

export type Content = typeof content;
