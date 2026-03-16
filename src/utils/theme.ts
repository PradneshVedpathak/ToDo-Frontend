export const colors = {
  bg: '#050505',
  bgCard: '#0d0d15',
  bgElevated: '#12121c',
  bgGlass: 'rgba(255,255,255,0.03)',
  purpleGlow: 'rgba(168, 85, 247, 0.4)',
  border: '#1a1a2e',
  borderLight: '#262640',

  primary: '#a855f7', // Vibrant Purple
  primaryLight: '#c084fc',
  primaryDark: '#7e22ce',
  primaryGlow: 'rgba(168, 85, 247, 0.25)',

  accent: '#fb7185', // Soft Rose
  accentGlow: 'rgba(251, 113, 133, 0.2)',

  secondary: '#06b6d4', // Vibrant Cyan
  secondaryGlow: 'rgba(6, 182, 212, 0.2)',

  success: '#10b981', // Emerald
  successGlow: 'rgba(16, 185, 129, 0.2)',

  warning: '#f59e0b', // Amber
  danger: '#ef4444', // Red
  dangerGlow: 'rgba(239, 68, 68, 0.2)',

  priorityLow: '#10b981',
  priorityMedium: '#f59e0b',
  priorityHigh: '#ef4444',

  text: '#fafafa',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  textDim: '#3f3f46',

  white: '#FFFFFF',
};

export const gradients = {
  primary: ['#6C63FF', '#8B84FF'],
  card: ['#111118', '#16161f'],
  danger: ['#FF6B6B', '#FF4444'],
  success: ['#4ECDC4', '#2BB5AC'],
};

export const spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48,
};

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, full: 999,
};

export const font = {
  sizes: { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24, xxxl: 32 },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
};
