import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';
import { shell } from '@electron/remote';
import MVMApi, { ITransaction } from 'apis/mvm';
import { format } from 'date-fns';

export default ({ data }: {
  data: ITransaction[]
}) => (
  <div className="wallet-table rounded-t-md bg-white overflow-hidden">
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>币种</TableCell>
          <TableCell>数量</TableCell>
          <TableCell>时间</TableCell>
          <TableCell>交易ID</TableCell>
          <TableCell>状态</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((t) => (
          <TableRow key={t.uuid} className="border-b border-gray-ec">
            <TableCell>
              <div className="flex items-center">
                <div className="w-[26px] h-[26px] mr-2 border rounded-full">
                  <img
                    className="w-full h-full"
                    src={t.asset.icon}
                    alt={t.asset.symbol}
                  />
                </div>
                <div className="text-14 text-gray-88 flex items-center">
                  {t.asset.symbol}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-gray-88">
                {t.amount}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-gray-88">
                {format(parseInt(t.timestamp, 10), 'yyyy-MM-dd HH:mm:ss')}
              </span>
            </TableCell>
            <TableCell>
              <span
                className="text-gray-88 cursor-pointer"
                onClick={() => {
                  shell.openExternal(MVMApi.transactionUrl(t.transactionHash));
                }}
              >
                <div className="text-blue-400 opacity-70">{`${t.transactionHash.slice(
                  0,
                  8,
                )}...${t.transactionHash.slice(-8)}`}</div>
              </span>
            </TableCell>
            <TableCell>
              <span className="text-emerald-500">
                已完成
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);
