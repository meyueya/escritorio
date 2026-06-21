import { useEffect, useRef, useState } from 'react';
import MainChart from './MainChart';
import { type Asset, type VerdictResult } from '@/types/engine';

interface MainChartAreaProps {
  asset: Asset;
  verdict: VerdictResult | null;
}

export default function MainChartArea({ asset, verdict }: MainChartAreaProps) {
  const [chartData, setChartData] = useState<number[]>([])
  const prevPrice = useRef(asset.price);

  // Initialize chart data
  useEffect(() => {
    const initial: number[] = [];
    let val = asset.price;
    for (let i = 0; i < 100; i++) {
      val += (Math.random() - 0.48) * asset.volatility * 0.2;
      initial.push(val);
    }
    const t = setTimeout(() => setChartData(initial), 0)
    return () => clearTimeout(t)
  }, [asset.symbol, asset.basePrice, asset.volatility, asset.price]);

  // Update chart data
  useEffect(() => {
    const interval = setInterval(() => {
      setChartData((prev: number[]) => {
        if (prev.length === 0) return prev;
        const newArr = [...prev];
        newArr.shift();
        const lastVal = newArr[newArr.length - 1];
        newArr.push(lastVal + (Math.random() - 0.48) * asset.volatility * 0.3);
        return newArr;
      });

      prevPrice.current = asset.price;
    }, 100);

    return () => clearInterval(interval);
  }, [asset.price, asset.volatility]);

  const priceDelta = ((asset.price - asset.basePrice) / asset.basePrice) * 100;
  const priceDeltaAbs = asset.price - asset.basePrice;
  const deltaPositive = priceDelta >= 0;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Price Header */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '28px',
              fontWeight: 500,
              color: '#1A3631',
              letterSpacing: '-0.02em',
            }}
          >
            ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '12px',
              color: deltaPositive ? '#10B981' : '#EF4444',
              fontWeight: 500,
            }}
          >
            {deltaPositive ? '+' : ''}{priceDeltaAbs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {' '}({deltaPositive ? '+' : ''}{priceDelta.toFixed(2)}%)
          </span>
        </div>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: '#6B8A84',
            marginTop: '2px',
          }}
        >
          {asset.symbol} — {asset.name}
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          background: '#F0F5F3',
          borderRadius: '8px',
          padding: '12px',
        }}
      >
        <MainChart data={chartData} />
      </div>

      {/* Spread & Volume Mini Panel */}
      {verdict && (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginTop: '12px',
          }}
        >
          {/* Spread */}
          <div
            style={{
              flex: 1,
              background: '#F0F5F3',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6B8A84',
                marginBottom: '6px',
              }}
            >
              Spread
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                className="bar-track"
                style={{ flex: 1, height: '6px' }}
              >
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.min(100, (verdict.metadata.spread_pct / 0.005) * 100)}%`,
                    background: verdict.metadata.spread_pct > 0.003 ? '#EF4444' : '#10B981',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px',
                  color: '#1A3631',
                  minWidth: '45px',
                  textAlign: 'right',
                }}
              >
                {(verdict.metadata.spread_pct * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Volume Imbalance */}
          <div
            style={{
              flex: 1,
              background: '#F0F5F3',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6B8A84',
                marginBottom: '6px',
              }}
            >
              Vol Imbalance
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                className="bar-track"
                style={{ flex: 1, height: '6px' }}
              >
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.abs(verdict.metadata.volume_imbalance) * 100}%`,
                    background: verdict.metadata.volume_imbalance > 0 ? '#10B981' : '#EF4444',
                    marginLeft: verdict.metadata.volume_imbalance < 0 ? 'auto' : '0',
                    marginRight: verdict.metadata.volume_imbalance > 0 ? 'auto' : '0',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px',
                  color: '#1A3631',
                  minWidth: '40px',
                  textAlign: 'right',
                }}
              >
                {verdict.metadata.volume_imbalance > 0 ? '+' : ''}{verdict.metadata.volume_imbalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Exhaustion */}
          <div
            style={{
              flex: 1,
              background: '#F0F5F3',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#6B8A84',
                marginBottom: '6px',
              }}
            >
              Exhaustion
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div
                className="bar-track"
                style={{ flex: 1, height: '6px' }}
              >
                <div
                  className="bar-fill"
                  style={{
                    width: `${Math.min(100, Math.abs(verdict.metadata.exhaustion_zscore) * 40)}%`,
                    background: Math.abs(verdict.metadata.exhaustion_zscore) > 2.5 ? '#EF4444' : Math.abs(verdict.metadata.exhaustion_zscore) > 1.5 ? '#F59E0B' : '#10B981',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '11px',
                  color: '#1A3631',
                  minWidth: '40px',
                  textAlign: 'right',
                }}
              >
                {verdict.metadata.exhaustion_zscore.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
