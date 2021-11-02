import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import { Link } from 'react-router-dom';
import Button from 'components/Button';
import { ipcRenderer } from 'electron';
import Loading from 'components/Loading';
import { sleep } from 'utils';

export default observer(() => {
  const state = useLocalStore(() => ({
    isFetched: false,
    producers: [],
  }));

  React.useEffect(() => {
    ipcRenderer.send('get-producers', '');
    ipcRenderer.on('get-producers-resp', async (_event, arg) => {
      state.producers = arg.rows;
      await sleep(1000);
      state.isFetched = true;
    });
  }, []);

  return (
    <div className="p-8">
      <Link to="/">
        <Button>返回</Button>
      </Link>
      <div className="mt-5">
        <div className="text-18 font-bold text-gray-88">Producer 列表</div>
        {!state.isFetched && (
          <div className="py-5">
            <Loading />
          </div>
        )}
        {state.isFetched && (
          <div className="mt-2">
            {state.producers.map((producer: any) => {
              return (
                <div
                  className="py-2 border-b border-blue-400"
                  key={producer.last_claim_time}
                >
                  <div className="p1-2">owner: {producer.owner}</div>
                  <div className="p1-2">
                    total_votes: {producer.total_votes}
                  </div>
                  <div className="p1-2">
                    producer_key: {producer.producer_key}
                  </div>
                  <div className="p1-2">
                    unpaid_blocks: {producer.unpaid_blocks}
                  </div>
                  <div className="p1-2">
                    last_claim_time: {producer.last_claim_time}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
