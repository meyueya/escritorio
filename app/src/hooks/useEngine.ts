import { useState, useEffect, useRef, useCallback } from 'react';
import { Verdict, type Asset, type MarketSnapshot, type VerdictResult, type SignalHistoryEntry } from '@/types/engine';

const ASSETS: Asset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 187.45, basePrice: 187.45, volatility: 0.8 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 892.10, basePrice: 892.10, volatility: 2.5 },
  { symbol: 'BTC', name: 'Bitcoin', price: 67432.75, basePrice: 67432.75, volatility: 120 },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: 175.30, basePrice: 175.30, volatility: 1.8 },
  { symbol: 'USD/JPY', name: 'USD/JPY', price: 151.42, basePrice: 151.42, volatility: 0.05 },
  { symbol: 'ETH', name: 'Ethereum', price: 3521.60, basePrice: 3521.60, volatility: 18 },
  { symbol: 'SOL', name: 'Solana', price: 142.85, basePrice: 142.85, volatility: 2.2 },
  { symbol: 'AVAX', name: 'Avalanche', price: 35.40, basePrice: 35.40, volatility: 0.9 },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 165.20, basePrice: 165.20, volatility: 1.1 },
  { symbol: 'XRP', name: 'Ripple', price: 0.62, basePrice: 0.62, volatility: 0.02 },
];

function generateTick(asset: Asset): {
  price: number;
  qty: number;
  is_buyer_maker: boolean;
  best_bid: number;
  best_ask: number;
  bid_vol_1m: number;
  ask_vol_1m: number;
} {
  const spread = asset.price * (0.0005 + Math.random() * 0.001);
  const halfSpread = spread / 2;
  const best_bid = asset.price - halfSpread;
  const best_ask = asset.price + halfSpread;
  const qty = Math.random() * 10 + 0.1;
  const is_buyer_maker = Math.random() > 0.48;
  const bid_vol_1m = Math.random() * 500 + 100;
  const ask_vol_1m = Math.random() * 500 + 100;

  return {
    price: asset.price + (Math.random() - 0.5) * asset.volatility * 0.1,
    qty,
    is_buyer_maker,
    best_bid,
    best_ask,
    bid_vol_1m,
    ask_vol_1m,
  };
}

function evaluateAsset(snapshot: MarketSnapshot): VerdictResult {
  // Safety filter: spread
  if (snapshot.spread_pct > 0.005) {
    return {
      verdict: Verdict.ILLIQUID,
      confidence: 0.99,
      metadata: {
        exhaustion_zscore: 0,
        volume_imbalance: snapshot.volume_imbalance,
        price_delta_1m: snapshot.price_delta_1m,
        spread_pct: snapshot.spread_pct,
      },
      invalidation_level: snapshot.mid_price * 0.995,
      target_range: [snapshot.mid_price * 0.995, snapshot.mid_price * 1.005],
      ttl_seconds: 60,
    };
  }

  // Exhaustion calculation
  let exhaustion_score = 0;
  if (snapshot.last_ticks.length >= 2) {
    const last = snapshot.last_ticks[snapshot.last_ticks.length - 1];
    const prev = snapshot.last_ticks[snapshot.last_ticks.length - 2];
    const tick_range = Math.abs(last.price - prev.price);
    if (snapshot.atr_60s > 0) {
      exhaustion_score = tick_range / snapshot.atr_60s;
    }
  }

  const atr_std = snapshot.atr_60s * 0.3;
  let exhaustion_zscore = 0;
  if (atr_std > 0) {
    exhaustion_zscore = (exhaustion_score - 1.0) / atr_std;
  }

  const vi = snapshot.volume_imbalance;
  const pd = snapshot.price_delta_1m;

  // PANIC DUMP
  if (exhaustion_zscore > 2.5 && vi < -0.7 && pd < -0.01) {
    return {
      verdict: Verdict.PANIC_DUMP,
      confidence: Math.min(0.95, 0.7 + Math.abs(vi) * 0.2 + exhaustion_zscore * 0.05),
      metadata: { exhaustion_zscore, volume_imbalance: vi, price_delta_1m: pd, spread_pct: snapshot.spread_pct },
      invalidation_level: snapshot.mid_price * 0.985,
      target_range: [snapshot.mid_price * 0.99, snapshot.mid_price * 1.0],
      ttl_seconds: 60,
    };
  }

  // BLOW-OFF TOP
  if (exhaustion_zscore > 2.5 && vi > 0.7 && pd > 0.01) {
    return {
      verdict: Verdict.BLOW_OFF_TOP,
      confidence: Math.min(0.95, 0.7 + vi * 0.2 + exhaustion_zscore * 0.05),
      metadata: { exhaustion_zscore, volume_imbalance: vi, price_delta_1m: pd, spread_pct: snapshot.spread_pct },
      invalidation_level: snapshot.mid_price * 1.015,
      target_range: [snapshot.mid_price * 1.0, snapshot.mid_price * 1.01],
      ttl_seconds: 60,
    };
  }

  // CAPITULATION REBOUND
  if (vi > 0.6 && pd < -0.005 && exhaustion_zscore > 1.5) {
    return {
      verdict: Verdict.CAPITULATION_REBOUND,
      confidence: Math.min(0.90, 0.6 + vi * 0.25 + exhaustion_zscore * 0.08),
      metadata: { exhaustion_zscore, volume_imbalance: vi, price_delta_1m: pd, spread_pct: snapshot.spread_pct },
      invalidation_level: snapshot.mid_price * 0.992,
      target_range: [snapshot.mid_price * 1.002, snapshot.mid_price * 1.008],
      ttl_seconds: 60,
    };
  }

  // NEUTRAL
  return {
    verdict: Verdict.NEUTRAL,
    confidence: 0.1 + Math.random() * 0.2,
    metadata: { exhaustion_zscore, volume_imbalance: vi, price_delta_1m: pd, spread_pct: snapshot.spread_pct },
    invalidation_level: snapshot.mid_price * 0.99,
    target_range: [snapshot.mid_price * 0.995, snapshot.mid_price * 1.005],
    ttl_seconds: 60,
  };
}

