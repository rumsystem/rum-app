import React from 'react';
import { observer } from 'mobx-react-lite';
import { IProducer } from 'types';
import { isEmpty } from 'lodash';
import moment from 'moment';
import { useStore } from 'store';

interface IProps {
  producer: IProducer;
}

export default observer((props: IProps) => {
  const { producer } = props;
  const { accountStore } = useStore();
  const { account, permissionKeys, keyPermissionsMap } = accountStore;
  return (
    <div className="bg-white rounded-12 text-gray-6d">
      <div className="px-5 pt-4 pb-3 leading-none text-16 border-b border-gray-ec flex justify-between items-center">
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
        <div className="mt-1">CPU：{account.total_resources.cpu_weight}</div>
        <div className="mt-1">NET：{account.total_resources.net_weight}</div>
        {!isEmpty(producer) && (
          <div>
            <div className="mt-1">待领取的区块数：{producer.unpaid_blocks}</div>
            <div className="mt-1">
              状态：
              {producer.is_active ? (
                '正常'
              ) : (
                <span className="text-red-400">停止</span>
              )}
            </div>
            <div className="mt-1">
              最近一次领取：
              {moment(producer.last_claim_time).format('yyyy-MM-DD HH:mm')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
