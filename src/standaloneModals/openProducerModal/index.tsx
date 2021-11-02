import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { StoreProvider, useStore } from 'store';
import Button from 'components/Button';
import Avatar from 'components/Avatar';
import { ObjectsFilterType } from 'store/activeGroup';
import sleep from 'utils/sleep';
import { lang } from 'utils/lang';
import { unmountComponentAtNode, render } from 'react-dom';
import { ThemeRoot } from 'utils/theme';
import Dialog from 'components/Dialog';
import { Tooltip } from '@material-ui/core';
import AnnounceModal from './AnnounceModal';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Badge from '@material-ui/core/Badge';

export default async () => new Promise<void>((rs) => {
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
          <ProducerModal
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

interface IProps {
  rs: () => unknown
}

interface ITab {
  unreadCount: number
  text: string
}

const TabLabel = (tab: ITab) => (
  <div className="relative">
    <div className="absolute top-0 right-0 -mt-2 -mr-2">
      <Badge
        badgeContent={tab.unreadCount}
        className="transform scale-75 cursor-pointer"
        color="error"
      />
    </div>
    {tab.text}
  </div>
);

const ProducerModal = observer((props: IProps) => {
  const { activeGroupStore } = useStore();
  const state = useLocalObservable(() => ({
    tab: 0,
    loading: false,
    open: true,
    showAnnounceModal: false,
  }));
  const tabs = [
    {
      unreadCount: 0,
      text: '统计',
    },
    {
      unreadCount: 0,
      text: '节点',
    },
    {
      unreadCount: 0,
      text: '申请',
    },
  ] as ITab[];

  const handleClose = () => {
    state.open = false;
    props.rs();
  };

  const goToUserPage = async (publisher: string) => {
    handleClose();
    await sleep(300);
    activeGroupStore.setObjectsFilter({
      type: ObjectsFilterType.SOMEONE,
      publisher,
    });
  };

  return (
    <Dialog
      open={state.open}
      onClose={handleClose}
      hideCloseButton
      transitionDuration={{
        enter: 300,
      }}
    >
      <div className="bg-white rounded-0 relative">
        <div className="w-90">
          <Tabs
            className="px-8 relative bg-white z-10 with-border flex-none mt-2"
            value={state.tab}
            onChange={(_e, newTab) => {
              state.tab = newTab;
            }}
          >
            {tabs.map((_tab, idx: number) => <Tab key={idx} label={TabLabel(_tab)} />)}
          </Tabs>
          <div className="px-8 pb-10">
            <div className="mt-5 h-64 overflow-y-scroll">
              {state.tab === 0 && <Data handleClose={handleClose} goToUserPage={goToUserPage} />}
              {state.tab === 1 && <Producers handleClose={handleClose} goToUserPage={goToUserPage} />}
              <div className="flex justify-center absolute right-5 top-[34px]">
                <Button
                  className="hidden"
                  size="mini"
                  outline
                  onClick={() => {
                    state.showAnnounceModal = true;
                  }}
                >
                  加入
                </Button>
                <Tooltip
                  placement="top"
                  title="申请已提交，等待群主审核，一旦审核通过，你将收到通知提醒"
                  arrow
                >
                  <div>
                    <Button
                      className="hidden"
                      size="mini"
                      color="gray"
                      outline
                      onClick={() => {
                        state.showAnnounceModal = true;
                      }}
                    >
                      等待审核
                    </Button>
                  </div>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
        <AnnounceModal
          open={state.showAnnounceModal}
          onClose={() => {
            state.showAnnounceModal = false;
          }}
        />
      </div>
    </Dialog>
  );
});

interface IDataProps {
  handleClose: any
  goToUserPage: any
}

const Data = observer((props: IDataProps) => {
  const { activeGroupStore } = useStore();

  const user = {
    publisher: 1,
    profile: activeGroupStore.profile,
  };

  return (
    <div>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <div
          className="py-[7px] pl-3 pr-1 flex items-center group"
          key={item}
        >
          <div
            className="py-1 flex items-center"
          >
            <div
              className="cursor-pointer flex items-center"
              onClick={() => {
                props.goToUserPage('user.publisher');
              }}
            >
              <Avatar
                profile={user.profile}
                size={24}
              />
              <div className="max-w-[110px] pl-1">
                <div className="text-gray-88 font-bold text-13 truncate">
                  {user.profile.name}
                </div>
              </div>
            </div>
            <div className="text-gray-88 ml-2 text-13">
              生产了 <span className="font-bold mx-[2px]">56121</span> 个区块
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});

interface IProducerProps {
  handleClose: any
  goToUserPage: any
}

const Producers = observer((props: IProducerProps) => {
  const { confirmDialogStore, activeGroupStore } = useStore();

  const tryRemoveProducer = () => {
    confirmDialogStore.show({
      content: '不再将 Ta 作为出块节点？',
      okText: lang.yes,
      ok: () => {
        confirmDialogStore.hide();
      },
    });
  };

  const user = {
    publisher: 1,
    profile: activeGroupStore.profile,
  };

  return (
    <div>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <div
          className="py-[7px] pl-3 pr-1 flex items-center justify-between group w-full"
          key={item}
        >
          <div
            className="py-1 flex items-center"
          >
            <div
              className="cursor-pointer flex items-center"
              onClick={() => {
                props.goToUserPage('user.publisher');
              }}
            >
              <Avatar
                profile={user.profile}
                size={42}
              />
              <div className="max-w-[110px] pl-1">
                <div className="text-gray-88 font-bold text-14 truncate">
                  {user.profile.name}
                </div>
              </div>
            </div>
            <Button className="ml-4 opacity-80" size="mini" outline onClick={tryRemoveProducer}>移除</Button>
          </div>
        </div>
      ))}
    </div>
  );
});
