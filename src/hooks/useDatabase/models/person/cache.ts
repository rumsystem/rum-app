import { action, computed, observable, runInAction } from 'mobx';
import Database from 'hooks/useDatabase/database';
import { cachePromiseHof } from 'utils/cachePromise';
import { IDbPersonItem } from './types';

const personCache: Array<IDbPersonItem> = observable([], { deep: false });
const mapByKey = computed(() => {
  /** Map<GroupId, Map<Publisher, Array<IDbPersonItem>>> */
  const map = new Map<string, Map<string, Array<IDbPersonItem>>>();
  personCache.forEach((item) => {
    if (!map.has(item.GroupId)) {
      map.set(item.GroupId, new Map());
    }
    const groupSubMap = map.get(item.GroupId)!;
    if (!groupSubMap.has(item.Publisher)) {
      groupSubMap.set(item.Publisher, []);
    }
    const publisherArr = groupSubMap.get(item.Publisher)!;
    publisherArr.push(item);
  });
  return map;
});

const validateCache = cachePromiseHof(async (db: Database) => {
  const count = await db.persons.count();
  if (count !== personCache.length) {
    const result = await db.persons.toArray();
    runInAction(() => {
      personCache.length = 0;
      personCache.push(...result);
    });
  }
});

export const get = async (db: Database, whereOptions: Partial<Record<keyof IDbPersonItem, string>>) => {
  await validateCache(db);
  let result = personCache;
  const options = new Map(Object.entries(whereOptions));
  if (whereOptions.GroupId) {
    const map = mapByKey.get().get(whereOptions.GroupId);
    options.delete('GroupId');
    if (whereOptions.Publisher) {
      result = map?.get(whereOptions.Publisher) ?? [];
      options.delete('Publisher');
    } else {
      result = [...map?.values() ?? []].flatMap((v) => v);
    }
  }

  const optionsArr = [...options.entries()] as Array<[keyof IDbPersonItem, string]>;
  result = result.filter((item) => optionsArr.every(([key, value]) => item[key] === value));

  return result;
};

export const invalidCache = action(() => {
  personCache.length = 0;
});
