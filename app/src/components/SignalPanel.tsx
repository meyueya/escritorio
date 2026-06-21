import { useState } from 'react';
import { Verdict, VERDICT_COLORS, VERDICT_DESCRIPTIONS, type Asset, type VerdictResult } from '@/types/engine';
import Sparkline from './Sparkline';

interface SignalPanelProps {
  assets: Asset[];
  selectedAsset: string;
  onSelectAsset: (symbol: string) => void;
  verdict: VerdictResult | null;
  getTickBuffer: (symbol: string) => number[];
}

export default function SignalPanel({ assets, selectedAsset, onSelectAsset, verdict, getTickBuffer }: SignalPanelProps) {
  const [search, setSearch] = useState('');

  const filteredAssets = assets.filter(a =>
    a.symbol.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const verdictColor = verdict ? VERDICT_COLORS[verdict.verdict].bg : '#6B8A84';
  const verdictLabel = verdict ? VERDICT_COLORS[verdict.verdict].label : 'Analyzing...';
  const verdictDesc = verdict ? VERDICT_DESCRIPTIONS[verdict.verdict] : 'Waiting for data...';

  return (
    <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Signal Verdict Card */}
      <div
        style={{
          background: '#F0F5F3',
          borderRadius: '8px',
          padding: '20px',
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
          Signal Verdict
        </div>

        <div
          style={{
            display: 'inline-block',
            background: verdictColor,
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '10px',
          }}
        >
          {verdictLabel}
        </div>

        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            fontWeight: 400,
            color: '#1A3631',
            lineHeight: 1.5,
            margin: '0 0 14px 0',
          }}
        >
          {verdictDesc}
        </p>

        {/* Confidence Bar */}
        {verdict && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  color: '#6B8A84',
                }}
              >
                Confidence
              </span>
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: '12px',
                  color: '#1A3631',
                }}
              >
                {Math.round(verdict.confidence * 100)}%
              </span>
            </div>
            <div className="bar-track">
              <div
                className="bar-fill bar-fill--green"
                style={{ width: `${verdict.confidence * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Target Range */}
        {verdict && verdict.verdict !== Verdict.NEUTRAL && verdict.verdict !== Verdict.ILLIQUID && (
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#6B8A84' }}>Target</span>
              <span style={{ fontSize: '11px', color: '#1A3631', fontFamily: '"JetBrains Mono", monospace' }}>
                ${verdict.target_range[0].toLocaleString('en-US', { minimumFractionDigits: 2 })} — ${verdict.target_range[1].toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#6B8A84' }}>Invalidation</span>
              <span style={{ fontSize: '11px', color: '#EF4444', fontFamily: '"JetBrains Mono", monospace' }}>
                &lt; ${verdict.invalidation_level.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: '#6B8A84' }}>TTL</span>
              <span style={{ fontSize: '11px', color: '#F59E0B', fontFamily: '"JetBrains Mono", monospace' }}>
                {verdict.ttl_seconds}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Asset Selector */}
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
            marginBottom: '10px',
          }}
        >
          Assets
        </div>

        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            border: '1px solid #D4E0DC',
            borderRadius: '6px',
            background: 'white',
            color: '#1A3631',
            outline: 'none',
            marginBottom: '8px',
            boxSizing: 'border-box',
          }}
        />

        <div
          style={{
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {filteredAssets.map((asset) => {
            const isActive = asset.symbol === selectedAsset;
            const tickData = getTickBuffer(asset.symbol);
            return (
              <button
                key={asset.symbol}
                onClick={() => onSelectAsset(asset.symbol)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 10px',
                  border: 'none',
                  background: isActive ? 'white' : 'transparent',
                  borderLeft: isActive ? '3px solid #10B981' : '3px solid transparent',
                  borderRadius: '0 4px 4px 0',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.5)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#1A3631',
                    }}
                  >
                    {asset.symbol}
                  </div>
                  <div style={{ fontSize: '10px', color: '#6B8A84' }}>{asset.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkline data={tickData.length > 2 ? tickData : [asset.price, asset.price]} width={60} height={20} />
                  <span
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '12px',
                      color: '#1A3631',
                      minWidth: '60px',
                      textAlign: 'right',
                    }}
                  >
                    ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
