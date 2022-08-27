import React from 'react';
import { observer } from 'mobx-react-lite';
import { lang } from 'utils/lang';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';
import Button from 'components/Button';
import { ICoin, INativeCoin } from 'apis/mvm';
import openDepositModal from './openDepositModal';
import openWithdrawModal from './openWithdrawModal';
import formatAmount from 'utils/formatAmount';

interface IProps {
  coins: Array<ICoin | INativeCoin>
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
            const amount = props.balanceMap[coin.rumSymbol];
            const empty = amount === '0';
            return (
              <TableRow
                key={coin.rumAddress}
                className="border-b border-gray-ec py-2"
              >
                <TableCell className="flex items-center w-70">
                  <div className="w-[30px] h-[30px] mr-2 border rounded-full ml-5">
                    <img
                      className="w-full h-full"
                      src={coin.icon}
                      alt={coin.rumSymbol}
                    />
                  </div>
                  <div className="text-14 text-gray-4a flex items-center leading-none">
                    {coin.rumSymbol}
                    <span className="text-12 opacity-40 ml-[2px]">({coin.name})</span>
                  </div>
                </TableCell>
                <TableCell className="w-100">
                  <span className="text-16 text-gray-4a mr-5">{amount}</span>
                </TableCell>
                <TableCell className="w-100">
                  <span className="text-16 text-gray-4a mr-5">{formatAmount(`${Number(amount) * Number(coin.price_usd)}`)}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Button
                      outline
                      size="small"
                      className="mr-8"
                      onClick={() => {
                        openDepositModal({
                          rumSymbol: coin.rumSymbol,
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
                          rumSymbol: coin.rumSymbol,
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
