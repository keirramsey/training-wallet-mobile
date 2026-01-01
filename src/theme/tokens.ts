export const colors = {
  brand: {
    cyan: '#2BC9F4',
    blue: '#0E89BA',
    blueDeep: '#0B5F86',
    searchTraining: '#00b4e1',
    gold: '#F59E0B',
    goldLight: '#FCD34D',
  },
  // Auth/Primary colors (from mockup)
  primary: '#2b6cee',
  primaryDark: '#1a4fb0',
  primaryHover: '#1e5cd9',
  bg: {
    app: '#F3F4F6',
    auth: '#f6f6f8',
    surface: '#FFFFFF',
    surfaceMuted: '#F9FAFB',
  },
  input: {
    border: '#dbdfe6',
    placeholder: '#616f89',
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
    // Modern boxShadow property for Web/Modern RN
    boxShadow: '0px 14px 20px 0px rgba(11, 18, 32, 0.2)',
  },
  soft: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
    // Modern boxShadow property for Web/Modern RN
    boxShadow: '0px 10px 16px 0px rgba(11, 18, 32, 0.12)',
  },
};

export const layout = {
  maxWidth: 980,
  cardMaxWidth: 440,
};

// Card dimensions (from mockup) - scaled for mobile
export const card = {
  expanded: {
    height: 180,
  },
  collapsed: {
    height: 56,
  },
  spacing: 14,
  borderRadius: 20, // rounded-2xl equivalent
  inactiveOpacity: 0.7,
  inactiveScale: 0.95,
};

// Animation timing
export const animation = {
  expandDuration: 500,
  scrollDuration: 800,
  easing: [0.4, 0, 0.2, 1] as const, // cubic-bezier for ease-in-out
};

// Accessibility tokens
export const accessibility = {
  touchTarget: 44, // Minimum touch target size (44pt)
  hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
};

// Pressed/focus state tokens
export const pressedState = {
  opacity: 0.85,
  scale: 0.97,
};

// High contrast color variants for accessibility
export const highContrast = {
  text: {
    onGradient: '#FFFFFF', // Pure white for gradient backgrounds
    onDark: '#FFFFFF',
  },
  border: {
    focus: colors.brand.cyan,
  },
};

// Bottom pills container
export const pills = {
  height: 56,
  borderRadius: 9999, // pill shape
  gap: 12,
};

// Card theme type helper
export type CardThemeKey = keyof typeof cardThemes;

// AI Assistant gradient (gold sparkles)
export const aiAssistant = {
  gradient: {
    from: colors.brand.cyan,
    to: colors.brand.blue,
  },
  sparkleGradient: {
    from: colors.brand.goldLight,
    to: colors.brand.gold,
  },
};

