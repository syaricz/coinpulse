'use client';

import { Separator } from '@/components/ui/separator';
import CandlestickChart from '@/components/CandlestickChart';
import { useCoinGeckoWebSocket } from '@/hooks/useCoinGeckoWebSocket';
import DataTable from '@/components/DataTable';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { useEffect, useState } from 'react';
import CoinHeader from '@/components/CoinHeader';

const LiveDataWrapper = ({ children, coinId, poolId, coin, coinOHLCData }: LiveDataProps) => {
  const [liveInterval, setLiveInterval] = useState<'1s' | '1m'>('1s');
  const {
    trades: wsTrades,
    ohlcv,
    price,
    isConnected,
  } = useCoinGeckoWebSocket({
    coinId,
    poolId,
    liveInterval,
  });

  const [trades, setTrades] = useState<Trade[]>([]);
  const [ohlcData, setOhlcData] = useState<OHLCData[]>(coinOHLCData ?? []);

  useEffect(() => {
    if (coinOHLCData) setOhlcData(coinOHLCData);
  }, [coinOHLCData]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=1`
        );
        const data = await res.json();
        if (Array.isArray(data)) setOhlcData(data);
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 60000); // Poll setiap 1 menit untuk demo
    return () => clearInterval(interval);
  }, [coinId]);

  useEffect(() => {
    if (coin.tickers) {
      const fallbackTrades: Trade[] = coin.tickers.map((ticker) => ({
        price: ticker.converted_last.usd,
        amount: 0,
        value: 0,
        type: 'b',
        timestamp: new Date(ticker.timestamp).getTime(),
        market: ticker.market.name,
      }));
      setTrades(fallbackTrades.slice(0, 7));
    }
  }, [coin.tickers]);

  const tradeColumns: DataTableColumn<Trade>[] = [
    {
      header: 'Price',
      cellClassName: 'price-cell',
      cell: (trade) => (trade.price ? formatCurrency(trade.price) : '-'),
    },
    {
      header: 'Amount',
      cellClassName: 'amount-cell',
      cell: (trade) => trade.amount?.toFixed(4) ?? '-',
    },
    {
      header: 'Value',
      cellClassName: 'value-cell',
      cell: (trade) => (trade.value ? formatCurrency(trade.value) : '-'),
    },
    {
      header: 'Buy/Sell',
      cellClassName: 'type-cell',
      cell: (trade) => (
        <span className={trade.type === 'b' ? 'text-green-500' : 'text-red-500'}>
          {trade.type === 'b' ? 'Buy' : 'Sell'}
        </span>
      ),
    },
    {
      header: 'Market',
      cellClassName: 'market-cell',
      cell: (trade) => trade.market ?? '-',
    },
    {
      header: 'Time',
      cellClassName: 'time-cell',
      cell: (trade) => (trade.timestamp ? timeAgo(trade.timestamp) : '-'),
    },
  ];

  return (
    <section id="live-data-wrapper">
      <CoinHeader
        name={coin.name}
        image={coin.image.large}
        livePrice={price?.usd ?? coin.market_data.current_price.usd}
        livePriceChangePercentage24h={
          price?.change24h ?? coin.market_data.price_change_percentage_24h_in_currency.usd
        }
        priceChangePercentage30d={coin.market_data.price_change_percentage_30d_in_currency.usd}
        priceChange24h={coin.market_data.price_change_24h_in_currency.usd}
      />
      <Separator className="divider" />

      <div className="trend">
        <CandlestickChart
          coinId={coinId}
          data={ohlcData}
          liveOhlcv={ohlcv}
          mode={isConnected ? 'live' : 'static'}
          initialPeriod="daily"
          liveInterval={liveInterval}
          setLiveInterval={setLiveInterval}
        >
          <h4>Trend Overview</h4>
        </CandlestickChart>
      </div>

      <Separator className="divider" />

      {tradeColumns && (
        <div className="trades">
          <h4>Recent Trades</h4>

          <DataTable
            columns={tradeColumns}
            data={trades}
            rowKey={(_, index) => index}
            tableClassName="trades-table"
          />
        </div>
      )}
    </section>
  );
};

export default LiveDataWrapper;
