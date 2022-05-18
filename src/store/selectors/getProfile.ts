import type { IProfile } from 'apis/content';
import Base64 from 'utils/base64';
import type { IDbPersonItem } from 'hooks/useDatabase/models/person';
import defaultAvatar from 'assets/default_avatar.png';

// 1x1 white pixel placeholder
export const AVATAR_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=';

export default (publisher: string, person?: IDbPersonItem | null) => {
  const result = {} as IProfile & { default?: boolean };

  if (person && person.Content && person.Content.name) {
    result.name = person.Content.name;
  } else {
    result.name = publisher.slice(-10, -2);
  }

  if (person && person.Content && person.Content.image) {
    result.avatar = Base64.getUrl(person.Content.image);
  } else {
    result.avatar = defaultAvatar;
  }

  if (!person?.Content?.name && !person?.Content?.image) {
    result.default = true;
  }

  if (
    person && person.Content && person.Content.wallet && person.Content.wallet.length > 0
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
