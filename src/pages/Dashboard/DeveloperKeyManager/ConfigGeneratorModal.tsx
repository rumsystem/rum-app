import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import { TextField } from '@material-ui/core';
import Button from 'components/Button';
import { MdInfo } from 'react-icons/md';
import { useStore } from 'store';
import Encryption from './Encryption';
import Stringify from './Stringify';
import MixinKey from './MixinKey';
import defaultConfig from './default.config';
import defaultWalletConfig from './default.config.wallet';
import { sleep } from 'utils';
import { remote } from 'electron';
import fs from 'fs';
import util from 'util';
import { cloneDeep } from 'lodash';
import { shell } from 'electron';

const pWriteFile = util.promisify(fs.writeFile);

interface IProps {
  open: boolean;
  onClose: (currency?: string) => void;
}

const ConfigGenerator = observer(() => {
  const { snackbarStore, modalStore, accountStore } = useStore();
  const state = useLocalStore(() => ({
    loading: false,
    siteName: '',
    domain: '',
    mixinId: '',
    clientSecret: '',
    session: ``,
    config: null as any,
    walletConfig: null as any,
  }));

  const generateConfig = async (
    siteName: string,
    domain: string,
    config: any,
    mixinConfig: {}
  ) => {
    config.encryption = Encryption.createEncryption();
    const mixin = await MixinKey.create(mixinConfig);
    appendSiteName(config, siteName);
    appendMixin(config, mixin);
    appendVariables(config);
    const variableString = Stringify.getVariableString(domain);
    const configString = Stringify.getConfigString(config);
    return `${variableString}module.exports = ${configString}`;
  };

  const appendSiteName = (config: any, siteName: string) => {
    config.settings['site.name'] = siteName;
    config.settings['site.title'] = siteName;
    config.settings[
      'permission.denyText'
    ] = `您需要加入【${siteName}】才能阅读内容`;
  };

  const appendMixin = (config: any, mixin: any) => {
    config.provider.mixin = {
      ...mixin,
      ...config.provider.mixin,
    };
    return config;
  };

  const appendVariables = (config: any) => {
    config.serviceRoot = `\${serviceRoot}`;
    config.serviceKey = `\${serviceKey}`;
    config.auth.tokenKey = `\${serviceKey}_TOKEN`;
    config.provider.mixin.callbackUrl = `\${serviceRoot}${config.provider.mixin.callbackUrl}`;
    config.settings['site.url'] = config.serviceRoot;
  };

  const generateWalletConfig = async (config: any) => {
    config.encryption = Encryption.createWalletEncryption();
    const configString = Stringify.getConfigString(config);
    return `module.exports = ${configString}`;
  };

  const submit = async () => {
    if (!state.domain) {
      snackbarStore.show({
        message: '请输入应用域名',
        type: 'error',
      });
      return;
    }
    if (!state.mixinId) {
      snackbarStore.show({
        message: '请输入 Mixin ID',
        type: 'error',
      });
      return;
    }
    if (!state.clientSecret) {
      snackbarStore.show({
        message: '请输入应用密钥',
        type: 'error',
      });
      return;
    }
    if (!state.domain) {
      snackbarStore.show({
        message: '请输入应用 Session',
        type: 'error',
      });
      return;
    }
    modalStore.verification.show({
      pass: async (privateKey: string) => {
        try {
          state.loading = true;
          await sleep(800);
          const topic: any = {
            account: accountStore.account.account_name,
            publicKey: accountStore.publicKey,
            privateKey,
            blockProducerEndpoint: 'https://prs-bp-cn1.xue.cn',
          };
          const config = await generateConfig(
            state.siteName,
            state.domain,
            {
              ...cloneDeep(defaultConfig),
              topic,
            },
            {
              id: state.mixinId,
              client_secret: state.clientSecret,
              ...JSON.parse(state.session),
            }
          );
          state.config = config;
          const walletConfig = await generateWalletConfig(defaultWalletConfig);
          state.walletConfig = walletConfig;
        } catch (err) {
          console.log(err.message);
          snackbarStore.show({
            message: '貌似哪里出错了，无法生成配置文件',
            type: 'error',
          });
        }
        state.loading = false;
      },
    });
  };

  return (
    <div className="bg-white rounded-12 text-center py-8 px-12 w-110">
      <div className="text-18 font-bold">飞帖配置生成器</div>
      <div className="pt-3">
        <TextField
          className="w-full"
          placeholder="应用名称"
          size="small"
          value={state.siteName}
          onChange={(e) => {
            state.siteName = e.target.value;
          }}
          margin="dense"
          variant="outlined"
        />
        <TextField
          className="w-full"
          placeholder="应用域名，比如：https://zuopin.xin"
          size="small"
          value={state.domain}
          onChange={(e) => {
            const { value } = e.target;
            if (value.length > 10 && value.endsWith('/')) {
              state.domain = value.slice(0, value.length - 1);
            } else {
              state.domain = value;
            }
          }}
          margin="dense"
          variant="outlined"
        />
        <TextField
          className="w-full"
          placeholder="Mixin ID"
          size="small"
          value={state.mixinId}
          onChange={(e) => {
            state.mixinId = e.target.value;
          }}
          margin="dense"
          variant="outlined"
        />
        <TextField
          className="w-full"
          placeholder="Mixin 应用密钥"
          size="small"
          value={state.clientSecret}
          onChange={(e) => {
            state.clientSecret = e.target.value;
          }}
          margin="dense"
          variant="outlined"
        />
        <TextField
          className="w-full"
          placeholder="Mixin 应用 Session"
          size="small"
          rows="5"
          multiline
          value={state.session}
          onChange={(e) => {
            state.session = e.target.value;
          }}
          margin="dense"
          variant="outlined"
        />
        <div className="mt-5" onClick={submit}>
          <Button fullWidth isDoing={state.loading}>
            生成配置文件
          </Button>
        </div>
        {!state.config && (
          <div className="flex justify-center items-center mt-3 text-gray-400 text-12">
            <span className="flex items-center mr-2-px">
              <MdInfo className="text-16" />
            </span>
            <span
              onClick={() => {
                shell.openExternal(
                  `https://docs.prsdev.club/#/flying-pub/%E5%BB%BA%E7%AB%99%E6%95%99%E7%A8%8B?id=%e5%85%8d%e8%b4%b9%e6%b3%a8%e5%86%8c%e5%bc%80%e5%8f%91%e8%80%85%e8%b4%a6%e5%8f%b7`
                );
              }}
              className="cursor-pointer text-indigo-400"
            >
              如何填写配置?
            </span>
          </div>
        )}
        {!state.loading && state.config && (
          <div className="mt-6 text-gray-9b flex items-center pl-2 border-l-4 border-indigo-400 ">
            <span className="text-15 font-bold">config.js</span>
            <Button
              className="ml-3"
              size="mini"
              outline
              onClick={async () => {
                try {
                  const file = await remote.dialog.showSaveDialog({
                    defaultPath: 'config.js',
                  });
                  if (!file.canceled && file.filePath) {
                    await pWriteFile(file.filePath.toString(), state.config);
                  }
                } catch (err) {
                  console.log(err.message);
                }
              }}
            >
              点击下载
            </Button>
          </div>
        )}
        {!state.loading && state.walletConfig && (
          <div className="mt-4 text-gray-9b flex items-center pl-2 border-l-4 border-indigo-400">
            <span className="text-15 font-bold">config.wallet.js</span>
            <Button
              className="ml-3"
              size="mini"
              outline
              onClick={async () => {
                try {
                  const file = await remote.dialog.showSaveDialog({
                    defaultPath: 'config.wallet.js',
                  });
                  if (!file.canceled && file.filePath) {
                    await pWriteFile(
                      file.filePath.toString(),
                      state.walletConfig
                    );
                  }
                } catch (err) {
                  console.log(err.message);
                }
              }}
            >
              点击下载
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

export default observer((props: IProps) => {
  return (
    <Dialog
      open={props.open}
      onClose={() => props.onClose()}
      transitionDuration={{
        enter: 300,
      }}
    >
      <ConfigGenerator />
    </Dialog>
  );
});
