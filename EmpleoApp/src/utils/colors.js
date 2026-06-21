// Sistema de colores con soporte automático de Dark Mode
// Preserva la identidad visual cyberpunk (cyans + purples + dark)

export const colors = {
  // Backgrounds
  bgApp: '#040818',
  bgSurface: '#080f1f',
  bgCard: '#0c1528',
  bgInput: '#0a1020',
  bgSidebar: '#060d1a',

  // Brand colors
  primary: '#00f2fe',
  primaryGlow: 'rgba(0, 242, 254, 0.08)',
  secondary: '#8d37ff',
  secondaryGlow: 'rgba(141, 55, 255, 0.08)',

  // Semantic colors
  success: '#10b981',
  successGlow: 'rgba(16, 185, 129, 0.08)',
  warning: '#f59e0b',
  warningGlow: 'rgba(245, 158, 11, 0.08)',
  danger: '#ef4444',
  dangerGlow: 'rgba(239, 68, 68, 0.08)',

  // Text
  textMain: '#e2e8f0',
  textMuted: '#64748b',
  textInverse: '#020612',

  // Borders
  borderGlass: 'rgba(255, 255, 255, 0.06)',
  borderGlassGlow: 'rgba(0, 242, 254, 0.15)',

  // Terminal
  terminalBg: '#030508',
  terminalHeader: '#090e17',

  // Log colors
  logInfo: '#81a1c1',
  logScrape: '#88c0d0',
  logNlp: '#b48ead',
  logSuccess: '#10b981',
  logWarning: '#f59e0b',
  logError: '#ef4444',
};

// Estilos de tarjeta de cristal (glassmorphism)
export const glassCard = {
  backgroundColor: 'rgba(12, 21, 40, 0.8)',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.06)',
  padding: 16,
};

// Estilos comunes de texto
export const typography = {
  displayFont: 'System', // San Francisco en iOS
  monoFont: 'Courier New',
};
