import React from 'react';
import sleep from 'utils/sleep';
import { GroupUpdatedStatus } from 'apis/group';
import PubQueueApi, { IPubQueueTrx } from 'apis/pubQueue';
import { useStore } from 'store';
import { differenceInSeconds } from 'date-fns';
import useDatabase from 'hooks/useDatabase';
import * as ObjectModel from 'hooks/useDatabase/models/object';
import * as PersonModel from 'hooks/useDatabase/models/person';
import * as CommentModel from 'hooks/useDatabase/models/comment';
import * as AttributedToModel from 'hooks/useDatabase/models/attributedTo';
import * as LikeModel from 'hooks/useDatabase/models/like';
import { ContentStatus } from 'hooks/useDatabase/contentStatus';
import { runInAction } from 'mobx';

export default (duration: number) => {
  const { groupStore, nodeStore, activeGroupStore, commentStore } = useStore();

  React.useEffect(() => {
    let stop = false;
    let initAllAt = 0;
    const database = useDatabase();

    (async () => {
      await sleep(4000);
      while (!stop && !nodeStore.quitting) {
        await fetch();
        await sleep(duration);
      }
    })();

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
      await database.transaction(
        'rw',
        [
          database.objects,
          database.persons,
          database.comments,
          database.likes,
          database.attributedTo,
          database.summary,
          database.overwriteMapping,
        ],
        async () => {
          const [
            object,
            person,
            comment,
            like,
            attributedTo,
          ] = await Promise.all([
            ObjectModel.get(database, { TrxId: trxId }),
            PersonModel.get(database, { TrxId: trxId }),
            CommentModel.get(database, { TrxId: trxId }),
            LikeModel.get(database, { TrxId: trxId }),
            AttributedToModel.get(database, { TrxId: trxId }),
          ]);
          if (object) {
            await handleObject(object);
          }
          if (person) {
            await handlePerson(person);
          }
          if (comment) {
            await handleComment(comment);
          }
          if (like) {
            await handleLike(like);
          }
          if (attributedTo) {
            await handleAttributedTo(attributedTo);
          }
        },
      );
    }

    const handleObject = async (object: ObjectModel.IDbDerivedObjectItem) => {
      log({ object });
      await ObjectModel.markedAsSynced(database, object.TrxId);
      if (activeGroupStore.id === object.GroupId) {
        activeGroupStore.markSyncedObject(object.TrxId);
      } else {
        const cachedObject = activeGroupStore.getCachedObject(object.GroupId, object.TrxId);
        if (cachedObject) {
          cachedObject.Status = ContentStatus.synced;
        }
      }
    };

    const handlePerson = async (person: PersonModel.IDbPersonItem) => {
      log({ person });
      await PersonModel.bulkPut(database, [
        {
          ...person,
          Status: ContentStatus.synced,
        },
      ]);
      await groupStore.updateProfile(database, person.GroupId);
      runInAction(() => {
        const profile = PersonModel.getProfile(person.Publisher, person);
        activeGroupStore.setProfile(profile);
        activeGroupStore.updateProfileMap(person.Publisher, profile);
      });
    };

    const handleComment = async (comment: CommentModel.IDbDerivedCommentItem) => {
      log({ comment });
      await CommentModel.markedAsSynced(database, comment.TrxId);
      if (commentStore.trxIdsSet.has(comment.TrxId)) {
        commentStore.markAsSynced(comment.TrxId);
      }
    };

    const handleLike = async (like: LikeModel.IDbLikeItem) => {
      log({ like });
      await LikeModel.bulkPut(database, [{
        ...like,
        Status: ContentStatus.synced,
      }]);
    };

    const handleAttributedTo = async (attributedTo: AttributedToModel.IDbDerivedAttributedToItem) => {
      log({ attributedTo });
      await AttributedToModel.markAsSynced(database, attributedTo.TrxId);
    };

    return () => {
      stop = true;
    };
  }, [groupStore, duration]);
};

function log(a: any) {
  console.log('[pubQueue]:', a);
}
