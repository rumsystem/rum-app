import { Store } from 'store';
import { IPersonItem } from 'apis/group';
import Database from 'store/database';

export default async (
  groupId: string,
  persons: IPersonItem[] = [],
  store: Store
) => {
  if (persons.length === 0) {
    return;
  }

  console.log(` ------------- handle persons ---------------`);
  console.log({ persons });
  const db = new Database();
  for (const person of persons) {
    try {
      await db.persons.add({
        ...person,
        GroupId: groupId,
      });
    } catch (err) {
      console.log(err);
    }
  }
};
