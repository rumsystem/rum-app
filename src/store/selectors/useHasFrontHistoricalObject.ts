import { useStore } from 'store';

export default () => {
  const { activeGroupStore, latestStatusStore } = useStore();
  const latestStatus = latestStatusStore.map[activeGroupStore.id] || latestStatusStore.DEFAULT_LATEST_STATUS;
  return !!activeGroupStore.frontPost && activeGroupStore.frontPost.timestamp > latestStatus.latestPostTimeStamp;
};
