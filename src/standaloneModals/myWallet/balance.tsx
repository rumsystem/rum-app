import React from 'react';
import { observer } from 'mobx-react-lite';
import { lang } from 'utils/lang';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';
import Button from 'components/Button';
import { ICoin } from 'apis/mvm';
import openDepositModal from './openDepositModal';
import openWithdrawModal from './openWithdrawModal';
import decimal from 'utils/decimal';

interface IProps {
  coins: ICoin[]
  balanceMap: Record<string, string>
}

export default observer((props: IProps) => (
  <div className="wallet-table rounded-t-md bg-white overflow-hidden">
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>币种</TableCell>
          <TableCell>数量</TableCell>
          <TableCell>价值(USD)</TableCell>
          <TableCell>操作</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {
          props.coins.map((coin) => {
            const amount = props.balanceMap[coin.symbol];
            const empty = amount === '0';
            return (
              <TableRow
                key={coin.id}
                className="border-b border-gray-ec py-2"
              >
                <TableCell className="flex items-center w-60">
                  <div className="w-[30px] h-[30px] mr-2 border rounded-full ml-5">
                    <img
                      className="w-full h-full"
                      src={coin.icon}
                      alt={coin.symbol}
                    />
                  </div>
                  <div className="text-14 text-gray-4a flex items-center leading-none">
                    {coin.symbol}
                    <span className="text-12 opacity-40 ml-[2px]">({coin.name})</span>
                  </div>
                </TableCell>
                <TableCell className="w-100">
                  <span className="text-16 text-gray-4a mr-5">{amount}</span>
                </TableCell>
                <TableCell className="w-100">
                  <span className="text-16 text-gray-4a mr-5">{decimal(`${Number(amount) * Number(coin.price_usd)}`, 2)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Button
                      outline
                      size="small"
                      className="mr-8"
                      onClick={() => {
                        openDepositModal({
                          asset: coin.symbol,
                        });
                      }}
                    >
                      {lang.transferIn}
                    </Button>
                    <Button
                      disabled={empty}
                      outline
                      size="small"
                      onClick={() => {
                        openWithdrawModal({
                          asset: coin.symbol,
                        });
                      }}
                    >
                      {lang.transferOut}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        }
      </TableBody>
    </Table>
  </div>
));
