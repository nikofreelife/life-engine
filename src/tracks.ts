import type { AbstinenceTrack, SecretState, TrackKind } from './types';
import type { Accent } from './theme';
import { uid } from './lib';

export type RecoveryScale = {
  label: string;
  daysToFull: number;
  milestones?: number[];
};

export type TrackTemplate = {
  kind: Exclude<TrackKind, 'custom'>;
  name: string;
  emoji: string;
  accent: Accent;
  money: boolean;
  moneyLabel: string;
  scales: RecoveryScale[];
};

export const TRACK_TEMPLATES: TrackTemplate[] = [
  {
    kind: 'thc',
    name: 'Отказ от ТГК / Каннабиноидов',
    emoji: '🌿',
    accent: 'crimson',
    money: true,
    moneyLabel: 'Траты на ТГК в месяц',
    scales: [{ label: 'Восстановление ясности ума', daysToFull: 90, milestones: [14, 30, 90] }],
  },
  {
    kind: 'nofap',
    name: 'NoFap / Semen Retention',
    emoji: '⚡',
    accent: 'violet',
    money: false,
    moneyLabel: '',
    scales: [
      { label: 'Дофаминовое восстановление', daysToFull: 90, milestones: [30, 60, 90] },
      { label: 'Шкала жизненной энергии', daysToFull: 120, milestones: [21, 60, 120] },
    ],
  },
  {
    kind: 'nicotine',
    name: 'Никотин / Вейп',
    emoji: '🚭',
    accent: 'blue',
    money: true,
    moneyLabel: 'Траты на никотин / вейп в месяц',
    scales: [
      { label: 'Очищение лёгких', daysToFull: 90, milestones: [3, 14, 90] },
      { label: 'Восстановление сосудов', daysToFull: 365, milestones: [21, 90, 365] },
    ],
  },
  {
    kind: 'alcohol',
    name: 'Алкоголь',
    emoji: '🍷',
    accent: 'amber',
    money: true,
    moneyLabel: 'Траты на алкоголь в месяц',
    scales: [{ label: 'Восстановление печени', daysToFull: 90, milestones: [7, 30, 90] }],
  },
  {
    kind: 'sugar',
    name: 'Сахар / Фастфуд',
    emoji: '🍫',
    accent: 'amber',
    money: true,
    moneyLabel: 'Траты на сахар / фастфуд в месяц',
    scales: [
      { label: 'Стабилизация инсулина', daysToFull: 30, milestones: [7, 14, 30] },
      { label: 'Выравнивание энергии', daysToFull: 45, milestones: [10, 21, 45] },
    ],
  },
];

export const CUSTOM_SCALES: RecoveryScale[] = [
  { label: 'Дисциплина цикла', daysToFull: 90, milestones: [7, 30, 90] },
];

export function templateOf(kind: TrackKind) {
  return TRACK_TEMPLATES.find((item) => item.kind === kind);
}

export function makeTrack(
  kind: TrackKind,
  patch?: Partial<Pick<AbstinenceTrack, 'id' | 'name' | 'startISO' | 'monthlyCost' | 'journal'>>,
): AbstinenceTrack {
  const tpl = templateOf(kind);
  return {
    id: patch?.id ?? uid('trk'),
    kind,
    name: patch?.name ?? tpl?.name ?? 'Своё воздержание',
    startISO: patch?.startISO ?? null,
    monthlyCost: patch?.monthlyCost ?? 0,
    journal: patch?.journal ?? [],
  };
}

const SEEDED_KINDS: TrackKind[] = ['thc', 'nofap', 'nicotine', 'alcohol', 'sugar'];

function isBlankTrack(track: AbstinenceTrack) {
  return !track.startISO && !(track.journal?.length) && !(track.monthlyCost > 0);
}

/** Auto-seeded unused templates from older builds — wipe so first visit is empty. */
function isUnusedDefaultSeed(tracks: AbstinenceTrack[]) {
  if (tracks.length !== 5) return false;
  const kinds = new Set(tracks.map((track) => track.kind));
  return SEEDED_KINDS.every((kind) => kinds.has(kind)) && tracks.every((track) => track.kind !== 'custom' && isBlankTrack(track));
}

export function migrateTracks(secret: SecretState): AbstinenceTrack[] {
  if (Array.isArray(secret.tracks)) {
    return isUnusedDefaultSeed(secret.tracks) ? [] : secret.tracks;
  }

  const customs = (secret.customTracks ?? []).map((item) =>
    makeTrack('custom', {
      id: item.id,
      name: item.name,
      startISO: item.startISO,
      monthlyCost: item.monthlyCost ?? 0,
      journal: item.journal,
    }),
  );
  const out: AbstinenceTrack[] = [];
  const hadThc =
    Boolean(secret.thcStartISO) ||
    Boolean(secret.thcJournal?.length) ||
    (secret.thcMonthlyCost ?? 0) > 0 ||
    (secret.thcDailyCost ?? 0) > 0;
  if (hadThc) {
    out.push(
      makeTrack('thc', {
        startISO: secret.thcStartISO,
        monthlyCost: secret.thcMonthlyCost || (secret.thcDailyCost > 0 ? secret.thcDailyCost * 30.437 : 0),
        journal: secret.thcJournal ?? [],
      }),
    );
  }
  if (secret.nofapStartISO || secret.nofapJournal?.length) {
    out.push(makeTrack('nofap', { startISO: secret.nofapStartISO, journal: secret.nofapJournal ?? [] }));
  }
  out.push(...customs);
  return out;
}

export function scalePercent(days: number, daysToFull: number) {
  if (daysToFull <= 0) return 0;
  return Math.max(0, Math.min(100, (days / daysToFull) * 100));
}
