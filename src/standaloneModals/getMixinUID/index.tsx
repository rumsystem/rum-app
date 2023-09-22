import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { runInAction, action } from 'mobx';
import classNames from 'classnames';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import Button from 'components/Button';
import { StoreProvider, useStore } from 'store';
import { ThemeRoot } from 'utils/theme';
import { lang } from 'utils/lang';
import { getAccessToken, getUserProfile } from 'apis/mixin';
import { client_id, getVerifierAndChanllege, getOAuthUrl } from 'utils/mixinOAuth';
import { MdInfo } from 'react-icons/md';
import Loading from 'components/Loading';
import { isWindow } from 'utils/env';

export default async () => new Promise<string>((rs, rj) => {
  const div = document.createElement('div');
  document.body.append(div);
  const unmount = () => {
    unmountComponentAtNode(div);
    div.remove();
  };
  render(
    (
      <ThemeRoot>
        <StoreProvider>
          <BindMixinModal
            rs={(v: any) => {
              rs(v);
              setTimeout(unmount, 3000);
            }}
            rj={(e: any) => {
              rj(e);
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

const MixinOAuth = observer((props: any) => {
  const { snackbarStore } = useStore();
  const { onClose } = props;
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
      message: lang.failToFetchMixinProfile,
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
            if (res2 && res2.data && res2.data.user_id) {
              props.rs(res2.data.user_id);
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
    <div className="bg-white rounded-0 text-center">
      <div className="py-8 px-14 text-center">
        <div className="text-18 font-bold text-gray-700 flex items-center justify-center">连接 Mixin 账号</div>
        <div className="text-12 mt-2 text-gray-6d">
          {lang.mixinScanToConnect}
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
            onClick={() => {
              onClose();
            }}
          >
            {lang.cancel}
          </Button>
        </div>
        <div className="flex justify-center items-center mt-5 text-gray-400 text-12">
          <span className="flex items-center mr-1">
            <MdInfo className="text-16" />
          </span>
          {lang.noMixinOnYourPhone}
          <a
            className="text-gray-700 ml-1"
            href="https://mixin.one/messenger"
            target="_blank"
            rel="noopener noreferrer"
          >
            {lang.toDownload}
          </a>
        </div>
      </div>
    </div>
  );
});

const BindMixinModal = observer((props: any) => {
  const state = useLocalObservable(() => ({
    open: true,
  }));

  const handleClose = action(() => {
    state.open = false;
  });

  return (
    <Dialog open={state.open} onClose={handleClose}>
      <MixinOAuth {...props} onClose={handleClose} />
    </Dialog>
  );
});
