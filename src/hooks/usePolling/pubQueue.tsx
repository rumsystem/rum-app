import { runInAction } from 'mobx';
import { differenceInSeconds } from 'date-fns';
import sleep from 'utils/sleep';
import { GroupUpdatedStatus } from 'apis/group';
import PubQueueApi, { IPubQueueTrx } from 'apis/pubQueue';
import { store } from 'store';
import useDatabase from 'hooks/useDatabase';
import * as PostModel from 'hooks/useDatabase/models/posts';
import * as ProfileModel from 'hooks/useDatabase/models/profile';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as ImageModel from 'hooks/useDatabase/models/image';
import * as CounterModel from 'hooks/useDatabase/models/counter';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';

export const getPubQueue = () => {
  let initAllAt = 0;

  return async () => {
    const { groupStore, nodeStore, activeGroupStore, commentStore } = store;

    const database = useDatabase();

    if (!nodeStore.quitting) {
      await fetch();
      await sleep(4000);
    }

    async function fetch() {
      const { groups } = groupStore;
      await Promise.all(
        groups
          .filter((group) => {
            if (activeGroupStore.id === group.group_id) {
              return true;
            }
            if (!initAllAt) {
              initAllAt = Date.now();
              return true;
            }
            return group.updatedStatus === GroupUpdatedStatus.ACTIVE || differenceInSeconds(Date.now(), initAllAt) % 50 === 0;
          })
          .map((group) => fetchPubQueue(group.group_id)),
      );
    }

    async function fetchPubQueue(groupId: string) {
      try {
        const res = await PubQueueApi.fetchPubQueue(groupId);
        const successJobs = res.Data.filter((job) => job.State === 'SUCCESS');
        await handleSuccessJobs(successJobs);
        const failJobs = res.Data.filter((job) => job.State === 'FAIL');
        await handleFailJobs(failJobs);
      } catch (err) {
        console.error(err);
      }
    }

    async function handleSuccessJobs(jobs: IPubQueueTrx[]) {
      const processedJobTrxIds = [];
      for (const job of jobs) {
        try {
          await handleSuccessJob(job);
          processedJobTrxIds.push(job.Trx.TrxId);
        } catch (err) {
          console.log(err);
        }
      }
      if (processedJobTrxIds.length > 0) {
        await PubQueueApi.acknowledge(processedJobTrxIds);
      }
    }

    async function handleSuccessJob(job: IPubQueueTrx) {
      const trxId = job.Trx.TrxId;
      const groupId = job.GroupId;
      await database.transaction(
        'rw',
        [
          database.posts,
          database.profiles,
          database.comments,
          database.counters,
          database.images,
          database.summary,
        ],
        async () => {
          const [
            object,
            profile,
            comment,
            counter,
            image,
          ] = await Promise.all([
            PostModel.get(database, { groupId, trxId }),
            ProfileModel.get(database, { groupId, trxId }),
            CommentModel.get(database, { groupId, trxId }),
            CounterModel.get(database, { groupId, trxId }),
            ImageModel.get(database, { groupId, trxId }),
          ]);
          if (object) {
            await handlePost(object);
          }
          if (profile) {
            await handleProfile(profile);
          }
          if (comment) {
            await handleComment(comment);
          }
          if (counter) {
            await handleCounter(counter);
          }
          if (image) {
            await handleImage(image);
          }
        },
      );
    }

    async function handlePost(object: PostModel.IDBPost) {
      const group = groupStore.map[object.groupId];
      const myPublicKey = (group || {}).user_pubkey;
      if (object.publisher !== myPublicKey) {
        return;
      }
      log({ object });
      await PostModel.markedAsSynced(database, { id: object.id, groupId: object.groupId });
      if (activeGroupStore.id === object.groupId && activeGroupStore.postMap[object.id]) {
        activeGroupStore.markAsSynced(object.id);
      } else {
        const cachedObject = activeGroupStore.getCachedObject(object.groupId, object.id);
        if (cachedObject) {
          cachedObject.status = ContentStatus.synced;
        }
      }
    }

    async function handleProfile(profile: ProfileModel.IDBProfile) {
      const group = groupStore.map[profile.groupId];
      const myPublicKey = (group || {}).user_pubkey;
      if (profile.publisher !== myPublicKey) {
        return;
      }
      log({ person: profile });
      profile.status = ContentStatus.synced;
      await ProfileModel.put(database, profile);
      await groupStore.updateProfile(database, profile.groupId);
      const newProfile = await ProfileModel.get(database, {
        publisher: profile.publisher,
        groupId: profile.groupId,
      });
      runInAction(() => {
        if (newProfile) {
          activeGroupStore.setProfile(newProfile);
          activeGroupStore.updateProfileMap(newProfile.publisher, newProfile);
        }
      });
    }

    async function handleComment(comment: CommentModel.IDBComment) {
      const group = groupStore.map[comment.groupId];
      const myPublicKey = (group || {}).user_pubkey;
      if (comment.publisher !== myPublicKey) {
        return;
      }
      log({ comment });
      await CommentModel.markedAsSynced(database, { groupId: comment.groupId, id: comment.id });
      if (commentStore.idsSet.has(comment.id)) {
        commentStore.markAsSynced(comment.id);
      }
    }

    async function handleCounter(like: CounterModel.IDBCounter) {
      const group = groupStore.map[like.groupId];
      const myPublicKey = (group || {}).user_pubkey;
      if (like.publisher !== myPublicKey) {
        return;
      }
      log({ like });
      like.status = ContentStatus.synced;
      await CounterModel.put(database, like);
    }

    async function handleImage(image: ImageModel.IDBImage) {
      const group = groupStore.map[image.groupId];
      const myPublicKey = (group || {}).user_pubkey;
      if (image.publisher !== myPublicKey) {
        return;
      }
      log({ image });
      await ImageModel.markAsSynced(database, [{ groupId: image.groupId, trxId: image.trxId }]);
    }

    async function handleFailJobs(jobs: IPubQueueTrx[]) {
      const exceedMaxRetryCountTrxIds = jobs.filter((job) => job.RetryCount > 10).map((job) => job.Trx.TrxId);
      if (exceedMaxRetryCountTrxIds.length > 0) {
        await PubQueueApi.acknowledge(exceedMaxRetryCountTrxIds);
      }
    }
  };
};

function log(a: unknown) {
  console.log('[pubQueue]:', a);
}
