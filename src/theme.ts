export const colors = {
  bg: '#0B0D12',
  card: '#131722',
  cardElevated: '#181D2A',
  border: '#1E293B',
  text: '#F8FAFC',
  muted: '#94A3B8',
  faint: '#64748B',
  emerald: '#10B981',
  violet: '#8B5CF6',
  amber: '#F59E0B',
  blue: '#3B82F6',
  crimson: '#EF4444',
  white: '#FFFFFF',
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
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
};

export const phoneMaxWidth = 430;
