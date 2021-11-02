import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { useStore } from 'store';
import { useHistory } from 'react-router-dom';
import { sleep } from 'utils';

interface IProps {
  open: boolean;
  onClose: () => void;
}

const AccountManager = observer((props: IProps) => {
  const {
    accountStore,
    confirmDialogStore,
    modalStore,
    snackbarStore,
  } = useStore();
  const { publicKeys, PublicKeyAccountMap } = accountStore;
  const history = useHistory();

  return (
    <div className="p-10">
      <div className="w-80 h-80 overflow-y-auto">
        <div className="text-18 font-bold text-center pb-2">已登录的账号</div>
        {publicKeys.map((publicKey) => {
          const account = PublicKeyAccountMap[publicKey];
          const isCurrentAccount = publicKey === accountStore.publicKey;
          return (
            <div
              key={publicKey}
              className="mt-3 border border-gray-d8 p-5 py-3 flex items-center justify-between rounded-md cursor-pointer"
            >
              <div className="text-gray-6d text-16 font-bold flex items-center">
                {account.account_name}
              </div>
              <div className="flex items-center justify-end">
                {!isCurrentAccount && (
                  <Button
                    size="mini"
                    onClick={async () => {
                      accountStore.switchAccount(publicKey);
                      modalStore.pageLoading.show();
                      props.onClose();
                      await sleep(100);
                      history.replace('/');
                      await sleep(500);
                      history.replace('/dashboard');
                      modalStore.pageLoading.hide();
                      await sleep(400);
                      snackbarStore.show({
                        message: `已切换到账号 ${account.account_name}`,
                      });
                    }}
                  >
                    切换
                  </Button>
                )}
                {isCurrentAccount && (
                  <Button size="mini" color="gray" outline>
                    当前账号
                  </Button>
                )}
                <Button
                  size="mini"
                  className="ml-3"
                  color="red"
                  outline
                  onClick={() => {
                    confirmDialogStore.show({
                      contentClassName: 'text-left',
                      content:
                        '务必妥善备份并保管你的私钥文件、账号名及密码等；如你不慎遗失或泄露，将无法找回！<br /><br />请不要使用公共电脑登入。使用个人电脑登入时，最好经常退出再登入，以检查你是否妥善保管好了登录信息。',
                      okText: '确认退出',
                      isDangerous: true,
                      ok: async () => {
                        confirmDialogStore.hide();
                        if (isCurrentAccount) {
                          props.onClose();
                          if (publicKeys.length === 1) {
                            accountStore.logout();
                            history.replace('/producer');
                          } else {
                            modalStore.pageLoading.show();
                            accountStore.removeAccount(publicKey);
                            await sleep(100);
                            accountStore.switchAccount(
                              accountStore.publicKeys[0]
                            );
                            await sleep(100);
                            history.replace('/');
                            await sleep(500);
                            history.replace('/dashboard');
                            modalStore.pageLoading.hide();
                            await sleep(400);
                            confirmDialogStore.show({
                              content: `你退出了当前账号，系统已自动为你切换到另外一个已登录的账号 ${accountStore.account.account_name}`,
                              okText: '我知道了',
                              cancelDisabled: true,
                              ok: () => {
                                confirmDialogStore.hide();
                              },
                            });
                          }
                        } else {
                          accountStore.removeAccount(publicKey);
                          await sleep(200);
                          snackbarStore.show({
                            message: `账号 ${account.account_name} 已退出`,
                          });
                        }
                      },
                    });
                  }}
                >
                  退出
                </Button>
              </div>
            </div>
          );
        })}
        <div
          className="mt-8 flex justify-center"
          onClick={async () => {
            props.onClose();
            await sleep(300);
            modalStore.auth.show();
          }}
        >
          <Button>添加账号</Button>
        </div>
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  return (
    <Dialog
      open={props.open}
      onClose={() => {
        props.onClose();
      }}
    >
      <AccountManager {...props} />
    </Dialog>
  );
});
