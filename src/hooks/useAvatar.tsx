import React from 'react';
import { remote } from 'electron';
import { isProduction } from 'utils/env';

const calcAvatarIndex = (message: string) => {
  let bstring
  try {
    bstring = window.atob(message);
  } catch (e) {
    // 非 base64 数据直接给 1 号头像
    return 1;
  }
  const hashHex = Array.from(bstring)
    .map(v => v.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
  const hashNum = BigInt(`0x${hashHex}`);
  return Number((hashNum % 54n) + 1n);
};

// 1x1 white pixel placeholder
const AVATAR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

const getAvatarPath = (index: number) => {
  console.log(index)
  const basePath = isProduction
    ? process.resourcesPath
    : remote.app.getAppPath();
  return index ? `${basePath}/assets/avatar/${index}.png` : AVATAR_PLACEHOLDER;
};

export default (message: any) => {
  const [avatar, setAvatar] = React.useState(AVATAR_PLACEHOLDER);
  React.useEffect(() => {
    setAvatar(
      getAvatarPath(
        calcAvatarIndex(message),
      ),
    );
  }, [message]);
  return avatar;
};
