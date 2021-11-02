import { action, computed, observable, runInAction } from 'mobx';
import Database from 'hooks/useDatabase/database';
import { cachePromiseHof } from 'utils/cachePromise';

type MapSubType<T> = Array<T> | Map<string, MapSubType<T>>;
type MapType<T> = Map<string, MapSubType<T>>;
type PickKeyByType<T, U> = keyof {
  [K in keyof T as T[K] extends U ? K : never]: unknown
};
type TableItemType<T extends Dexie.Table> = T extends Dexie.Table<infer U, any> ? U : unknown;

interface CreateDatabaseCacheParams<K extends PickKeyByType<Database, Dexie.Table>> {
  tableName: K
  /**
   * 需要优化查询的键。顺序很重要，最常出现的放首位。
   * 原理：简单的按键树结构分类 Map<Key1, Map<Key2, Array<Value>>
   * TODO: 可优化：B+树索引？
   */
  optimizedKeys: Array<keyof TableItemType<Database[K]>>
}

/**
 * 给 indexedDB 加一个很基础的 in memory cache
 */
export const createDatabaseCache = <
  K extends PickKeyByType<Database, Dexie.Table>,
  ItemType extends TableItemType<Database[K]> = TableItemType<Database[K]>,
>(params: CreateDatabaseCacheParams<K>) => {
  const { tableName } = params;
  const optimizedKeys = params.optimizedKeys as Array<string>;

  // 缓存数组
  const dbCacheArray: Array<any> = observable([], { deep: false });

  // 分类树
  const mapByKey = computed(() => {
    const map = new Map() as MapType<any>;

    dbCacheArray.forEach((item) => {
      let current: MapSubType<any> = map;
      optimizedKeys.forEach((key, i, a) => {
        // create map item
        if (current instanceof Map) {
          if (!current.has(item[key])) {
            const newContainer = i === a.length - 1
              ? []
              : new Map();
            current.set(item[key], newContainer);
          }
          current = current.get(item[key])!;
        }

        // if it's last
        if (Array.isArray(current)) {
          current.push(item);
        }
      });
    });

    return map;
  });

  const validateCache = cachePromiseHof(async (db: Database) => {
    const count = await db[tableName].count();
    if (count !== dbCacheArray.length) {
      const result = await db[tableName].toArray();
      runInAction(() => {
        dbCacheArray.length = 0;
        dbCacheArray.push(...result);
      });
    }
  });

  const get = async (db: Database, whereOptions: Partial<Record<keyof ItemType, string>>): Promise<Array<ItemType>> => {
    await validateCache(db);
    let result = dbCacheArray;
    const options = Object.entries(whereOptions);
    const keyedOptions = options.filter((v) => optimizedKeys.includes(v[0])).sort((a, b) => {
      const indexA = optimizedKeys.indexOf(a[0]);
      const indexB = optimizedKeys.indexOf(b[0]);
      return indexA - indexB;
    }).filter((v, i) => optimizedKeys[i] === v as any);
    const nonKeyedOptions = options.filter((v) => !keyedOptions.includes(v));

    if (keyedOptions.length) {
      let map: MapSubType<any> = mapByKey.get();
      keyedOptions.forEach(([_key, value]) => {
        if (map instanceof Map) {
          map = map.get(value)!;
        }
      });

      map = map ?? [];

      while (!Array.isArray(map) || map.some((v) => v instanceof Map)) {
        map = Array.from(map.values()).flatMap((v) => v);
      }

      result = map as any as Array<any>;
    }

    result = result.filter((item) => nonKeyedOptions.every(([key, value]) => item[key] === value));

    return result;
  };

  const add = async (db: Database, item: ItemType) => {
    const newItem = { ...item as any };
    await db[tableName].add(newItem);
    dbCacheArray.push(newItem);
    await validateCache(db);
  };

  const invalidCache = action((db: Database) => {
    dbCacheArray.length = 0;
    validateCache(db);
  });

  return {
    /** 获取所有指定条件元素 */
    get,
    add,
    /**
     * 任何 cache 之外修改数据后必须调用这个方法使缓存失效。
     * 不然 `get` 会拿到过期的数据。
     */
    invalidCache,
  };
};
