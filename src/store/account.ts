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
  // 兼容之前只能单账号登录的历史数据
  let singlePublicKey = (store.get('single_public_key') || '') as string;

  const cachedAccount = (store.get('account') || {}) as IAccount;

  const cachedPublicKey = (store.get('publickey') as string) || '';

  let cachedPublicKeySet = new Set([] as string[]);
  let cachedPublicKeyAccountMap = {} as any;
  if (store.get('account_publickeys') && store.get('publickey_account_map')) {
    cachedPublicKeySet = new Set(store.get('account_publickeys') as string[]);
    cachedPublicKeyAccountMap = store.get('publickey_account_map') as any;
  } else {
    if (cachedPublicKey) {
      singlePublicKey = cachedPublicKey;
      store.set('single_public_key', singlePublicKey);
      cachedPublicKeySet = new Set([singlePublicKey]);
      cachedPublicKeyAccountMap = { [singlePublicKey]: cachedAccount };
    }
  }

  return {
    account: cachedAccount,

    publicKey: cachedPublicKey,

    singlePublicKey,

    publicKeySet: cachedPublicKeySet,

    publicKeyAccountMap: cachedPublicKeyAccountMap,

    get publicKeys() {
      return Array.from(this.publicKeySet);
    },

    get isLogin() {
      return !isEmpty(this.account) && !!this.publicKey;
    },

    get isRunningProducer() {
      if (!this.isLogin) {
        return false;
      }
      if (isEmpty(this.account.producer)) {
        return false;
      }
      return (
        larger(this.account.producer.total_votes, 0) ||
        larger(this.account.producer.unpaid_blocks, 0)
      );
    },

    get isProducer() {
      return this.isLogin && !isEmpty(this.account.producer);
    },

    get isDeveloper() {
      return this.isLogin && this.account.account_name.startsWith('prs.');
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

    get keystoreStoreName() {
      if (this.publicKey === this.singlePublicKey) {
        return 'encrypted_keystore';
      }
      return `encrypted_keystore_${this.publicKey.slice(0, 16)}`.toLowerCase();
    },

    get passwordStoreName() {
      if (this.publicKey === this.singlePublicKey) {
        return 'encrypted_password';
      }
      return `encrypted_password_${this.publicKey.slice(0, 16)}`.toLowerCase();
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

    setCurrentAccount(account: IAccount) {
      this.account = account;
      store.set('account', account);
    },

    updateAccount(account: IAccount) {
      this.account.total_resources = account.total_resources;
      this.account.producer = account.producer;
      store.set('account', this.account);
    },

    setCurrentPublicKey(publicKey: string) {
      this.publicKey = publicKey;
      store.set('publickey', publicKey);
    },

    addAccount(publicKey: string, account: IAccount) {
      if (!this.publicKeySet.has(publicKey)) {
        this.publicKeySet.add(publicKey);
        store.set('account_publickeys', Array.from(this.publicKeySet));
      }
      this.publicKeyAccountMap[publicKey] = account;
      store.set('publickey_account_map', this.publicKeyAccountMap);
    },

    removeAccount(publicKey: string) {
      this.publicKeySet.delete(publicKey);
      store.set('account_publickeys', Array.from(this.publicKeySet));
      delete this.publicKeyAccountMap[publicKey];
      store.set('publickey_account_map', this.publicKeyAccountMap);
      if (publicKey === this.singlePublicKey) {
        this.singlePublicKey = '';
        store.delete('single_public_key');
      }
    },

    addKeystore(keystore: any, password: string) {
      const encryptedStore = new Store({
        name: this.keystoreStoreName,
        encryptionKey: password,
      });
      this.publicKey = keystore.publickey;
      encryptedStore.set(keystore.publickey, keystore);
    },

    getKeystore(password: string) {
      const encryptedStore = new Store({
        name: this.keystoreStoreName,
        encryptionKey: password,
      });
      return encryptedStore.get(this.publicKey);
    },

    addPassword(password: string) {
      const encryptedPasswordStore = new Store({
        name: this.passwordStoreName,
        encryptionKey: this.publicKey,
      });
      encryptedPasswordStore.set(this.publicKey, password);
    },

    getPassword() {
      const encryptedPasswordStore = new Store({
        name: this.passwordStoreName,
        encryptionKey: this.publicKey,
      });
      return encryptedPasswordStore.get(this.publicKey);
    },

    hasPassword() {
      const encryptedPasswordStore = new Store({
        name: this.passwordStoreName,
        encryptionKey: this.publicKey,
      });
      return encryptedPasswordStore.has(this.publicKey);
    },

    login(account: IAccount, keystore: any, password: string) {
      if (this.publicKeySet.has(keystore.publickey)) {
        this.switchAccount(keystore.publickey);
        return;
      }
      this.setCurrentAccount(account);
      this.setCurrentPublicKey(keystore.publickey);
      this.addAccount(keystore.publickey, account);
      this.addKeystore(keystore, password);
    },

    switchAccount(publicKey: string) {
      const account =
        this.publicKeyAccountMap[publicKey] ||
        this.publicKeyAccountMap[this.publicKeys[0]];
      this.setCurrentAccount(account);
      this.setCurrentPublicKey(publicKey);
    },

    logout() {
      const encryptedPasswordStore = new Store({
        name: this.passwordStoreName,
        encryptionKey: this.publicKey,
      });
      if (encryptedPasswordStore) {
        encryptedPasswordStore.delete(this.publicKey);
      }
      this.removeAccount(this.publicKey);
      this.setCurrentAccount({} as IAccount);
      this.setCurrentPublicKey('');
    },
  };
}
