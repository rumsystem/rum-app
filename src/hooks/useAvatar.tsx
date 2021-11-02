import React from 'react';
import { remote } from 'electron';
import { isProduction } from 'utils/env';

const calcAvatarIndex = async (message: string) => {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashNum = BigInt(`0x${hashHex}`);
  return Number((hashNum % 54n) + 1n);
};

// 1x1 white pixel placeholder
const AVATAR_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

const getAvatarPath = (index: any) => {
  const basePath = isProduction
    ? process.resourcesPath
    : remote.app.getAppPath();
  return index ? `${basePath}/assets/avatar/${index}.png` : AVATAR_PLACEHOLDER;
};

export default (message: any) => {
  const [avatar, setAvatar] = React.useState(AVATAR_PLACEHOLDER);
  React.useEffect(() => {
    (async () => {
      const index = await calcAvatarIndex(message);
      setAvatar(getAvatarPath(index));
    })();
  }, [message]);
  return avatar;
};
