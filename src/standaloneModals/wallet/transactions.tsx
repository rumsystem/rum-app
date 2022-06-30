import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';
import { shell } from '@electron/remote';
import MVMApi, { ITransaction } from 'apis/mvm';
import { format } from 'date-fns';
import classNames from 'classnames';

export default ({ data, myAddress }: {
  data: ITransaction[]
  myAddress?: string
}) => (
  <div className={classNames({
    'opacity-50': data.length === 0,
  }, 'wallet-table rounded-t-md bg-white overflow-hidden')}
  >
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>币种</TableCell>
          <TableCell>数量</TableCell>
          <TableCell>类型</TableCell>
          <TableCell>时间</TableCell>
          <TableCell>交易ID</TableCell>
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
                {t.type === 'WITHDRAW' && '提币'}
                {t.type === 'DEPOSIT' && '充币'}
                {t.type === 'TRANSFER' && `${myAddress ? t.to === myAddress ? '收款' : '付款' : '转账'}`}
              </span>
            </TableCell>
            <TableCell>
              <span className="text-gray-88">
                {format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm:ss')}
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
          </TableRow>
        ))}
      </TableBody>
    </Table>
    {data.length === 0 && (
      <div className="py-16 text-center text-14 text-gray-64 border border-gray-bd">
        暂无记录
      </div>
    )}
  </div>
);
