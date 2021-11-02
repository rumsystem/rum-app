import React from 'react';
import { observer, useLocalStore } from 'mobx-react-lite';
import Page from 'components/Page';
import {
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@material-ui/core';
import { sleep, PrsAtm } from 'utils';
import moment from 'moment';
import { sum } from 'lodash';
import { IProducer } from 'types';

const Head = () => {
  return (
    <TableHead>
      <TableRow>
        <TableCell>排名</TableCell>
        <TableCell>名称</TableCell>
        <TableCell>票数</TableCell>
        <TableCell>票数占比</TableCell>
        <TableCell>待领取区块数</TableCell>
        <TableCell>状态</TableCell>
        <TableCell>最近一次领取</TableCell>
      </TableRow>
    </TableHead>
  );
};

export default observer(() => {
  const state = useLocalStore(() => ({
    isFetched: false,
    producers: [] as IProducer[],
    get totalVotes() {
      return sum(this.producers.map((p) => p.total_votes));
    },
  }));

  React.useEffect(() => {
    (async () => {
      const resp: any = await PrsAtm.fetch({
        id: 'getProducers',
        actions: ['producer', 'getAll'],
      });
      const derivedProducers: any = resp.rows.map((row: any) => {
        row.total_votes = parseInt(row.total_votes, 10);
        return row;
      });
      state.producers = derivedProducers;
      await sleep(1000);
      state.isFetched = true;
    })();
  }, []);

  return (
    <Page title="节点投票" loading={!state.isFetched}>
      <div>
        <Paper>
          <Table>
            <Head />
            <TableBody>
              {state.producers.map((producer, index) => {
                return (
                  <TableRow key={producer.last_claim_time}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <span className="font-bold text-gray-4a">
                        {producer.owner}
                      </span>
                    </TableCell>
                    <TableCell>{producer.total_votes || '-'}</TableCell>
                    <TableCell>
                      {Math.floor(
                        (producer.total_votes / state.totalVotes) * 1000000
                      ) / 10000}
                      %
                    </TableCell>
                    <TableCell>{producer.unpaid_blocks || '-'}</TableCell>
                    <TableCell>
                      {producer.is_active ? (
                        '正常'
                      ) : (
                        <span className="text-red-400">停止</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {moment(producer.last_claim_time).format(
                        'yyyy-MM-DD HH:mm'
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      </div>
    </Page>
  );
});
