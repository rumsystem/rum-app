import React from 'react';
import { unmountComponentAtNode, render } from 'react-dom';
import { action, reaction, runInAction } from 'mobx';
import { observer, useLocalObservable } from 'mobx-react-lite';
import {
  Fade,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormControlLabel,
  InputAdornment,
  Switch,
  Tooltip,
  Select,
  MenuItem,
} from '@material-ui/core';
import GroupApi, { IGroup } from 'apis/group';
import sleep from 'utils/sleep';
import { GROUP_TEMPLATE_TYPE, GROUP_CONFIG_KEY, GROUP_DEFAULT_PERMISSION } from 'utils/constant';
import { ThemeRoot } from 'utils/theme';
import { StoreProvider, useStore } from 'store';
import useFetchGroups from 'hooks/useFetchGroups';
import TimelineIcon from 'assets/template_icon_timeline.svg?react';
import PostIcon from 'assets/template_icon_post.svg?react';
import NotebookIcon from 'assets/template_icon_note.svg?react';
import AuthDefaultReadIcon from 'assets/auth_default_read.svg?react';
import AuthDefaultWriteIcon from 'assets/auth_default_write.svg?react';
import { lang } from 'utils/lang';
import { initProfile } from 'standaloneModals/initProfile';
import AuthApi from 'apis/auth';
import { useLeaveGroup } from 'hooks/useLeaveGroup';
import UserApi from 'apis/user';
import BoxRadio from 'components/BoxRadio';
import BottomBar from './BottomBar';
import inputFinanceAmount from 'utils/inputFinanceAmount';
import MVMApi, { ICoin } from 'apis/mvm';
import * as ethers from 'ethers';
import * as Contract from 'utils/contract';
import getKeyName from 'utils/getKeyName';
import KeystoreApi from 'apis/keystore';

export const createGroup = async () => new Promise<void>((rs) => {
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
          <CreateGroup
            rs={() => {
              rs();
              setTimeout(unmount, 3000);
            }}
          />
        </StoreProvider>
      </ThemeRoot>
    ),
    div,
  );
});

interface Props {
  rs: () => unknown
}

