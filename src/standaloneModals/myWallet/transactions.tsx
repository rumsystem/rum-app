import React from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';
import { shell } from '@electron/remote';

import IconBOX from 'assets/currency_icons/BOX.png';
import IconBTC from 'assets/currency_icons/BTC.png';
import IconCNB from 'assets/currency_icons/CNB.png';
import IconDOGE from 'assets/currency_icons/DOGE.png';
import IconEOS from 'assets/currency_icons/EOS.png';
import IconETH from 'assets/currency_icons/ETH.png';
import IconMOB from 'assets/currency_icons/MOB.png';
import IconPUSD from 'assets/currency_icons/PUSD.png';
import IconRUM from 'assets/currency_icons/RUM.png';
import IconUSDC from 'assets/currency_icons/USDC.png';
import IconUSDT from 'assets/currency_icons/USDT.png';
import IconXIN from 'assets/currency_icons/XIN.png';

const icons: Record<string, string> = {
  BOX: IconBOX,
  BTC: IconBTC,
  CNB: IconCNB,
  DOGE: IconDOGE,
  EOS: IconEOS,
  ETH: IconETH,
  MOB: IconMOB,
  PUSD: IconPUSD,
  RUM: IconRUM,
  USDC: IconUSDC,
  USDT: IconUSDT,
  XIN: IconXIN,
};

const getCurrencyIcon = (currency: string) => icons[currency];

const fakeId = 'xdfhvlskadflkjhcvl';

export default () => (
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
        {[0, 1, 2].map((i) => (
          <TableRow key={i} className="border-b border-gray-ec">
            <TableCell>
              <div className="flex items-center">
                <div className="w-[26px] h-[26px] mr-2 border rounded-full">
                  <img
                    className="w-full h-full"
                    src={getCurrencyIcon('BTC')}
                    alt="BTC"
                  />
                </div>
                <div className="text-14 text-gray-88 flex items-center">
                  BTC
                </div>
              </div>
            </TableCell>
            <TableCell>
              <span className="text-gray-88">
                0.0023
              </span>
            </TableCell>
            <TableCell>
              <span className="text-gray-88">
                2022-01-10 12:33:20
              </span>
            </TableCell>
            <TableCell>
              <span
                className="text-gray-88 cursor-pointer"
                onClick={() => {
                  shell.openExternal('https://google.com');
                }}
              >
                <div className="text-blue-400 opacity-70">{`${fakeId.slice(
                  0,
                  8,
                )}...${fakeId.slice(-8)}`}</div>
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
