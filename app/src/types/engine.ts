export const Verdict = {
  ILLIQUID: 'ILLIQUID',
  PANIC_DUMP: 'PANIC_DUMP',
  BLOW_OFF_TOP: 'BLOW_OFF_TOP',
  CAPITULATION_REBOUND: 'CAPITULATION_REBOUND',
  NEUTRAL: 'NEUTRAL',
} as const;

export type Verdict = (typeof Verdict)[keyof typeof Verdict];

export interface Tick {
  ts_exchange: number;
  ts_received: number;
  price: number;
  qty: number;
  is_buyer_maker: boolean;
  best_bid: number;
  best_ask: number;
  bid_vol_1m: number;
  ask_vol_1m: number;
}

export interface MarketSnapshot {
  symbol: string;
  mid_price: number;
  spread_pct: number;
  atr_60s: number;
  volume_imbalance: number;
  price_delta_1m: number;
  last_ticks: Tick[];
  bid_depth_10: number;
  ask_depth_10: number;
}

export interface VerdictResult {
  verdict: Verdict;
  confidence: number;
  metadata: {
    exhaustion_zscore: number;
    volume_imbalance: number;
    price_delta_1m: number;
    spread_pct: number;
  };
  invalidation_level: number;
  target_range: [number, number];
  ttl_seconds: number;
}

export interface Asset {
  symbol: string;
  name: string;
  price: number;
  basePrice: number;
  volatility: number;
}

export interface SignalHistoryEntry {
  verdict: Verdict;
  timestamp: number;
  confidence: number;
  symbol: string;
}

export const VERDICT_COLORS: Record<Verdict, { bg: string; label: string }> = {
  [Verdict.ILLIQUID]: { bg: '#6B8A84', label: 'Illiquid' },
  [Verdict.PANIC_DUMP]: { bg: '#EF4444', label: 'Panic Dump' },
  [Verdict.BLOW_OFF_TOP]: { bg: '#10B981', label: 'Blow-Off Top' },
  [Verdict.CAPITULATION_REBOUND]: { bg: '#F59E0B', label: 'Capitulation Rebound' },
  [Verdict.NEUTRAL]: { bg: '#6B8A84', label: 'Neutral' },
};

export const VERDICT_DESCRIPTIONS: Record<Verdict, string> = {
  [Verdict.ILLIQUID]: 'Spread exceeds safety threshold. Trading halted.',
  [Verdict.PANIC_DUMP]: 'Extreme exhaustion with dominant ask volume and sharp decline.',
  [Verdict.BLOW_OFF_TOP]: 'Extreme exhaustion with dominant bid volume and sharp rally.',
  [Verdict.CAPITULATION_REBOUND]: 'This is a technical rebound, not a free fall.',
  [Verdict.NEUTRAL]: 'No significant market conditions detected.',
};
