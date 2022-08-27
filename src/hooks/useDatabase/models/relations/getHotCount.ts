export default (options: {
  likeCount: number
  dislikeCount: number
  commentCount: number
}) => (options.likeCount - options.dislikeCount + options.commentCount * 0.4) * 10;
