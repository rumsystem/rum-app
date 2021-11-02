import React from 'react';
import { runInAction, toJS } from 'mobx';
import classNames from 'classnames';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Loading from 'components/Loading';
import { TextField, Checkbox } from '@material-ui/core';
import Button from 'components/Button';
import { isWindow, isProduction } from 'utils/env';
import sleep from 'utils/sleep';
import { useStore } from 'store';
import { client_id, getVerifierAndChanllege, getOAuthUrl } from 'utils/mixinOAuth';
import { getAccessToken, getUserProfile } from 'apis/mixinOAuth';
import ImageEditor from 'components/ImageEditor';
import Tooltip from '@material-ui/core/Tooltip';
import InputAdornment from '@material-ui/core/InputAdornment';
import useSubmitPerson from 'hooks/useSubmitPerson';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import * as globalProfileModel from 'hooks/useOffChainDatabase/models/globalProfile';
import { MdInfo } from 'react-icons/md';
import { isEqual } from 'lodash';
import useDatabase from 'hooks/useDatabase';
import * as PersonModel from 'hooks/useDatabase/models/person';
import MiddleTruncate from 'components/MiddleTruncate';
import { app } from '@electron/remote';
import { checkAmount, CURRENCIES } from './utils';

const BASE_PASH = isProduction ? process.resourcesPath : `file://${app.getAppPath()}`;
const getCurrencyIcon = (currency: string) => `${BASE_PASH}/assets/currency_icons/${currency}.png`;

interface BindMixinModalProps {
  open: boolean
  onClose: () => void
  onBind: (mixinUID: string) => void
}

