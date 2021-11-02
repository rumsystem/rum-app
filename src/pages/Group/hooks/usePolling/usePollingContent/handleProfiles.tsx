import { Store } from 'store';
import { IObjectItem, ContentTypeUrl } from 'apis/group';

export default (store: Store, contents: IObjectItem[]) => {
  // filter profiles
  const profiles = contents.filter(
    (content) => content.TypeUrl === ContentTypeUrl.Person
  );

  if (profiles.length === 0) {
    return;
  }

  // update profiles
  store.profileStore.addProfiles(profiles);
};
