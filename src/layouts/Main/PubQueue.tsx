import React from 'react';
import { GoCloudUpload } from 'react-icons/go';
import { observer, useLocalObservable } from 'mobx-react-lite';
import Dialog from 'components/Dialog';
import PubQueueApi, { IPubQueueTrx } from 'apis/pubQueue';
import { useStore } from 'store';
import { lang } from 'utils/lang';
import ago from 'utils/ago';

export default observer(() => {
  const state = useLocalObservable(() => ({
    open: false,
  }));

  return (
    <div className="cursor-pointer">
      <div
        className="rounded-full flex items-center justify-center leading-none w-8 h-8 border border-gray-af text-gray-af"
        onClick={() => {
          state.open = true;
        }}
      >
        <div className="text-20">
          <GoCloudUpload />
        </div>
      </div>
      <Dialog
        open={state.open}
        onClose={() => {
          state.open = false;
        }}
        transitionDuration={{
          enter: 300,
        }}
      >
        <JobList />
      </Dialog>
    </div>
  );
});

const JobList = observer(() => {
  const state = useLocalObservable(() => ({
    jobs: [] as IPubQueueTrx[],
  }));
  const { activeGroupStore } = useStore();

  React.useEffect(() => {
    const timer = setInterval(fetchData, 2000);
    fetchData();

    return () => {
      clearInterval(timer);
    };
  }, []);

  const fetchData = React.useCallback(async () => {
    const ret = await PubQueueApi.fetchPubQueue(activeGroupStore.id);
    state.jobs = ret.Data.filter((job) => job.State !== 'SUCCESS');
  }, []);

  return (
    <div className="bg-white rounded-0 py-8 px-5">
      <div className="w-80">
        <div className="text-18 font-bold text-gray-700 text-center">
          {lang.pendingData}
        </div>
        <div className="mt-5 px-5 h-100 overflow-auto">
          {state.jobs.length === 0 && (
            <div className="py-16 text-center text-14 text-gray-400 opacity-80">
              {lang.isEmpty}
            </div>
          )}
          {state.jobs.map((job) => (
            <div key={job.Trx.TrxId} className="py-2 px-3 text-gray-88 text-12 border border-gray-bf rounded mt-2 leading-relaxed">
              <div>
                {job.Trx.TrxId}
              </div>
              <div className="flex items-center">
                <div className="mr-2">
                  {job.State === 'PENDING' && (
                    <span>
                      {lang.pending}
                    </span>
                  )}
                  {job.State === 'FAIL' && (
                    <span className="text-red-400">
                      {lang.fail}
                    </span>
                  )}
                </div>
                {job.RetryCount > 0 && (
                  <div>
                    {lang.retryTimes(job.RetryCount)}
                  </div>
                )}
              </div>
              <div>
                {lang.updatedAt(ago(job.UpdateAt))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
