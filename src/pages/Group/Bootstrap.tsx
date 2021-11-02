import React from 'react';
import { observer } from 'mobx-react-lite';
import Sidebar from './Sidebar';
import Header from './Header';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import UsePolling from 'hooks/usePolling';
import useAnchorClick from 'hooks/useAnchorClick';
import UseAppBadgeCount from 'hooks/useAppBadgeCount';
import useMenuEventSetup from 'hooks/useMenuEventSetup';
import useExportToWindow from 'hooks/useExportToWindow';
import Welcome from './Welcome';
import Help from './Help';
import Main from './Main';
import useQueryObjects from 'hooks/useQueryObjects';
import { FilterType } from 'store/activeGroup';
import { DEFAULT_LATEST_STATUS } from 'store/group';
import { runInAction } from 'mobx';
import useSubmitPerson from 'hooks/useSubmitPerson';
import useDatabase from 'hooks/useDatabase';
import useOffChainDatabase from 'hooks/useOffChainDatabase';
import { ipcRenderer, remote } from 'electron';
import * as offChainDatabaseExportImport from 'hooks/useOffChainDatabase/exportImport';
import { sleep } from 'utils';
import * as Quorum from 'utils/quorum';
import Loading from 'components/Loading';

const OBJECTS_LIMIT = 20;

export default observer(() => {
  const {
    activeGroupStore,
    groupStore,
    nodeStore,
    authStore,
    confirmDialogStore,
  } = useStore();
  const database = useDatabase();
  const offChainDatabase = useOffChainDatabase();
  const queryObjects = useQueryObjects();
  const submitPerson = useSubmitPerson();

  UsePolling();
  useAnchorClick();
  UseAppBadgeCount();
  useMenuEventSetup();
  useExportToWindow();

  React.useEffect(() => {
    if (!activeGroupStore.id) {
      return;
    }

    (async () => {
      activeGroupStore.setSwitchLoading(true);

      await fetchObjects();

      await fetchPerson();

      await activeGroupStore.fetchFollowings({
        offChainDatabase,
        groupId: activeGroupStore.id,
        publisher: nodeStore.info.node_publickey,
      });

      activeGroupStore.setSwitchLoading(false);

      fetchBlacklist();

      tryInitProfile();

      setupQuitHook();
    })();

    async function fetchBlacklist() {
      try {
        const res = await GroupApi.fetchBlacklist();
        authStore.setBlackList(res.blocked || []);
      } catch (err) {
        console.error(err);
      }
    }

    async function tryInitProfile() {
      try {
        if (!activeGroupStore.person && groupStore.profileAppliedToAllGroups) {
          const person = await submitPerson({
            groupId: activeGroupStore.id,
            publisher: nodeStore.info.node_publickey,
            profile: groupStore.profileAppliedToAllGroups,
          });
          activeGroupStore.setPerson(person);
        }
      } catch (err) {
        console.error(err);
      }
    }
  }, [activeGroupStore.id]);

  React.useEffect(() => {
    (async () => {
      if (activeGroupStore.switchLoading || !activeGroupStore.id) {
        return;
      }
      activeGroupStore.setMainLoading(true);
      await fetchObjects();
      activeGroupStore.setMainLoading(false);
    })();
  }, [activeGroupStore.filterType]);

  async function fetchObjects() {
    try {
      const groupId = activeGroupStore.id;
      const objects = await queryObjects({
        GroupId: groupId,
        limit: OBJECTS_LIMIT,
      });
      runInAction(() => {
        for (const object of objects) {
          activeGroupStore.addObject(object);
        }
        if (objects.length === OBJECTS_LIMIT) {
          activeGroupStore.setHasMoreObjects(true);
        }
        if (activeGroupStore.filterType === FilterType.ALL) {
          const latestStatus =
            groupStore.latestStatusMap[groupId] || DEFAULT_LATEST_STATUS;
          if (latestStatus.unreadCount > 0) {
            activeGroupStore.addLatestObjectTimeStamp(
              latestStatus.latestReadTimeStamp
            );
          }
          if (objects.length > 0) {
            const latestObject = objects[0];
            groupStore.updateLatestStatusMap(groupId, {
              latestReadTimeStamp: latestObject.TimeStamp,
            });
          }
          groupStore.updateLatestStatusMap(groupId, {
            unreadCount: 0,
          });
        }
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchPerson() {
    try {
      const person = await database.persons
        .where({
          GroupId: activeGroupStore.id,
          Publisher: nodeStore.info.node_publickey,
        })
        .last();
      if (person) {
        activeGroupStore.setPerson(person);
      }
    } catch (err) {
      console.log(err);
    }
  }

  function setupQuitHook() {
    ipcRenderer.send('renderer-quit-prompt');
    ipcRenderer.on('main-before-quit', async () => {
      if (
        confirmDialogStore.open &&
        confirmDialogStore.loading &&
        confirmDialogStore.okText === '重启'
      ) {
        confirmDialogStore.hide();
      } else {
        const ownerGroupCount = groupStore.groups.filter(
          (group) => group.OwnerPubKey === nodeStore.info.node_publickey
        ).length;
        const res = await remote.dialog.showMessageBox({
          type: 'question',
          buttons: ['确定', '取消'],
          title: '退出节点',
          message: ownerGroupCount
            ? `你创建的 ${ownerGroupCount} 个群组需要你保持在线，维持出块。如果你的节点下线了，这些群组将不能发布新的内容，确定退出吗？`
            : '你的节点即将下线，确定退出吗？',
        });
        if (res.response === 1) {
          return;
        }
      }
      ipcRenderer.send('renderer-will-quit');
      await sleep(500);
      await offChainDatabaseExportImport.exportTo(
        offChainDatabase,
        nodeStore.storagePath
      );
      if (nodeStore.status.up) {
        nodeStore.setQuitting(true);
        if (nodeStore.status.up) {
          await Quorum.down();
        }
      }
      ipcRenderer.send('renderer-quit');
    });
  }

  if (nodeStore.quitting) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <div className="-mt-32 -ml-6">
          <Loading />
          <div className="mt-6 text-15 text-gray-9b tracking-widest">
            节点正在退出
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex bg-white">
      <div className="w-[250px] border-r border-gray-200 h-screen select-none">
        <Sidebar />
      </div>
      <div className="flex-1 bg-gray-f7">
        {activeGroupStore.isActive && (
          <div className="h-screen">
            <Header />
            {!activeGroupStore.switchLoading && <Main />}
          </div>
        )}
        {!activeGroupStore.isActive && (
          <div className="h-screen flex items-center justify-center tracking-widest text-18 text-gray-9b">
            {groupStore.groups.length === 0 && <Welcome />}
          </div>
        )}
      </div>
      <Help />
    </div>
  );
});
