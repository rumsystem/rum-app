import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { IProducer } from 'types';
import { isEmpty } from 'lodash';
import moment from 'moment';
import { useStore } from 'store';
import Tooltip from '@material-ui/core/Tooltip';
import Button from 'components/Button';
import Dialog from 'components/Dialog';
import classNames from 'classnames';
import Loading from 'components/Loading';
import { MdInfo } from 'react-icons/md';
import { PrsAtm, sleep, Finance, isWindow } from 'utils';

interface IMixinConnectionModalProps {
  amount: string;
  paymentUrl: string;
  open: boolean;
  onClose: (done?: boolean) => void;
}

const MixinConnection = observer((props: IMixinConnectionModalProps) => {
  const { amount, paymentUrl, onClose } = props;
  const state = useLocalStore(() => ({
    iframeLoading: true,
  }));

  return (
    <div className="bg-white rounded-12 text-center">
      <div className="py-8 px-12 text-center">
        <div className="text-18 font-bold text-gray-700">绑定 Mixin 账号</div>
        <div className="text-12 mt-2 text-gray-6d">
          Mixin 扫码支付 {amount} 以完成绑定
        </div>
        <div className="relative overflow-hidden">
          {paymentUrl && (
            <div
              className={classNames(
                {
                  hidden: state.iframeLoading,
                },
                'w-64 h-64'
              )}
            >
              <iframe
                onLoad={() => {
                  setTimeout(() => {
                    state.iframeLoading = false;
                  }, 1000);
                }}
                src={Finance.replaceMixinDomain(paymentUrl)}
              />
              <style jsx>{`
                iframe {
                  height: 506px;
                  width: 800px;
                  position: absolute;
                  top: -238px;
                  left: 0;
                  margin-left: ${isWindow ? '-265px' : '-272px'};
                  transform: scale(0.88);
                }
              `}</style>
            </div>
          )}
          {state.iframeLoading && (
            <div className="w-64 h-64 flex items-center justify-center">
              <Loading size={30} />
            </div>
          )}
        </div>
        <div className="flex justify-center mt-2">
          <Button
            outline
            fullWidth
            className="mr-4"
            onClick={async () => {
              onClose();
            }}
          >
            取消
          </Button>
          <Button
            fullWidth
            onClick={async () => {
              onClose(true);
            }}
          >
            我已支付
          </Button>
        </div>
        <div className="flex justify-center items-center mt-5 text-gray-500 text-12">
          <span className="flex items-center mr-1">
            <MdInfo className="text-16" />
          </span>
          手机还没有安装 Mixin ?
          <a
            className="text-indigo-400 ml-1"
            href="https://mixin.one/messenger"
            target="_blank"
            rel="noopener noreferrer"
          >
            前往下载
          </a>
        </div>
      </div>
    </div>
  );
});

const MixinConnectionModal = observer((props: IMixinConnectionModalProps) => {
  const { open, onClose } = props;

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <MixinConnection {...props} />
    </Dialog>
  );
});

interface IProps {
  producer: IProducer;
}

interface MixinConnectionResp {
  amount: string;
  memo: any;
  paymentUrl: string;
  trace: string;
}

export default observer((props: IProps) => {
  const { producer } = props;
  const { accountStore, modalStore, confirmDialogStore } = useStore();
  const { account, permissionKeys, keyPermissionsMap } = accountStore;
  const state = useLocalStore(() => ({
    openMixinConnectionModal: false,
    connectingMixin: false,
    mixinConnectionResp: {} as MixinConnectionResp,
  }));

  React.useEffect(() => {
    (async () => {
      try {
        const account: any = await PrsAtm.fetch({
          actions: ['atm', 'getAccount'],
          args: [accountStore.account.account_name],
        });
        accountStore.setAccount(account);
      } catch (err) {}
    })();
  }, []);

  const connectMixin = async () => {
    modalStore.verification.show({
      strict: true,
      pass: async (privateKey: string, accountName: string) => {
        state.connectingMixin = true;
        try {
          const resp: any = await PrsAtm.fetch({
            actions: ['atm', 'bindIdentity'],
            args: [accountName, privateKey],
            minPending: 800,
            logging: true,
          });
          state.mixinConnectionResp = resp;
          state.openMixinConnectionModal = true;
        } catch (err) {
          console.log(err);
        }
        state.connectingMixin = false;
      },
    });
  };

  return (
    <div className="bg-white rounded-12 text-gray-6d">
      <div className="px-5 pt-4 pb-3 leading-none text-16 border-b border-gray-ec flex justify-between items-center">
        基本信息
      </div>
      <div className="pl-5 py-4">
        <div>账户名 ：{account.account_name}</div>
        <div className="mt-1">
          权限：{keyPermissionsMap[permissionKeys[0]].join(', ')}
        </div>
        <div className="mt-1">cpu：{account.total_resources.cpu_weight}</div>
        <div className="mt-1">net：{account.total_resources.net_weight}</div>
        {!isEmpty(producer) && (
          <div>
            <div className="mt-1">
              获得投票数：{parseInt(producer.total_votes as any, 10)}
            </div>
            <div className="mt-1">待领取的区块数：{producer.unpaid_blocks}</div>
            <div className="mt-1">
              最近一次领取：
              {moment(producer.last_claim_time).format('yyyy-MM-DD HH:mm')}
            </div>
          </div>
        )}
        <div className="mt-2-px flex items-center">
          Mixin 账号：
          {!account.bound_mixin_profile && (
            <div className="text-gray-bd">正在确认中...</div>
          )}
          {account.bound_mixin_profile && (
            <Tooltip
              placement="top"
              title={account.bound_mixin_profile.identity_number}
              arrow
            >
              <span>{account.bound_mixin_profile.full_name}</span>
            </Tooltip>
          )}
          {account.bound_mixin_profile && (
            <Button
              outline
              size="mini"
              className="ml-3"
              onClick={connectMixin}
              isDoing={state.connectingMixin}
            >
              重新绑定
            </Button>
          )}
        </div>
      </div>
      <MixinConnectionModal
        amount={state.mixinConnectionResp.amount}
        paymentUrl={state.mixinConnectionResp.paymentUrl}
        open={state.openMixinConnectionModal}
        onClose={async (done) => {
          state.openMixinConnectionModal = false;
          if (done) {
            await sleep(500);
            confirmDialogStore.show({
              content: '这个操作正在上链，等待确认中，预计 3-5 分钟后完成',
              okText: '我知道了',
              ok: () => confirmDialogStore.hide(),
              cancelDisabled: true,
            });
          }
        }}
      />
    </div>
  );
});
