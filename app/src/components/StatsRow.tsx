/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */
import { useMemo, useState, useEffect } from 'react';
import Sparkline from './Sparkline';

interface StatsRowProps {
  assets: { symbol: string; price: number }[];
  verdicts: { momentum: number; breakout: number; exhaustion: number };
}

export default function StatsRow({ assets, verdicts }: StatsRowProps) {
  const portfolioValue = useMemo(() => {
    return assets.reduce((sum, a) => sum + a.price * 0.7, 0);
  }, [assets]);

  const [portfolioHistory, setPortfolioHistory] = useState<number[]>([])

  const [exposureHistory, setExposureHistory] = useState<number[]>([])

  useEffect(() => {
    const base = portfolioValue
    const ph = Array.from({ length: 30 }, (_, i) => {
      return base + Math.sin(i * 0.3) * base * 0.02 + (Math.random() - 0.5) * base * 0.005
    })
    const t = setTimeout(() => setPortfolioHistory(ph), 0)
    return () => clearTimeout(t)
  }, [portfolioValue])

  useEffect(() => {
    const eh = Array.from({ length: 30 }, (_, i) => {
      return 20 + Math.sin(i * 0.2) * 5 + Math.random() * 2
    })
    const t = setTimeout(() => setExposureHistory(eh), 0)
    return () => clearTimeout(t)
  }, [])

  const activeSignals = verdicts.momentum + verdicts.breakout + verdicts.exhaustion;

  const exposure = ((activeSignals / 20) * 100).toFixed(1);

  return (
    <div style={{ display: 'flex', gap: '16px', padding: '0 24px' }}>
      {/* Portfolio Card */}
      <div
        style={{
          flex: 1,
          background: '#F0F5F3',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B8A84',
              marginBottom: '4px',
            }}
          >
            Portfolio
          </div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '22px',
              fontWeight: 500,
              color: '#1A3631',
              letterSpacing: '-0.02em',
            }}
          >
            ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Sparkline data={portfolioHistory} width={100} height={30} />
        </div>
      </div>

      {/* Active Signals Card */}
      <div
        style={{
          flex: 1,
          background: '#F0F5F3',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B8A84',
              marginBottom: '4px',
            }}
          >
            Active
          </div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '22px',
              fontWeight: 500,
              color: '#1A3631',
              letterSpacing: '-0.02em',
            }}
          >
            {activeSignals}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#10B981',
              color: 'white',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            Momentum {verdicts.momentum}
          </span>
          <span
            style={{
              background: '#F59E0B',
              color: 'white',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            Breakout {verdicts.breakout}
          </span>
          <span
            style={{
              background: '#EF4444',
              color: 'white',
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            Exhaustion {verdicts.exhaustion}
          </span>
        </div>
      </div>

      {/* Exposure Card */}
      <div
        style={{
          flex: 1,
          background: '#F0F5F3',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: '#6B8A84',
              marginBottom: '4px',
            }}
          >
            Exposure
          </div>
          <div
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '22px',
              fontWeight: 500,
              color: '#1A3631',
              letterSpacing: '-0.02em',
            }}
          >
            {exposure}%
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
          <Sparkline data={exposureHistory} width={100} height={30} color="#6B8A84" fillColor="rgba(107, 138, 132, 0.15)" />
        </div>
      </div>
    </div>
  );
}
