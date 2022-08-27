import type { IProfile } from 'store/group';
import Base64 from 'utils/base64';
import type { IDbPersonItem } from 'hooks/useDatabase/models/person';
import { avatars } from 'utils/avatars';

const hashStore = new Map<string, number>();

const calcAvatarIndex = (message: string) => {
  if (hashStore.has(message)) {
    return hashStore.get(message)!;
  }

  let bstring;
  try {
    bstring = window.atob(message);
  } catch (e) {
    // 非 base64 数据直接给 1 号头像
    hashStore.set(message, 1);
    return 1;
  }

  const hashHex = Array.from(bstring)
    .map((v) => v.charCodeAt(0).toString(16).padStart(2, '0'))
    .join('');
  const hashNum = BigInt(`0x${hashHex}`);
  const index = Number((hashNum % BigInt(avatars.length)) + 1n);
  hashStore.set(message, index);
  return index;
};

// 1x1 white pixel placeholder
export const AVATAR_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

const getAvatarPath = (index: number) => {
  if (process.env.IS_ELECTRON) {
    return index ? avatars[index - 1] : AVATAR_PLACEHOLDER;
  }
  return avatars[index - 1];
};

export default (publisher: string, person?: IDbPersonItem | null) => {
  const result = {} as IProfile;

  if (person) {
    result.name = person.Content.name;
  } else {
    result.name = publisher.slice(-10, -2);
  }

  if (person && person.Content.image) {
    result.avatar = Base64.getUrl(person.Content.image);
  } else {
    result.avatar = getAvatarPath(calcAvatarIndex(publisher));
  }

  if (
    person?.Content?.wallet && person.Content?.wallet?.length > 0
  ) {
    const wallet = person?.Content?.wallet.filter((item) => item.type === 'mixin');
    if (wallet.length > 0) {
      result.mixinUID = wallet[0].id;
    } else {
      result.mixinUID = '';
    }
  } else {
    result.mixinUID = '';
  }

  return result;
};
