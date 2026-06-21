import { useMemo } from 'react';
import { useEngine } from '@/hooks/useEngine';
import BackgroundShader from '@/components/BackgroundShader';
import NavigationBar from '@/components/NavigationBar';
import StatsRow from '@/components/StatsRow';
import SignalPanel from '@/components/SignalPanel';
import MainChartArea from '@/components/MainChartArea';
import SystemLog from '@/components/SystemLog';
import StatusBar from '@/components/StatusBar';
import { Verdict } from '@/types/engine';

export default function Home() {
  const {
    assets,
    selectedAsset,
    selectAsset,
    verdict,
    signalHistory,
    latency,
    selectedAssetData,
    getTickBuffer,
  } = useEngine();

  // Count verdict types for stats
  const verdictCounts = useMemo(() => {
    const counts = { momentum: 0, breakout: 0, exhaustion: 0 };
    if (!verdict) return counts;
    if (verdict.verdict === Verdict.BLOW_OFF_TOP || verdict.verdict === Verdict.CAPITULATION_REBOUND) {
      counts.momentum++;
    }
    if (verdict.verdict === Verdict.BLOW_OFF_TOP || verdict.verdict === Verdict.PANIC_DUMP) {
      counts.breakout++;
    }
    if (verdict.verdict === Verdict.PANIC_DUMP || verdict.verdict === Verdict.CAPITULATION_REBOUND) {
      counts.exhaustion++;
    }
    // Add some from history
    signalHistory.slice(0, 5).forEach(s => {
      if (s.verdict === Verdict.BLOW_OFF_TOP || s.verdict === Verdict.CAPITULATION_REBOUND) counts.momentum++;
      if (s.verdict === Verdict.BLOW_OFF_TOP || s.verdict === Verdict.PANIC_DUMP) counts.breakout++;
      if (s.verdict === Verdict.PANIC_DUMP || s.verdict === Verdict.CAPITULATION_REBOUND) counts.exhaustion++;
    });
    return counts;
  }, [verdict, signalHistory]);

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <BackgroundShader />

      {/* Main White Panel */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          margin: '40px',
          background: '#FFFFFF',
          borderRadius: '12px',
          boxShadow: '0 4px 32px rgba(0, 0, 0, 0.15), 0 1px 4px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Navigation */}
        <NavigationBar />

        {/* Stats Row */}
        <div style={{ padding: '16px 0' }}>
          <StatsRow assets={assets} verdicts={verdictCounts} />
        </div>

        {/* Main Content: 3 columns */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            padding: '0 24px 16px',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Left: Signal Panel */}
          <SignalPanel
            assets={assets}
            selectedAsset={selectedAsset}
            onSelectAsset={selectAsset}
            verdict={verdict}
            getTickBuffer={getTickBuffer}
          />

          {/* Center: Main Chart */}
          <MainChartArea
            asset={selectedAssetData}
            verdict={verdict}
          />

          {/* Right: System Log */}
          <SystemLog signalHistory={signalHistory} />
        </div>

        {/* Bottom Status Bar */}
        <StatusBar latency={latency} />
      </div>
    </div>
  );
}
