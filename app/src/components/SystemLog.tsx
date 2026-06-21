/* eslint-disable react-hooks/purity, react-hooks/set-state-in-effect */
import { useEffect, useState } from 'react';
import { Verdict, VERDICT_COLORS, type SignalHistoryEntry } from '@/types/engine';

interface SystemLogProps {
  signalHistory: SignalHistoryEntry[];
}

function timeAgo(ts: number): string {
  const diff = (Date.now() - ts) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function SystemLog({ signalHistory }: SystemLogProps) {
  // Generate mock history if empty — compute in effect to avoid impure calls during render
  const [history, setHistory] = useState<SignalHistoryEntry[] | null>(null)
  const [adxValue, setAdxValue] = useState<number | null>(null)
  const [rsiValue, setRsiValue] = useState<number | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      if (signalHistory.length > 0) {
        setHistory(signalHistory)
      } else {
        const mock: SignalHistoryEntry[] = [
          { verdict: Verdict.BLOW_OFF_TOP, timestamp: Date.now() - 3600000, confidence: 0.85, symbol: 'BTC' },
          { verdict: Verdict.PANIC_DUMP, timestamp: Date.now() - 7200000, confidence: 0.78, symbol: 'NVDA' },
          { verdict: Verdict.NEUTRAL, timestamp: Date.now() - 10800000, confidence: 0.15, symbol: 'AAPL' },
          { verdict: Verdict.CAPITULATION_REBOUND, timestamp: Date.now() - 18000000, confidence: 0.72, symbol: 'SOL' },
        ];
        setHistory(mock)
      }

      setAdxValue(35 + Math.floor(Math.random() * 25))
      setRsiValue(45 + Math.floor(Math.random() * 30))
    }, 0)
    return () => clearTimeout(t)
  }, [signalHistory])

  return (
    <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Exhaustion Card */}
      <div
        style={{
          background: '#F0F5F3',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#6B8A84',
            marginBottom: '12px',
          }}
        >
          Exhaustion
        </div>

        {/* ADX Bar */}
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#6B8A84' }}>ADX</span>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                color: '#1A3631',
              }}
            >
              {adxValue}%
            </span>
          </div>
          <div className="bar-track" style={{ height: '6px' }}>
            <div
              className="bar-fill bar-fill--green"
              style={{ width: `${adxValue}%` }}
            />
          </div>
        </div>

        {/* RSI Bar */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span style={{ fontSize: '11px', color: '#6B8A84' }}>RSI</span>
            <span
              style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '11px',
                color: '#1A3631',
              }}
            >
              {rsiValue}%
            </span>
          </div>
          <div className="bar-track" style={{ height: '6px' }}>
            <div
              className="bar-fill bar-fill--amber"
              style={{ width: `${rsiValue}%` }}
            />
          </div>
        </div>
      </div>

      {/* Signal History */}
      <div
        style={{
          background: '#F0F5F3',
          borderRadius: '8px',
          padding: '16px',
          flex: 1,
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: '#6B8A84',
            marginBottom: '12px',
          }}
        >
          Signal History
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(history || []).map((entry, i) => {
            const color = VERDICT_COLORS[entry.verdict].bg;
            const shortLabel = entry.verdict === Verdict.BLOW_OFF_TOP ? 'BLOW-OFF'
              : entry.verdict === Verdict.CAPITULATION_REBOUND ? 'CAPITULATION'
              : entry.verdict === Verdict.PANIC_DUMP ? 'PANIC'
              : entry.verdict;
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      background: color,
                      color: 'white',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {shortLabel}
                  </span>
                  <span style={{ fontSize: '10px', color: '#6B8A84', fontFamily: '"JetBrains Mono", monospace' }}>
                    {entry.symbol}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#6B8A84' }}>
                  {timeAgo(entry.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
