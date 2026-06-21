import { useState } from 'react';

const NAV_ITEMS = ['Dashboard', 'Markets', 'Signals'];

export default function NavigationBar() {
  const [active, setActive] = useState('Dashboard');

  return (
    <nav
      style={{
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #D4E0DC',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '16px',
          fontWeight: 600,
          color: '#1A3631',
          letterSpacing: '-0.01em',
        }}
      >
        Antigravity
      </div>
      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item}
            onClick={() => setActive(item)}
            style={{
              position: 'relative',
              background: 'none',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              fontWeight: 500,
              color: '#1A3631',
              cursor: 'pointer',
              padding: '4px 0',
              transition: 'opacity 0.2s',
              opacity: active === item ? 1 : 0.6,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { if (active !== item) e.currentTarget.style.opacity = '0.6'; }}
          >
            {item}
            {active === item && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '-2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#10B981',
                }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
