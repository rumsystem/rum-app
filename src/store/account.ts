import Store from 'electron-store';
import { flattenDeep, isEmpty, uniq } from 'lodash';

const store = new Store();

interface Key {
  key: string;
  weight: number;
}

interface Permission {
  parent: string;
  perm_name: string;
  required_auth: {
    accounts: any[];
    keys: Key[];
    threshold: number;
    waits: any[];
  };
}

export interface IAccount {
  account_name: string;
  bound_mixin_account: string;
  cpu_limit: {
    available: number;
    max: number;
    used: number;
  };
  cpu_weight: string;
  created: string;
  head_block_num: number;
  head_block_time: string;
  last_code_update: string;
  net_limit: {
    available: number;
    max: number;
    used: number;
  };
  net_weight: number;
  permissions: Permission[];
  privileged: boolean;
  ram_quota: number;
  ram_usage: number;
  refund_request: any;
  self_delegated_bandwidth: any;
  total_resources: {
    cpu_weight: string;
    net_weight: string;
    owner: string;
    ram_bytes: number;
  };
  voter_info: any;
}

export function createAccountStore() {
  return {
    isFetched: false,
    account: (store.get('account') || {}) as IAccount,
    get isLogin() {
      return !isEmpty(this.account);
    },
    get permissionKeysMap() {
      const map: any = {};
      if (isEmpty(this.account)) {
        return map;
      }
      for (const permission of this.account.permissions) {
        map[permission.perm_name] = permission.required_auth.keys.map(
          (key) => key.key
        );
      }
      return map;
    },
    get keyPermissionsMap() {
      const map: any = {};
      if (isEmpty(this.permissionKeysMap)) {
        return map;
      }
      for (const permName in this.permissionKeysMap) {
        for (const key of this.permissionKeysMap[permName]) {
          if (map[key]) {
            map[key].push(permName);
          } else {
            map[key] = [permName];
          }
        }
      }
      return map;
    },
    get permissionKeys() {
      if (isEmpty(this.account)) {
        return [];
      }
      return this.getPermissionKeys(this.account);
    },
    getPermissionKeys(account: IAccount) {
      return uniq(
        flattenDeep(
          account.permissions.map((permission) => {
            return permission.required_auth.keys.map((key) => {
              return key.key;
            });
          })
        )
      );
    },
    setAccount(account: IAccount) {
      this.account = account;
      store.set('account', account);
    },
    removeAccount() {
      this.account = {} as IAccount;
      store.set('account', {});
    },
    saveKeystore(password: string, keystore: any) {
      const encryptedStore = new Store({
        name: 'encrypted_keystore',
        encryptionKey: password,
      });
      encryptedStore.set(keystore.publickey, keystore);
    },
    getKeystore(password: string, publickey: string) {
      const encryptedStore = new Store({
        name: 'encrypted_keystore',
        encryptionKey: password,
      });
      return encryptedStore.get(publickey);
    },
  };
}
