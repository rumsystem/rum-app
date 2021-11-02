import React from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from 'store';
import Assets from './Assets';

export default observer(() => {
  const { accountStore } = useStore();
  const { account, permissionKeys, keyPermissionsMap } = accountStore;

  return (
    <div className="flex">
      <div className="mr-8 w-300-px">
        <div className="bg-white rounded-12 mb-3 text-gray-6d">
          <div className="px-5 pt-4 pb-3 leading-none text-16 border-b border-gray-d8 border-opacity-75 flex justify-between items-center">
            基本信息
          </div>
          <div className="px-5 py-4">
            <div>账户名 ：{account.account_name}</div>
            <div className="mt-1">
              权限：{keyPermissionsMap[permissionKeys[0]].join(', ')}
            </div>
            <div className="mt-1">
              Mixin 账号：
              {account.bound_mixin_account.slice(0, 8)}
            </div>
            <div className="mt-1">
              CPU：{account.total_resources.cpu_weight}
            </div>
            <div className="mt-1">
              NET：{account.total_resources.net_weight}
            </div>
          </div>
        </div>
      </div>
      <div className="w-600-px">
        <div className="bg-white rounded-12 mb-3 text-gray-6d">
          <div className="px-5 pt-4 pb-3 leading-none text-16 border-b border-gray-d8 border-opacity-75 flex justify-between items-center">
            资产
          </div>
          <div className="px-5 py-2">
            <Assets />
          </div>
        </div>
      </div>
    </div>
  );
});
