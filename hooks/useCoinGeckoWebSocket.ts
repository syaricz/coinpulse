'use client';

import { useEffect, useState } from 'react';

export const useCoinGeckoWebSocket = ({
  coinId,
  poolId,
  liveInterval,
}: UseCoinGeckoWebSocketProps): UseCoinGeckoWebSocketReturn => {
  const [price, setPrice] = useState<ExtendedPriceData | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [ohlcv, setOhlcv] = useState<OHLCData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      socket = new WebSocket(
        'wss://api.coingecko.com/api/v3/onchain/networks/eth/pools/' + poolId + '/websocket'
      );

      socket.onopen = () => {
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === 'price') {
          setPrice({
            usd: data.price,
            change24h: data.change_24h,
          });
        } else if (data.type === 'trade') {
          const newTrade: Trade = {
            price: data.price,
            amount: data.amount,
            value: data.value,
            type: data.side === 'buy' ? 'b' : 's',
            timestamp: data.timestamp,
            market: data.market,
          };
          setTrades([newTrade]);
        } else if (data.type === 'ohlcv') {
          setOhlcv([data.timestamp, data.open, data.high, data.low, data.close]);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      };

      socket.onerror = () => {
        socket?.close();
      };
    };

    connect();

    return () => {
      socket?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [coinId, poolId, liveInterval]);

  return {
    price,
    trades,
    ohlcv,
    isConnected,
  };
};
