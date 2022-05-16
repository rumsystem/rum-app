import React from 'react';
import { observer, useLocalObservable } from 'mobx-react-lite';
import { lang } from 'utils/lang';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@material-ui/core';
import Button from 'components/Button';
import WalletApi, { ICoin } from 'apis/wallet';
import Loading from 'components/Loading';

export default observer(() => {
  const state = useLocalObservable(() => ({
    fetched: false,
    coins: [] as ICoin[],
  }));

  React.useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await WalletApi.coins();
        state.coins = Object.values(res.data);
      } catch (err) {
        console.log(err);
      }
      state.fetched = true;
    };
    fetchBalance();
    const timer = setInterval(fetchBalance, 200000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!state.fetched) {
    return (
      <div className="pt-40 flex justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="wallet-table rounded-t-md bg-white overflow-hidden">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>币种</TableCell>
            <TableCell>数量</TableCell>
            <TableCell>操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {
            state.coins.map((coin) => (
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
                  <span className="text-16 text-gray-4a mr-5">0</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Button outline size="small" className="mr-10">
                      {lang.transferIn}
                    </Button>
                    <Button outline size="small">
                      {lang.transferOut}
                    </Button>
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
          height: 30px !important;
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
});
