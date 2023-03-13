import GroupApi from 'apis/group';
import addGroups from 'hooks/addGroups';

export default async () => {
  try {
    const { groups } = await GroupApi.fetchMyGroups();
    addGroups(groups ?? []);
  } catch (err) {
    console.error(err);
  }
};
