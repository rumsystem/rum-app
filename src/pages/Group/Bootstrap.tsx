import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Loading from 'components/Loading';
import { sleep } from 'utils';
import Sidebar from './Sidebar';
import Header from './Header';
import { useStore } from 'store';
import GroupApi from 'apis/group';
import UsePolling from './hooks/usePolling';
import useAnchorClick from './hooks/useAnchorClick';
import UseAppBadgeCount from './hooks/useAppBadgeCount';
import Welcome from './Welcome';
import Help from './Help';
import Main from './Main';
import { intersection } from 'lodash';
import { migrateSeed } from 'migrations/seed';
import electronStoreName from 'utils/storages/electronStoreName';
import Dexie from 'dexie';
import { IObjectItem, ContentTypeUrl } from 'apis/group';

export default observer(() => {
  const { activeGroupStore, groupStore, nodeStore, authStore, profileStore } =
    useStore();
  const state = useLocalObservable(() => ({
    isFetched: false,
    loading: false,
    isQuitting: false,
    showGroupEditorModal: false,
    showJoinGroupModal: false,
  }));

  UsePolling();
  useAnchorClick();
  UseAppBadgeCount();

  React.useEffect(() => {
    if (!activeGroupStore.id) {
      return;
    }

    profileStore.initElectronStore(
      electronStoreName.get({
        peerId: nodeStore.info.node_id,
        groupId: activeGroupStore.id,
        resource: 'profiles',
      })
    );

    (async () => {
      state.loading = true;
      try {
        syncGroup(activeGroupStore.id);

        const resContents = await GroupApi.fetchContents(activeGroupStore.id);

        if (groupStore.unReadCountMap[activeGroupStore.id] > 0) {
          const timeStamp =
            groupStore.latestContentTimeStampMap[activeGroupStore.id];
          activeGroupStore.addLatestContentTimeStamp(timeStamp);
        }

        const contents = [
          ...(resContents || []),
          ...activeGroupStore.pendingContents,
        ].sort((a, b) => b.TimeStamp - a.TimeStamp);

        activeGroupStore.addContents(contents);

        if (contents.length > 0) {
          const latestContent = contents[0];
          const earliestContent = contents[activeGroupStore.contentTotal - 1];
          groupStore.setLatestContentTimeStamp(
            activeGroupStore.id,
            latestContent.TimeStamp
          );
          activeGroupStore.setRearContentTimeStamp(earliestContent.TimeStamp);
        }

        groupStore.updateUnReadCountMap(activeGroupStore.id, 0);

        tryRemovePendingContents();
      } catch (err) {
        console.error(err);
      }
      state.loading = false;

      try {
        const res = await GroupApi.fetchBlacklist();
        authStore.setBlackList(res.blocked || []);
      } catch (err) {
        console.error(err);
      }
    })();

    async function syncGroup(groupId: string) {
      try {
        await GroupApi.syncGroup(groupId);
      } catch (err) {
        console.log(err);
      }
    }

    function tryRemovePendingContents() {
      activeGroupStore.deletePendingContents(
        intersection(
          activeGroupStore.contentTrxIds,
          activeGroupStore.pendingContentTxIds
        )
      );
    }
  }, [activeGroupStore.id]);

  React.useEffect(() => {
    (async () => {
      try {
        const [info, { groups }, network] = await Promise.all([
          GroupApi.fetchMyNodeInfo(),
          GroupApi.fetchMyGroups(),
          GroupApi.fetchNetwork(),
        ]);

        groupStore.initElectronStore(`peer_${info.node_id}_group`);
        activeGroupStore.initElectronStore(`peer_${info.node_id}_group`);

        nodeStore.setInfo(info);
        nodeStore.setNetwork(network);
        if (groups && groups.length > 0) {
          groupStore.addGroups(groups);
          const firstGroup = groupStore.groups[0];
          activeGroupStore.setId(firstGroup.GroupId);
          migrateSeed(groups);
        }
        await sleep(500);
        state.isFetched = true;
      } catch (err) {
        console.error(err);
      }
    })();
  }, [state]);

  (window as any).testDexie = async () => {
    class RumDatabase extends Dexie {
      contents: Dexie.Table<IObjectItem, number>;

      constructor() {
        super('RumDatabase');
        this.version(1).stores({
          contents: 'TrxId, Publisher, TimeStamp',
        });
        this.contents = this.table('contents');
      }
    }

    const db = new RumDatabase();
    db.version(2)
      .stores({
        contents: '&TrxId, Publisher, TimeStamp',
      })
      .upgrade(() => {});
    // const content1 = {
    //   TrxId: '0b7af16d-d1ac-4170-8937-212fb9412075',
    //   Publisher: 'CAISIQJZm2LZhl9cB/QJksoiyT1BkJVjYsJFITXPz8sT0xgNag==',
    //   Content: {
    //     type: 'Note',
    //     content: '这意味着群组可以设置private喽 _ 重复1',
    //   },
    //   TimeStamp: 1626686977302766000,
    //   TypeUrl: 'quorum.pb.Object' as ContentTypeUrl.Object,
    // };

    // await db.contents.add(content1);

    // const DB_content1 = await db.contents.get({
    //   TrxId: content1.TrxId,
    // });

    // console.log(DB_content1);

    // const content2 = {
    //   TrxId: '0b7af16d-d1ac-4170-8937-212fb9412072',
    //   Publisher: 'CAISIQJZm2LZhl9cB/QJksoiyT1BkJVjYsJFITXPz8sT0xgNag==',
    //   Content: { type: 'Note', content: '这意味着群组可以设置private喽2' },
    //   TimeStamp: 1626687977302766000,
    //   TypeUrl: 'quorum.pb.Object' as ContentTypeUrl.Object,
    // };

    // await db.contents.add(content2);

    // const DB_content2 = await db.contents.get({
    //   TrxId: content2.TrxId,
    // });

    // console.log(DB_content2);

    // const DB_content2 = await db.contents.get({
    //   TrxId: content2.TrxId,
    //   Publisher: content2.Publisher,
    //   TimeStamp: content2.TimeStamp,
    // });
    // console.log({ DB_content2 });

    // const content3 = {
    //   TrxId: '0b7af16d-d1ac-4170-8937-212fb9412073',
    //   Publisher: 'CAISIQJZm2LZhl9cB/QJksoiyT1BkJVjYsJFITXPz8sT0xgNag==',
    //   Content: { type: 'Note', content: '这意味着群组可以设置private喽3' },
    //   TimeStamp: 1626688977302766000,
    //   TypeUrl: 'quorum.pb.Object' as ContentTypeUrl.Object,
    // };
    // const content4 = {
    //   TrxId: '0b7af16d-d1ac-4170-8937-212fb9412074',
    //   Publisher: 'CAISIQJZm2LZhl9cB/QJksoiyT1BkJVjYsJFITXPz8sT0xgNag==',
    //   Content: { type: 'Note', content: '这意味着群组可以设置private喽4' },
    //   TimeStamp: 1626689977302766000,
    //   TypeUrl: 'quorum.pb.Object' as ContentTypeUrl.Object,
    // };

    // await db.contents.bulkAdd([content3, content4]);

    // const content_other = {
    //   TrxId: '0b7af16d-d1ac-4170-8937-212fb9412079',
    //   Publisher: 'CAISIQJZm2LZhl9cB/QJksoiyT1BkJVjYsJFITXPz8sT0xgNaa==',
    //   Content: { type: 'Note', content: '这意味着群组可以设置private喽 other' },
    //   TimeStamp: 1626699977302766000,
    //   TypeUrl: 'quorum.pb.Object' as ContentTypeUrl.Object,
    // };
    // await db.contents.add(content_other);

    const contents = await db.contents.toArray();
    console.log({ contents });

    const count = await db.contents.count();
    console.log({ count });

    const user1_contents = await db.contents
      .where({
        Publisher: 'CAISIQJZm2LZhl9cB/QJksoiyT1BkJVjYsJFITXPz8sT0xgNag==',
      })
      .toArray();
    console.log({ user1_contents });

    const user2_contents = await db.contents
      .where({
        Publisher: 'CAISIQJZm2LZhl9cB/QJksoiyT1BkJVjYsJFITXPz8sT0xgNaa==',
      })
      .toArray();
    console.log({ user2_contents });
  };

  if (!state.isFetched) {
    return (
      <div className="flex bg-white h-screen items-center justify-center">
        <div className="-mt-32 -ml-6">
          <Loading />
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
            {!state.loading && <Main />}
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
