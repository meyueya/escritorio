interface StatusBarProps {
  latency: number;
}

export default function StatusBar({ latency }: StatusBarProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '32px',
        background: '#1A3631',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        borderRadius: '0 0 8px 8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#10B981',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.7)',
          }}
        >
          System: Online
        </span>
      </div>

      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        Tick Processing: Active
      </span>

      <span
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: '11px',
          color: latency > 20 ? '#F59E0B' : '#10B981',
        }}
      >
        API Latency: {Math.round(latency)}ms
      </span>
    </div>
  );
}
