export const colors = {
  brand: {
    cyan: '#2BC9F4',
    blue: '#0E89BA',
    blueDeep: '#0B5F86',
    searchTraining: '#00b4e1',
  },
  bg: {
    app: '#F3F4F6',
    surface: '#FFFFFF',
    surfaceMuted: '#F9FAFB',
  },
  text: {
    primary: '#0B1220',
    secondary: '#4B5563',
    muted: '#6B7280',
    inverse: '#FFFFFF',
  },
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

// Per-ticket color themes (from mockup)
export const cardThemes = {
  blue: { from: '#0056D2', to: '#1e40af' },       // Safety/Construction
  rose: { from: '#991b1b', to: '#9f1239' },       // Expired
  slate: { from: '#1e293b', to: '#0f172a' },      // Processing
  indigo: { from: '#312e81', to: '#3730a3' },     // Traffic Control
  emerald: { from: '#065f46', to: '#047857' },    // Working at Heights
  neutral: { from: '#475569', to: '#334155' },    // Generic/White Card
  cyan: { from: '#2BC9F4', to: '#0E89BA' },       // Default brand gradient
};

// Status-specific styling
const verifiedStyle = {
  bg: 'rgba(16, 185, 129, 0.2)',
  border: 'rgba(16, 185, 129, 0.3)',
  text: '#6ee7b7',
  icon: '#10B981',
};

const unverifiedStyle = {
  bg: 'rgba(245, 158, 11, 0.2)',
  border: 'rgba(245, 158, 11, 0.3)',
  text: '#fcd34d',
  icon: '#F59E0B',
};

export const statusColors = {
  verified: verifiedStyle,
  validated: verifiedStyle, // Alias for verified
  expired: {
    bg: 'rgba(239, 68, 68, 0.2)',
    border: 'rgba(239, 68, 68, 0.3)',
    text: '#fca5a5',
    icon: '#EF4444',
  },
  processing: unverifiedStyle,
  unverified: unverifiedStyle,
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const radii = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 18,
  xxl: 22,
  pill: 999,
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
};

export const shadows = {
  card: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  soft: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
};

export const layout = {
  maxWidth: 980,
  cardMaxWidth: 440,
};

// Card dimensions (from mockup)
export const card = {
  expanded: {
    height: 220,
  },
  collapsed: {
    height: 70,
  },
  spacing: 16,
  borderRadius: 24, // rounded-3xl equivalent
  inactiveOpacity: 0.6,
  inactiveScale: 0.98,
};

// Animation timing
export const animation = {
  expandDuration: 500,
  scrollDuration: 800,
  easing: 'ease-in-out',
};

// Bottom pills container
export const pills = {
  height: 56,
  borderRadius: 9999, // pill shape
  gap: 12,
};

// Card theme type helper
export type CardThemeKey = keyof typeof cardThemes;