const MixinOAuth = observer((props: BindMixinModalProps) => {
  const { snackbarStore } = useStore();
  const { onClose, onBind } = props;
  const state = useLocalObservable(() => ({
    verifier: null as null | string,
    challenge: null as null | string,
    oauthUrl: null as null | string,
    webviewLoading: true,
    webview: null as null | HTMLWebViewElement,
  }));


  const loadStop = React.useCallback(() => {
    if ((state.webview as any)?.getURL() === state.oauthUrl) {
      runInAction(() => {
        state.webviewLoading = false;
      });
    }
  }, []);

  const handleOauthFailure = () => {
    onClose();
    snackbarStore.show({
      message: '获取mixin信息失败',
      type: 'error',
    });
  };

  const redirecting = React.useCallback(async (event: Event) => {
    const currentUrl = (event as Event & {url: string}).url;
    if (currentUrl !== state.oauthUrl) {
      runInAction(() => {
        state.webviewLoading = true;
      });
      const regExp = /code=([^&#]*)/g;
      const code = regExp.exec(currentUrl)?.[1];
      if (code && state.verifier) {
        try {
          const res = await getAccessToken({ client_id, code, code_verifier: state.verifier });
          if (res?.data?.access_token) {
            const res2 = await getUserProfile(res.data.access_token);
            if (res2?.data?.user_id) {
              onBind(res2?.data?.user_id);
              onClose();
            } else {
              handleOauthFailure();
            }
          } else {
            handleOauthFailure();
          }
        } catch (e) {
          console.warn(e);
          handleOauthFailure();
        }
      } else {
        handleOauthFailure();
      }
    }
  }, []);

  React.useEffect(() => {
    const { verifier, challenge } = getVerifierAndChanllege();
    const oauthUrl = getOAuthUrl(challenge);
    state.verifier = verifier;
    state.challenge = challenge;
    state.oauthUrl = oauthUrl;
  }, [state]);

  React.useEffect(() => {
    state.webview?.addEventListener('did-stop-loading', loadStop);
    state.webview?.addEventListener('will-navigate', redirecting);
    return () => {
      state.webview?.removeEventListener('did-stop-loading', loadStop);
      state.webview?.removeEventListener('will-navigate', redirecting);
    };
  }, [state.oauthUrl]);

  return (
    <div className="bg-white rounded-12 text-center">
      <div className="py-8 px-12 text-center">
        <div className="text-18 font-bold text-gray-700">绑定 Mixin 账号</div>
        <div className="text-12 mt-2 text-gray-6d">
          Mixin 扫码以完成绑定
        </div>
        <div className="relative overflow-hidden">
          {state.oauthUrl && (
            <div
              className={classNames(
                {
                  hidden: state.webviewLoading,
                },
                'w-64 h-64',
              )}
            >
              <webview
                src={state.oauthUrl}
                ref={(ref) => { state.webview = ref; }}
              />
              <style jsx>{`
                webview {
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
          {state.webviewLoading && (
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
            onClick={() => {
              onClose();
            }}
          >
            取消
          </Button>
        </div>
        <div className="flex justify-center items-center mt-5 text-gray-400 text-12">
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

const BindMixinModal = observer((props: BindMixinModalProps) => {
  const { open, onClose } = props;

  return (
    <Dialog open={open} onClose={() => onClose()}>
      <MixinOAuth {...props} />
    </Dialog>
  );
});

const MixinPayment = observer(() => {
  const { modalStore, snackbarStore } = useStore();
  const { name } = modalStore.mixinPayment.props;
  const state2 = useLocalObservable(() => ({
    step: localStorage.getItem('REWARD_CURRENCY') ? 2 : 1,
    amount: '',
    memo: '',
    selectedCurrency: localStorage.getItem('REWARD_CURRENCY') || '',
    search: '',
    iframeLoading: false,
    paymentUrl: '',
  }));

  const getRechargePaymentUrl = () => {
    state2.iframeLoading = true;
    state2.paymentUrl = 'https://www.baidu.com';
  };

  const next = (amount: string, currency: string) => {
    const result = checkAmount(amount, currency);
    if (result.ok) {
      getRechargePaymentUrl();
      state2.step = 3;
    } else {
      snackbarStore.show(result);
    }
  };

  const step1 = () => (
    <div>
      <div className="text-lg font-bold text-gray-700 -mt-1">选择币种</div>
      <TextField
        className="w-full mt-6"
        placeholder="搜索"
        size="small"
        value={state2.search}
        onChange={(e) => {
          state2.search = e.target.value.trim();
        }}
        margin="dense"
        variant="outlined"
      />
      <div className="mt-4 w-64 pb-2 h-64 overflow-scroll">
        {
          CURRENCIES
            .filter((currency: any) => currency.token.includes(state2.search.toUpperCase()) || currency.name.toLowerCase().includes(state2.search.toLowerCase()))
            .map((currency: any) => (
              <div key={currency.token} className="py-1" title={currency.token}>
                <div
                  className="flex text-center border rounded p-3 cursor-pointer border-gray-300 text-gray-600 md:hover:border-gray-400 md:hover:text-gray-400"
                  onClick={() => {
                    localStorage.setItem('REWARD_CURRENCY', currency.token);
                    state2.selectedCurrency = currency.token;
                    state2.step = 2;
                  }}
                >
                  <div className="w-8 h-8">
                    <img
                      className="w-8 h-8"
                      src={getCurrencyIcon(currency.token)}
                      alt={currency.token}
                    />
                  </div>
                  <div className="ml-2 flex flex-col items-start justify-between leading-none currency tracking-wide">
                    <span className="">{currency.token}</span>
                    <span className="text-xs text-gray-400">{currency.name}</span>
                  </div>
                </div>
              </div>
            ))
        }
      </div>
      <style jsx>{`
        .currency {
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial,
            Noto Sans, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol,
            Noto Color Emoji;
        }
      `}</style>
    </div>
  );

  const step2 = () => (
    <div className="w-auto mx-2">
      <div className="text-base text-gray-700">
        打赏给 <span className="font-bold">{name}</span>
      </div>
      <div className="mt-3 text-gray-800">
        <TextField
          value={state2.amount}
          placeholder="数量"
          onChange={(event: any) => {
            const re = /^[0-9]+[.]?[0-9]*$/;
            const { value } = event.target;
            if (value === '' || re.test(value)) {
              state2.amount = value;
            }
          }}
          margin="normal"
          variant="outlined"
          autoFocus
          fullWidth
          onKeyPress={(e: any) => e.key === 'Enter' && next(state2.amount, state2.selectedCurrency)}
          InputProps={{
            endAdornment: <InputAdornment position="end">{state2.selectedCurrency}</InputAdornment>,
            inputProps: { maxLength: 8, type: 'text' },
          }}
        />
        <div className="-mt-2" />
        <TextField
          value={state2.memo}
          placeholder="备注（可选）"
          onChange={(event: any) => { state2.memo = event.target.value; }}
          margin="normal"
          variant="outlined"
          fullWidth
          onKeyPress={(e: any) => e.key === 'Enter' && next(state2.amount, state2.selectedCurrency)}
          inputProps={{ maxLength: 20 }}
        />
      </div>
      <div className="text-center mt-6" onClick={() => next(state2.amount, state2.selectedCurrency)}>
        <Button>下一步</Button>
      </div>
      <div
        className="mt-4 text-sm md:text-xs text-gray-400 cursor-pointer"
        onClick={() => {
          state2.selectedCurrency = '';
          state2.amount = '';
          state2.step = 1;
        }}
      >
        选择其他币种
      </div>
    </div>
  );

  const step3 = () => (
    <div className="px-10">
      <div className="text-lg font-bold text-gray-700">
        Mixin <span className="hidden md:inline-block">扫码</span>支付
      </div>
      <div className="w-64 h-64 relative overflow-hidden">
        {state2.paymentUrl && (
          <div
            className={classNames(
              {
                hidden: state2.iframeLoading,
              },
              'w-64 h-64',
            )}
          >
            <iframe
              onLoad={() => {
                setTimeout(() => {
                  state2.iframeLoading = false;
                }, 2000);
              }}
              title='Mixin'
              src={state2.paymentUrl}
            />
            <style jsx>{`
              iframe {
                height: 506px;
                width: 800px;
                position: absolute;
                top: -238px;
                left: 0;
                margin-left: -272px;
                transform: scale(0.9);
              }
            `}</style>
          </div>
        )}
        {state2.iframeLoading && (
          <div className="mt-24 pt-4">
            <Loading size={40} />
          </div>
        )}
      </div>
      <div className="mt-3 text-gray-600">
        请使用 Mixin 扫描二维码
        <br />
        支付成功后页面会自动刷新
        <br />
        <span className="text-xs text-gray-500">（如果有延时，请耐心等待一会）</span>
      </div>
      <div className="flex justify-center items-center mt-4 text-gray-500 text-xs">
        <span className="flex items-center text-lg mr-1">
          <MdInfo />
        </span>
        手机还没有安装 Mixin ?
        <a
          className="text-blue-400"
          href="https://mixin.one/messenger"
          target="_blank"
          rel="noopener noreferrer"
        >
          前往下载
        </a>
      </div>
    </div>
  );

  const database = useDatabase();
  const { activeGroupStore, nodeStore, groupStore } = useStore();
  const state = useLocalObservable(() => ({
    openBindMixinModal: false,
    loading: false,
    done: false,
    applyToAllGroups: false,
    profile: toJS(activeGroupStore.profile),
  }));
  const offChainDatabase = useOffChainDatabase();
  const submitPerson = useSubmitPerson();

  const updateProfile = async () => {
    if (!state.profile.name) {
      snackbarStore.show({
        message: '请输入昵称',
        type: 'error',
      });
      return;
    }
    state.loading = true;
    state.done = false;
    await sleep(400);
    try {
      const groupIds = state.applyToAllGroups
        ? groupStore.groups.map((group) => group.GroupId)
        : [activeGroupStore.id];
      for (const groupId of groupIds) {
        const latestPerson = await PersonModel.getUser(database, {
          GroupId: groupId,
          Publisher: nodeStore.info.node_publickey,
          latest: true,
        });
        if (
          latestPerson
          && latestPerson.profile
          && isEqual(latestPerson.profile, toJS(state.profile))
        ) {
          continue;
        }
        await submitPerson({
          groupId,
          publisher: nodeStore.info.node_publickey,
          profile: state.profile,
        });
      }
      if (state.applyToAllGroups) {
        await globalProfileModel.createOrUpdate(offChainDatabase, {
          name: state.profile.name,
          avatar: state.profile.avatar,
          mixinUID: state.profile.mixinUID,
        });
      }
      state.loading = false;
      state.done = true;
      await sleep(300);
    } catch (err) {
      console.error(err);
      state.loading = false;
      snackbarStore.show({
        message: '修改失败，貌似哪里出错了',
        type: 'error',
      });
    }
  };

  return (
    <div className="bg-white rounded-12 text-center py-8 px-12">
      { state2.step === 1 && step1()}
      { state2.step === 2 && step2()}
      { state2.step === 3 && step3()}
      { state2.step === 4 && (
        <div className="w-72">
          <div className="text-18 font-bold text-gray-700">编辑资料</div>
          <div className="mt-5">
            <div className="flex justify-center">
              <ImageEditor
                roundedFull
                width={200}
                placeholderWidth={120}
                editorPlaceholderWidth={200}
                imageUrl={state.profile.avatar}
                getImageUrl={(url: string) => {
                  state.profile.avatar = url;
                }}
              />
            </div>
            <TextField
              className="w-full px-12 mt-6"
              placeholder="昵称"
              size="small"
              value={state.profile.name}
              onChange={(e) => {
                state.profile.name = e.target.value.trim();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  (e.target as HTMLInputElement).blur();
                  updateProfile();
                }
              }}
              margin="dense"
              variant="outlined"
            />
            <div className="flex w-full px-12 mt-6">
              <div className="p-2 pl-3 border border-black border-opacity-20 text-gray-500 text-12 truncate flex-1 rounded-l-4 border-r-0 hover:border-opacity-100">
                <MiddleTruncate
                  string={state.profile.mixinUID || ''}
                  length={15}
                />
              </div>
              <Button
                noRound
                className="rounded-r-4"
                size="small"
                onClick={() => {
                  state.openBindMixinModal = true;
                }}
              >
                绑定 Mixin
              </Button>
            </div>
            <Tooltip
              enterDelay={600}
              enterNextDelay={600}
              placement="top"
              title="所有群组都使用这个昵称和头像"
              arrow
            >
              <div
                className="flex items-center justify-center mt-5 -ml-2"
                onClick={() => {
                  state.applyToAllGroups = !state.applyToAllGroups;
                }}
              >
                <Checkbox checked={state.applyToAllGroups} color="primary" />
                <span className="text-gray-88 text-13 cursor-pointer">
                  应用到所有群组
                </span>
              </div>
            </Tooltip>
          </div>

          <div className="mt-2" onClick={() => { state2.step = 2; }}>
            <Button fullWidth isDoing={state.loading} isDone={state.done}>
              确定
            </Button>
          </div>
        </div>
      )}
      <BindMixinModal
        open={state.openBindMixinModal}
        onBind={(mixinUID: string) => {
          state.profile.mixinUID = mixinUID;
        }}
        onClose={() => {
          state.openBindMixinModal = false;
        }}
      />
    </div>
  );
});

export default observer(() => {
  const { modalStore } = useStore();
  const { open } = modalStore.mixinPayment;
  return (
    <Dialog
      open={open}
      onClose={() => {
        modalStore.mixinPayment.hide();
      }}
      transitionDuration={{
        enter: 300,
      }}
    >
      <MixinPayment />
    </Dialog>
  );
});
