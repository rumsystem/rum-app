import { remote } from 'electron';
import { isProduction } from 'utils/env';
import { useStore } from 'store';
import Base64 from 'utils/base64';

const calcAvatarIndex = (message: string) => {
  let bstring;
  try {
    bstring = window.atob(message);
  } catch (e) {
    // 非 base64 数据直接给 1 号头像
    return 1;
  }
  const hashHex = Array.from(bstring)
    .map((v) => v.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
  const hashNum = BigInt(`0x${hashHex}`);
  return Number((hashNum % 54n) + 1n);
};

// 1x1 white pixel placeholder
const AVATAR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

const getAvatarPath = (index: number) => {
  const basePath = isProduction
    ? process.resourcesPath
    : remote.app.getAppPath();
  return index ? `${basePath}/assets/avatar/${index}.png` : AVATAR_PLACEHOLDER;
};

export default (message: any) => {
  const { nodeStore, profileStore } = useStore();
  const profile = profileStore.profileMap[nodeStore.info.node_publickey];
  const profileAvatar =
    profile && profile.Content.image
      ? Base64.getUrl(profile.Content.image)
      : '';
  return profileAvatar || getAvatarPath(calcAvatarIndex(message));
};
