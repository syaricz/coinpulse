'use client';

import { useState } from 'react';

export const useCoinGeckoWebSocket = ({
  coinId,
  poolId,
  liveInterval,
}: UseCoinGeckoWebSocketProps): UseCoinGeckoWebSocketReturn => {
  const [price] = useState<ExtendedPriceData | null>(null);
  const [trades] = useState<Trade[]>([]);
  const [ohlcv] = useState<OHLCData | null>(null);

  return {
    price,
    trades,
    ohlcv,
    isConnected: false,
  };
};
