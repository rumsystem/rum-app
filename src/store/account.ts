import Store from 'electron-store';
import { flattenDeep, isEmpty, uniq, reverse } from 'lodash';
import { IProducer } from 'types';
import { larger } from 'mathjs';

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
  bound_mixin_profile: {
    avatar_url: string;
    biography: string;
    created_at: string;
    full_name: string;
    identity_number: string;
    is_scam: boolean;
    is_verified: boolean;
    mute_until: string;
    phone: string;
    relationship: string;
    type: string;
    user_id: string;
  };
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
  producer: IProducer;
}

export function createAccountStore() {
  return {
    isFetched: false,
    account: (store.get('account') || {}) as IAccount,
    publicKey: (store.get('publickey') as string) || '',
    get isRunningProducer() {
      if (isEmpty(this.account.producer)) {
        return false;
      }
      return (
        larger(this.account.producer.total_votes, 0) ||
        larger(this.account.producer.unpaid_blocks, 0)
      );
    },
    get isProducer() {
      return !isEmpty(this.account.producer);
    },
    get isLogin() {
      return !isEmpty(this.account) && !!this.publicKey;
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
          reverse(account.permissions).map((permission) => {
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
      const encryptedPasswordStore = new Store({
        name: 'encrypted_password',
        encryptionKey: this.publicKey,
      });
      if (encryptedPasswordStore) {
        encryptedPasswordStore.delete(this.publicKey);
      }
      this.account = {} as IAccount;
      store.set('account', {});
      store.set('publickey', '');
    },
    saveKeystore(password: string, keystore: any) {
      const encryptedStore = new Store({
        name: 'encrypted_keystore',
        encryptionKey: password,
      });
      this.publicKey = keystore.publickey;
      store.set('publickey', keystore.publickey);
      encryptedStore.set(keystore.publickey, keystore);
    },
    getKeystore(password: string) {
      const encryptedStore = new Store({
        name: 'encrypted_keystore',
        encryptionKey: password,
      });
      return encryptedStore.get(this.publicKey);
    },
    savePassword(password: string) {
      const encryptedPasswordStore = new Store({
        name: 'encrypted_password',
        encryptionKey: this.publicKey,
      });
      encryptedPasswordStore.set(this.publicKey, password);
    },
    getPassword() {
      const encryptedPasswordStore = new Store({
        name: 'encrypted_password',
        encryptionKey: this.publicKey,
      });
      return encryptedPasswordStore.get(this.publicKey);
    },
    hasPassword() {
      const encryptedPasswordStore = new Store({
        name: 'encrypted_password',
        encryptionKey: this.publicKey,
      });
      return encryptedPasswordStore.has(this.publicKey);
    },
  };
}
