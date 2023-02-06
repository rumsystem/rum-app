interface HotCountParams {
  likeCount: number
  dislikeCount: number
  commentCount: number
}
export default (options: HotCountParams) => {
  const { likeCount, dislikeCount, commentCount } = options;
  return (likeCount - dislikeCount + commentCount * 0.4) * 10;
};
