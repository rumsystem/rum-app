import { Store } from 'store';
import { IContentItem, IPersonItem, ContentTypeUrl } from 'apis/group';

export default (store: Store, contents: IContentItem[]) => {
  // filter profiles
  const profiles = contents.filter(
    (content) => content.TypeUrl === ContentTypeUrl.Person
  ) as IPersonItem[];

  if (profiles.length === 0) {
    return;
  }

  // update profiles
  // store.profileStore.addProfiles(profiles);
};
