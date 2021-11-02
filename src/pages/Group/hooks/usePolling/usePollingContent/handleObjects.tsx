import { Store } from 'store';
import { IObjectItem } from 'apis/group';
import Database from 'store/database';

export default async (
  groupId: string,
  objects: IObjectItem[] = [],
  store: Store
) => {
  if (objects.length === 0) {
    return;
  }

  console.log(` ------------- handle objects ---------------`);
  console.log({ objects });
  const db = new Database();
  for (const object of objects) {
    try {
      await db.objects.add({
        ...object,
        GroupId: groupId,
      });
    } catch (err) {
      console.log(err);
    }
  }
};