export function useEngine() {
  const [assets, setAssets] = useState<Asset[]>(ASSETS);
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [verdict, setVerdict] = useState<VerdictResult | null>(null);
  const [signalHistory, setSignalHistory] = useState<SignalHistoryEntry[]>([]);
  const [latency, setLatency] = useState(12);
  const tickBuffers = useRef<Map<string, number[]>>(new Map());
  const lastVerdictRef = useRef<Verdict>(Verdict.NEUTRAL);

  // Initialize tick buffers
  useEffect(() => {
    ASSETS.forEach(a => {
      const arr: number[] = [];
      for (let i = 0; i < 30; i++) {
        arr.push(a.price + (Math.random() - 0.5) * a.volatility);
      }
      tickBuffers.current.set(a.symbol, arr);
    });
  }, []);

  const selectAsset = useCallback((symbol: string) => {
    setSelectedAsset(symbol);
    setVerdict(null);
  }, []);

  // Main engine loop
  useEffect(() => {
    const interval = setInterval(() => {
      setAssets(prev => prev.map(asset => {
        const change = (Math.random() - 0.48) * asset.volatility * 0.15;
        const newPrice = Math.max(0.01, asset.price + change);

        // Update tick buffer for sparklines
        const buf = tickBuffers.current.get(asset.symbol);
        if (buf) {
          buf.push(newPrice);
          if (buf.length > 30) buf.shift();
        }

        return { ...asset, price: newPrice };
      }));

      // Simulate latency jitter
      setLatency(prev => Math.max(8, Math.min(25, prev + (Math.random() - 0.5) * 4)));

      // Evaluate selected asset
      const asset = assets.find(a => a.symbol === selectedAsset);
      if (asset) {
        const buf = tickBuffers.current.get(asset.symbol) || [asset.price];
        const tickData = generateTick(asset);
        const spread = (tickData.best_ask - tickData.best_bid) / ((tickData.best_ask + tickData.best_bid) / 2);
        const total_vol = tickData.bid_vol_1m + tickData.ask_vol_1m;
        const vi = total_vol > 0 ? (tickData.bid_vol_1m - tickData.ask_vol_1m) / total_vol : 0;

        const snapshot: MarketSnapshot = {
          symbol: asset.symbol,
          mid_price: (tickData.best_bid + tickData.best_ask) / 2,
          spread_pct: spread,
          atr_60s: asset.volatility * 0.5,
          volume_imbalance: vi,
          price_delta_1m: (asset.price - asset.basePrice) / asset.basePrice,
          last_ticks: buf.slice(-10).map((price, i) => ({
            ts_exchange: Date.now() * 1000000 + i,
            ts_received: Date.now() * 1000000 + i,
            price,
            qty: Math.random() * 5,
            is_buyer_maker: Math.random() > 0.5,
            best_bid: price * 0.999,
            best_ask: price * 1.001,
            bid_vol_1m: tickData.bid_vol_1m,
            ask_vol_1m: tickData.ask_vol_1m,
          })),
          bid_depth_10: tickData.bid_vol_1m * 2.5,
          ask_depth_10: tickData.ask_vol_1m * 2.5,
        };

        const result = evaluateAsset(snapshot);
        setVerdict(result);

        // Only add to history when verdict changes
        if (result.verdict !== lastVerdictRef.current && result.verdict !== Verdict.NEUTRAL) {
          lastVerdictRef.current = result.verdict;
          setSignalHistory(prev => {
            const entry: SignalHistoryEntry = {
              verdict: result.verdict,
              timestamp: Date.now(),
              confidence: result.confidence,
              symbol: asset.symbol,
            };
            const updated = [entry, ...prev].slice(0, 20);
            return updated;
          });
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [selectedAsset, assets]);

  const getTickBuffer = useCallback((symbol: string): number[] => {
    return tickBuffers.current.get(symbol) || [];
  }, []);

  const selectedAssetData = assets.find(a => a.symbol === selectedAsset) || ASSETS[2];

  return {
    assets,
    selectedAsset,
    selectAsset,
    verdict,
    signalHistory,
    latency,
    selectedAssetData,
    getTickBuffer,
  };
}
