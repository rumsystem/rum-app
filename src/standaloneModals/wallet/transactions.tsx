import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import { shell } from 'electron';
import MVMApi, { ITransaction } from 'apis/mvm';
import { format } from 'date-fns';
import classNames from 'classnames';
import * as ethers from 'ethers';
import formatAmount from 'utils/formatAmount';

export default ({ data, myAddress, showGas }: {
  data: ITransaction[]
  myAddress: string
  showGas?: boolean
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
          <>
            <TableRow key={t.uuid} className="border-b border-gray-ec">
              <TableCell>
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-[26px] h-[26px] mr-2 border rounded-full">
                    <img
                      className="w-full h-full"
                      src={t.asset.icon}
                      alt={t.asset.rumSymbol}
                    />
                  </div>
                  <div className="text-14 text-gray-88 flex items-center">
                    {t.asset.rumSymbol}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-gray-88 whitespace-nowrap">
                  {myAddress && t.from.toLowerCase() === myAddress.toLowerCase() ? '- ' : '+ '}
                  {t.value}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-gray-88 whitespace-nowrap">
                  {t.type === 'ADDPRICE' && '创建付费群组'}
                  {t.type === 'WITHDRAW' && '提币'}
                  {t.type === 'DEPOSIT' && '充币'}
                  {t.type === 'EXCHANGE' && '兑换'}
                  {t.type === 'TRANSFER' && `${myAddress ? t.from.toLowerCase() === myAddress.toLowerCase() ? '付款' : '收款' : '转账'}`}
                  {t.type === 'PAY' && `${myAddress ? t.from.toLowerCase() === myAddress.toLowerCase() ? '付费群付款' : '付费群收款' : '付费群转账'}`}
                  {t.type !== 'ADDPRICE' && t.type !== 'WITHDRAW' && t.type !== 'DEPOSIT' && t.type !== 'EXCHANGE' && t.type !== 'TRANSFER' && t.type !== 'PAY' && '其它' }
                </span>
              </TableCell>
              <TableCell>
                <span className="text-gray-88 whitespace-nowrap">
                  {format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                </span>
              </TableCell>
              <TableCell>
                <span
                  className="text-gray-88 cursor-pointer"
                  onClick={() => {
                    shell.openExternal(MVMApi.transactionUrl(t.hash));
                  }}
                >
                  <div className="text-blue-400 opacity-70">{`${t.hash.slice(
                    0,
                    8,
                  )}...${t.hash.slice(-8)}`}</div>
                </span>
              </TableCell>
            </TableRow>
            {showGas && myAddress && t.from.toLowerCase() === myAddress.toLowerCase() && (
              <TableRow key={t.uuid} className="border-b border-gray-ec">
                <TableCell>
                  <div className="flex items-center whitespace-nowrap">
                    <div className="w-[26px] h-[26px] mr-2 border rounded-full">
                      <img
                        className="w-full h-full"
                        src="https://mixin-images.zeromesh.net/ypHHp9tN4C9K2OlYFLRRBmWn2wYL5olLtntyupiCdsnagR9ML7p-GyT9gmNRD6ETLbBT6i-ROjN9wEj7ItibyboWAhPi9BnKNc8=s128"
                        alt="RUM"
                      />
                    </div>
                    <div className="text-14 text-gray-88 flex items-center">
                      RUM
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-gray-88 whitespace-nowrap">
                    {'- '}
                    {formatAmount(ethers.utils.formatEther(ethers.BigNumber.from(t.gasUsed).mul(ethers.BigNumber.from(t.gasPrice))))}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-88 whitespace-nowrap">
                    {t.type === 'ADDPRICE' && '创建付费群组手续费'}
                    {t.type === 'WITHDRAW' && '提币手续费'}
                    {t.type === 'DEPOSIT' && '充币手续费'}
                    {t.type === 'EXCHANGE' && '兑换手续费'}
                    {t.type === 'TRANSFER' && `${myAddress ? t.from.toLowerCase() === myAddress.toLowerCase() ? '付款手续费' : '收款手续费' : '转账手续费'}`}
                    {t.type === 'PAY' && `${myAddress ? t.from.toLowerCase() === myAddress.toLowerCase() ? '付费群付款手续费' : '付费群收款手续费' : '付费群转账手续费'}`}
                    {t.type !== 'ADDPRICE' && t.type !== 'WITHDRAW' && t.type !== 'DEPOSIT' && t.type !== 'EXCHANGE' && t.type !== 'TRANSFER' && t.type !== 'PAY' && '其它操作手续费' }
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-88 whitespace-nowrap">
                    {format(new Date(t.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className="text-gray-88 cursor-pointer"
                    onClick={() => {
                      shell.openExternal(MVMApi.transactionUrl(t.hash));
                    }}
                  >
                    <div className="text-blue-400 opacity-70">{`${t.hash.slice(
                      0,
                      8,
                    )}...${t.hash.slice(-8)}`}</div>
                  </span>
                </TableCell>
              </TableRow>
            )}
          </>
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
