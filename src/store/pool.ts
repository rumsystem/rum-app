interface Token {
  symbol: string;
  volume: string;
}

interface IPool {
  created_at: string;
  invariant: string;
  pool_creator: string;
  pool_name: string;
  pool_status: string;
  pool_token: Token;
  rates: {
    [key: string]: string;
  };
  swap_fee: string;
  tokens: Token[];
}

interface ICurrencyMap {
  [currency: string]: string[];
}

export function createPoolStore() {
  return {
    pools: [] as IPool[],
    poolMap: {} as { [token: string]: IPool },
    rateMap: {} as { [token: string]: string },
    currencyPairs: [] as any,
    tokenCurrencyPairMap: {} as any,
    swapToMap: {} as ICurrencyMap,
    currencySet: new Set(),
    get currencies() {
      return Array.from(this.currencySet) as string[];
    },
    setPools(pools: IPool[]) {
      this.pools = [];
      this.currencyPairs = [] as any;
      this.swapToMap = {} as ICurrencyMap;
      this.currencySet = new Set();
      for (const pool of pools) {
        this.pools.push(pool);
        const tokenPairs = pool.tokens.map((token) => token.symbol);
        this.currencySet.add(tokenPairs[0]);
        this.currencySet.add(tokenPairs[1]);
        if (!this.swapToMap[tokenPairs[0]]) {
          this.swapToMap[tokenPairs[0]] = [];
        }
        if (!this.swapToMap[tokenPairs[1]]) {
          this.swapToMap[tokenPairs[1]] = [];
        }
        this.swapToMap[tokenPairs[0]].push(tokenPairs[1]);
        this.swapToMap[tokenPairs[1]].push(tokenPairs[0]);
        this.currencyPairs.push([tokenPairs[0], tokenPairs[1]]);
        this.tokenCurrencyPairMap[`${tokenPairs[0]}${tokenPairs[1]}`] = [
          tokenPairs[0],
          tokenPairs[1],
        ];
        this.poolMap[`${tokenPairs[0]}${tokenPairs[1]}`] = pool;
        for (const key in pool.rates) {
          this.rateMap[`${key.replace('-', '')}`] = pool.rates[key];
        }
      }
    },
    getCurrencyPair(currencyA: string, currencyB: string) {
      if (this.tokenCurrencyPairMap[`${currencyA}${currencyB}`]) {
        return [currencyA, currencyB];
      }
      if (this.tokenCurrencyPairMap[`${currencyB}${currencyA}`]) {
        return [currencyB, currencyA];
      }
      return [];
    },
  };
}
