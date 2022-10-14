import React from 'react';

import { lang } from 'utils/lang';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';

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

interface Props {
  heads: string[]
  rows: any[]
}

export default (props: Props) => (
  <div className="wallet-table rounded-t-md bg-white overflow-hidden">
    <Table>
      <TableHead>
        <TableRow>
          {
            props.heads.map((head: string) => (
              <TableCell key={head}>
                {head}
              </TableCell>
            ))
          }
        </TableRow>
      </TableHead>
      <TableBody>
        {
          props.rows.map((coin: any) => (
            <TableRow
              key={coin.id}
            >
              <TableCell className="flex items-center">
                <div className="w-[50px] h-[50px] mr-5 border rounded-full">
                  <img
                    className="w-full h-full"
                    src={getCurrencyIcon(coin.token)}
                    alt={coin.token}
                  />
                </div>
                <div className="flex-1 self-stretch pt-4 pb-3 flex flex-col justify-between">
                  <div className="text-16 text-black font-bold flex items-center">
                    {coin.token}
                  </div>
                  <div className="flex items-center text-12 text-gray-9c">
                    <span>{coin.name}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div><span className="text-16 text-black mr-5">{coin.count}</span><span className="text-12 text-gray-6f">{`≈$${coin.btc_price}/${coin.usdt_price}`}</span></div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <div
                    className="h-7 border border-gray-af rounded flex px-4  items-center justify-center cursor-pointer text-14 text-gray-6f mr-10"
                  >
                    {lang.transferIn}
                  </div>
                  <div
                    className="h-7 border border-gray-af rounded flex px-4  items-center justify-center cursor-pointer text-14 text-gray-6f"
                  >
                    {lang.transferOut}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ))
        }
      </TableBody>
    </Table>
    <style jsx global>{`
      .wallet-table .MuiTableRow-head {
        background-color: #333333 !important;
        height: 41px !important;
      }
      .wallet-table .MuiTableRow-head .MuiTableCell-head {
        color: white !important;
        font-size: 14px !important;
      }
      .wallet-table .MuiTableBody-root .MuiTableRow-root {
        background-color: white !important;
      }
    `}</style>
  </div>
);