const CreateGroup = observer((props: Props) => {
  const state = useLocalObservable(() => ({
    open: false,
    step: 0,

    type: GROUP_TEMPLATE_TYPE.TIMELINE,
    name: '',
    desc: '',
    consensusType: 'poa',
    defaultPermission: GROUP_DEFAULT_PERMISSION.WRITE as GROUP_DEFAULT_PERMISSION,

    paidAmount: '',
    isPaidGroup: false,
    invokeFee: '',
    assetSymbol: '',
    get coin() {
      return this.coins.find((coin) => coin.symbol === state.assetSymbol)!;
    },

    fetchedCoins: false,
    coins: [] as ICoin[],

    creating: false,

    get descEnabled() {
      return this.type !== GROUP_TEMPLATE_TYPE.NOTE;
    },

    get paidGroupEnabled() {
      return this.type !== GROUP_TEMPLATE_TYPE.NOTE && betaFeatureStore.betaFeatures.includes('PAID_GROUP') && this.fetchedCoins;
    },

    get isAuthEnabled() {
      return this.type !== GROUP_TEMPLATE_TYPE.NOTE;
    },

    get encryptionType() {
      return this.type === GROUP_TEMPLATE_TYPE.NOTE || this.isPaidGroup ? 'private' : 'public';
    },

    get totalStep() {
      return this.type === GROUP_TEMPLATE_TYPE.NOTE ? 2 : 3;
    },

    get typeName() {
      if (this.type === GROUP_TEMPLATE_TYPE.TIMELINE) {
        return lang.feedTemplateName;
      }
      if (this.type === GROUP_TEMPLATE_TYPE.POST) {
        return lang.bbsTemplateName;
      }
      if (this.type === GROUP_TEMPLATE_TYPE.NOTE) {
        return lang.noteTemplateName;
      }
      return '';
    },
  }));
  const {
    snackbarStore,
    activeGroupStore,
    confirmDialogStore,
    betaFeatureStore,
    nodeStore,
  } = useStore();
  const fetchGroups = useFetchGroups();
  const leaveGroup = useLeaveGroup();
  const scrollBox = React.useRef<HTMLDivElement>(null);

  const handleConfirm = () => {
    if (!state.name) {
      snackbarStore.show({
        message: lang.require(lang.groupName),
        type: 'error',
      });
      return;
    }

    if (state.isPaidGroup && !state.paidAmount) {
      snackbarStore.show({
        message: lang.require(lang.payAmount),
        type: 'error',
      });
      return;
    }

    if (state.creating) {
      return;
    }

    confirmDialogStore.show({
      content: lang.unchangedGroupConfigTip,
      cancelText: lang.back,
      cancel: () => {
        confirmDialogStore.hide();
      },
      ok: async () => {
        runInAction(() => { state.creating = true; });

        confirmDialogStore.hide();

        await sleep(500);

        try {
          const { group_id: groupId } = await GroupApi.createGroup({
            group_name: state.name,
            consensus_type: state.consensusType,
            encryption_type: state.encryptionType,
            app_key: state.type,
          });
          const { groups } = await GroupApi.fetchMyGroups();
          const group = (groups || []).find((g) => g.group_id === groupId) || ({} as IGroup);
          if (state.isPaidGroup) {
            const isSuccess = await handlePaidGroup(group);
            if (!isSuccess) {
              return;
            }
          }
          await handleDefaultPermission(group);
          if (state.defaultPermission === GROUP_DEFAULT_PERMISSION.READ || state.encryptionType === 'private') {
            await handleAllowMode(group);
          }
          if (state.desc) {
            await handleDesc(group);
          }
          await sleep(150);
          await fetchGroups();
          await sleep(150);
          activeGroupStore.setId(group.group_id);
          await sleep(150);
          snackbarStore.show({
            message: lang.created,
            duration: 1000,
          });
          handleClose();
          if (group.app_key !== GROUP_TEMPLATE_TYPE.NOTE) {
            await sleep(1500);
            await initProfile(group.group_id);
          }
        } catch (err) {
          console.error(err);
          runInAction(() => { state.creating = false; });
          snackbarStore.show({
            message: lang.somethingWrong,
            type: 'error',
          });
        }
      },
      confirmTestId: 'create-group-confirm-modal-confirm',
    });
  };

  const handlePaidGroup = async (group: IGroup) => {
    const { group_id: groupId } = group;
    const balanceWEI = await Contract.provider.getBalance(group.user_eth_addr);
    const balanceETH = ethers.utils.formatEther(balanceWEI);
    const notEnoughFee = parseInt(balanceETH, 10) < 1;
    if (notEnoughFee) {
      await MVMApi.requestFee({
        account: group.user_eth_addr,
      });
    }
    const contract = new ethers.Contract(Contract.PAID_GROUP_CONTRACT_ADDRESS, Contract.PAID_GROUP_ABI, Contract.provider);
    const data = contract.interface.encodeFunctionData('addPrice', [
      ethers.BigNumber.from("0x" + groupId.replace(/-/g, "")),
      99999999,
      state.coin.rumAddress,
      ethers.utils.parseEther(state.paidAmount),
    ]);
    const [keyName, nonce, gasPrice, network] = await Promise.all([
      getKeyName(nodeStore.storagePath, group.user_eth_addr),
      Contract.provider.getTransactionCount(group.user_eth_addr, 'pending'),
      Contract.provider.getGasPrice(),
      Contract.provider.getNetwork(),
    ]);
    if (!keyName) {
      console.log('keyName not found');
      return;
    }
    const { data: signedTrx } = await KeystoreApi.signTx({
      keyname: keyName,
      nonce,
      to: Contract.PAID_GROUP_CONTRACT_ADDRESS,
      value: ethers.utils.parseEther(state.invokeFee).toHexString(),
      gas_limit: 300000,
      gas_price: gasPrice.toHexString(),
      data,
      chain_id: String(network.chainId),
    });
    const txHash = await Contract.provider.send('eth_sendRawTransaction', [signedTrx]);
    await Contract.provider.waitForTransaction(txHash);
    const receipt = await Contract.provider.getTransactionReceipt(txHash);
    if (receipt.status === 0) {
      await leaveGroup(groupId);
      return false;
    }
    state.creating = false;
    const announceRet = await UserApi.announce({
      group_id: groupId,
      action: 'add',
      type: 'user',
      memo: group.user_eth_addr,
    });
    console.log({ announceRet });
    return true;
  };

  const handleDesc = async (group: IGroup) => {
    await GroupApi.changeGroupConfig({
      group_id: group.group_id,
      action: 'add',
      name: GROUP_CONFIG_KEY.GROUP_DESC,
      type: 'string',
      value: state.desc,
    });
  };

  const handleDefaultPermission = async (group: IGroup) => {
    await GroupApi.changeGroupConfig({
      group_id: group.group_id,
      action: 'add',
      name: GROUP_CONFIG_KEY.GROUP_DEFAULT_PERMISSION,
      type: 'string',
      value: state.defaultPermission,
    });
  };

  const handleAllowMode = async (group: IGroup) => {
    await AuthApi.updateFollowingRule({
      group_id: group.group_id,
      type: 'set_trx_auth_mode',
      config: {
        trx_type: 'POST',
        trx_auth_mode: 'FOLLOW_ALW_LIST',
        memo: '',
      },
    });
    await AuthApi.updateAuthList({
      group_id: group.group_id,
      type: 'upd_alw_list',
      config: {
        action: 'add',
        pubkey: group.user_pubkey,
        trx_type: ['POST'],
        memo: '',
      },
    });
  };

  React.useEffect(() => {
    if (state.step === 2 && state.paidGroupEnabled) {
      (async () => {
        try {
          const contract = new ethers.Contract(Contract.PAID_GROUP_CONTRACT_ADDRESS, Contract.PAID_GROUP_ABI, Contract.provider);
          const ret = await contract.getDappInfo();
          state.invokeFee = ethers.utils.formatEther(ret.invokeFee);
        } catch (err) {
          console.log(err);
        }
      })();
    }
  }, [state.step, state.paidGroupEnabled]);

  const handleClose = action(() => {
    props.rs();
    state.open = false;
  });

  React.useEffect(() => reaction(
    () => state.step,
    () => {
      if (scrollBox.current) {
        scrollBox.current.scrollTop = 0;
      }
    },
  ), []);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await MVMApi.coins();
        state.coins = Object.values(res.data);
        state.fetchedCoins = true;
      } catch (err) {
        console.log(err);
      }
    })();
  }, []);

  React.useEffect(action(() => {
    state.open = true;
  }), []);

  return (
    <Fade
      in={state.open}
      timeout={200}
      mountOnEnter
      unmountOnExit
    >
      <div className="fixed inset-0 top-[40px] bg-gray-f7 z-50 overflow-auto">
        <div
          className="flex justify-center"
          ref={scrollBox}
        >
          <div className="w-[720px] text-gray-6d my-8 px-20 pt-8 pb-16 bg-white">
            {state.step === 0 && (
              <div className="animate-fade-in">
                <div className="text-18 font-medium -mx-8 animate-fade-in">
                  {lang.chooseTemplate}
                </div>

                <div className="mt-4 text-13 text-gray-9b">
                  {lang.groupTypeDesc}
                </div>

                <div className="mt-8">
                  <BoxRadio
                    value={state.type}
                    items={[
                      {
                        value: GROUP_TEMPLATE_TYPE.TIMELINE,
                        RadioContentComponent: getRadioContentComponent(TimelineIcon, lang.sns, 'Feed'),
                        descComponent: () => lang.snsDesc,
                        'data-test-id': `group-type-${GROUP_TEMPLATE_TYPE.TIMELINE}`,
                      },
                      {
                        value: GROUP_TEMPLATE_TYPE.POST,
                        RadioContentComponent: getRadioContentComponent(PostIcon, lang.forum, 'BBS'),
                        descComponent: () => lang.forumDesc,
                        'data-test-id': `group-type-${GROUP_TEMPLATE_TYPE.POST}`,
                      },
                      {
                        value: GROUP_TEMPLATE_TYPE.NOTE,
                        RadioContentComponent: getRadioContentComponent(NotebookIcon, lang.notebook, 'Private Note'),
                        descComponent: () => lang.noteDesc,
                        'data-test-id': `group-type-${GROUP_TEMPLATE_TYPE.NOTE}`,
                      },
                    ]}
                    onChange={(value) => {
                      state.type = value as GROUP_TEMPLATE_TYPE;
                    }}
                  />
                </div>
              </div>
            )}

            {state.step === 1 && (
              <div className="animate-fade-in">
                <div className="text-18 font-medium -mx-8 animate-fade-in">
                  {state.typeName} {lang.template} - {lang.authSettings}
                </div>

                <div className="mt-4 text-13 text-gray-9b">
                  {lang.immutableAuthSettingsTip}
                </div>

                <div className="mt-8 flex justify-center">
                  <BoxRadio
                    value={state.defaultPermission}
                    items={[
                      {
                        value: GROUP_DEFAULT_PERMISSION.WRITE,
                        RadioContentComponent: getRadioContentComponent(AuthDefaultWriteIcon, lang.defaultWriteTypeTip),
                        descComponent: () => (
                          <div>
                            {lang.defaultWriteTip}
                          </div>
                        ),
                      },
                      {
                        value: GROUP_DEFAULT_PERMISSION.READ,
                        RadioContentComponent: getRadioContentComponent(AuthDefaultReadIcon, lang.defaultReadTypeTip),
                        descComponent: () => (
                          <div>
                            {lang.defaultReadTip1}
                            <Tooltip
                              placement="right"
                              title={lang.defaultReadTip2}
                              arrow
                            >
                              <span className="text-blue-400">
                                (?)
                              </span>
                            </Tooltip>
                            {lang.defaultReadTip3}
                          </div>
                        )
                        ,
                      },
                    ]}
                    onChange={(value) => {
                      state.defaultPermission = value as GROUP_DEFAULT_PERMISSION;
                    }}
                  />
                </div>
              </div>
            )}

            {state.step === 2 && (
              <div className="animate-fade-in">
                <div className="text-18 font-medium -mx-8">
                  {state.typeName} {lang.template} - {lang.basicInfoSettings}
                </div>

                <div className="mt-2 px-5">
                  <FormControl className="mt-8 w-full" variant="outlined">
                    <InputLabel>{lang.name}{lang.immutableGroupNameTip}</InputLabel>
                    <OutlinedInput
                      label={`${lang.name}${lang.immutableGroupNameTip}`}
                      value={state.name}
                      onChange={action((e) => { state.name = e.target.value; })}
                      spellCheck={false}
                      autoFocus
                      data-test-id="create-group-name-input"
                    />
                  </FormControl>
                  {state.descEnabled && (
                    <FormControl className="mt-8 w-full" variant="outlined">
                      <InputLabel>{lang.desc + `(${lang.optional})`}</InputLabel>
                      <OutlinedInput
                        label={lang.desc + `(${lang.optional})`}
                        value={state.desc}
                        onChange={action((e) => { state.desc = e.target.value; })}
                        multiline
                        minRows={3}
                        maxRows={6}
                        spellCheck={false}
                      />
                    </FormControl>
                  )}
                  {state.paidGroupEnabled && (
                    <div className="mt-5">
                      <FormControlLabel
                        control={<Switch
                          checked={state.isPaidGroup}
                          color='primary'
                          onChange={(e) => {
                            state.isPaidGroup = e.target.checked;
                          }}
                        />}
                        label={(
                          <div className="text-gray-6f">
                            {lang.payable}
                          </div>
                        )}
                      />
                      {state.isPaidGroup && (
                        <div className="py-4">
                          <FormControl
                            className="w-full text-left"
                            size="small"
                            variant="outlined"
                          >
                            <InputLabel>选择币种</InputLabel>
                            <Select
                              value={state.assetSymbol}
                              label="选择币种"
                              onChange={action((e) => {
                                state.assetSymbol = e.target.value as string;
                                state.paidAmount = '';
                              })}
                            >
                              {state.coins.map((coin) => (
                                <MenuItem key={coin.id} value={coin.symbol} className="flex items-center leading-none">{coin.symbol}
                                  <span className="ml-1 opacity-40 text-12">- {coin.name}</span>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </div>
                      )}
                      <div className="pt-2 leading-relaxed">
                        {state.isPaidGroup && (
                          <div>
                            <div className="flex items-center">
                              {lang.payableTip}
                              <OutlinedInput
                                className="mx-2 w-30"
                                margin="dense"
                                value={state.paidAmount}
                                onChange={(e) => {
                                  const amount = inputFinanceAmount(e.target.value);
                                  if (amount !== null) {
                                    state.paidAmount = amount;
                                  }
                                }}
                                spellCheck={false}
                                endAdornment={<InputAdornment position="end">{state.assetSymbol || '-'}</InputAdornment>}
                              />
                            </div>
                            {
                              // <div className="mt-3 text-gray-bd text-14">
                              //   {lang.createPaidGroupFeedTip(state.invokeFee ? parseFloat(state.invokeFee) : '-', state.assetSymbol || '-')}
                              // </div>
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-14 animate-fade-in">
              <BottomBar
                total={state.totalStep}
                creating={state.creating}
                step={state.step}
                onChange={(step) => {
                  if (step === 1 && !state.isAuthEnabled) {
                    state.step = step > state.step ? 2 : 0;
                  } else {
                    state.step = step;
                  }
                }}
                handleConfirm={handleConfirm}
                handleClose={handleClose}
              />
            </div>
          </div>
        </div>
      </div>
    </Fade>
  );
});


const getRadioContentComponent = (Icon: any, name: string, label?: string) => () => (
  (
    <div className="leading-none w-[174px] h-32 flex flex-col flex-center">
      <div className="-mt-2 h-[58px] flex flex-center overflow-hidden">
        <div className="transform scale-75">
          <Icon />
        </div>
      </div>
      <div className="mt-2 text-gray-6f font-bold">
        {name}
      </div>
      {label && (
        <div className="mt-2 text-gray-9c text-12">
          {label}
        </div>
      )}
    </div>
  )
);
