import { Platform, type TextStyle, type ViewStyle } from 'react-native';

export const colors = {
  bg: '#0A0C10',
  card: '#141721',
  cardElevated: '#1A1E29',
  border: 'rgba(30, 36, 51, 0.5)',
  borderSolid: '#1E2433',
  text: '#F8FAFC',
  muted: '#94A3B8',
  faint: '#64748B',
  emerald: '#10B981',
  violet: '#8B5CF6',
  amber: '#F59E0B',
  blue: '#3B82F6',
  crimson: '#EF4444',
  cyan: '#22D3EE',
  white: '#FFFFFF',
  glass: 'rgba(14, 17, 24, 0.62)',
  backdrop: 'rgba(0, 0, 0, 0.55)',
} as const;

export type Accent = keyof Pick<
  typeof colors,
  'emerald' | 'violet' | 'amber' | 'blue' | 'crimson'
>;

export const accentGlow: Record<Accent, string> = {
  emerald: 'rgba(16, 185, 129, 0.22)',
  violet: 'rgba(139, 92, 246, 0.22)',
  amber: 'rgba(245, 158, 11, 0.22)',
  blue: 'rgba(59, 130, 246, 0.22)',
  crimson: 'rgba(239, 68, 68, 0.22)',
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 22,
  xl: 24,
  pill: 18,
};

export const spring = {
  stiffness: 300,
  damping: 20,
  mass: 0.7,
};

export const fonts = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif',
});

const base: TextStyle = {
  fontFamily: fonts,
};

export const type = {
  largeTitle: {
    ...base,
    color: colors.text,
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: 0.37,
  } satisfies TextStyle,
  title: {
    ...base,
    color: colors.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: 0.35,
  } satisfies TextStyle,
  headline: {
    ...base,
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.41,
  } satisfies TextStyle,
  footnote: {
    ...base,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.08,
  } satisfies TextStyle,
};

export const cardShadow: ViewStyle = {
  shadowColor: '#000',
  shadowOpacity: 0.5,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 8 },
  elevation: 10,
};

export const cardSurface: ViewStyle = {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.lg,
};

export const phoneMaxWidth = 430;
