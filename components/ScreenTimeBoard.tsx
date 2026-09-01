import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { PressScale } from './PressScale';
import { UsageReport } from './UsageReport';
import {
  applyPolicy,
  authorizationStatus,
  clearPolicy,
  consumePendingUnlock,
  isNativeAvailable,
  isShielded,
  presentPicker,
  requestAuthorization,
  type AuthStatus,
} from '@/modules/life-engine-screentime';
import {
  PHRASE_CHIPS,
  WEEK_LABELS,
  effectiveDailyCapMin,
  formatMinutes,
  isBypassed,
  selectionLabel,
} from '../src/screentime';
import { useEngine } from '../src/store';
import { colors } from '../src/theme';

export function ScreenTimeBoard() {
  const {
    state,
    setScreenPhrase,
    setScreenRepeats,
    setScreenSelection,
    patchScreenLimits,
    openScreenUnlock,
    setScreenNativeLocked,
  } = useEngine();
  const st = state.screenTime;
  const [auth, setAuth] = useState<AuthStatus>(isNativeAvailable ? 'notDetermined' : 'unavailable');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phraseDraft, setPhraseDraft] = useState(st.phrase);
  const [customRepeats, setCustomRepeats] = useState(
    (PHRASE_CHIPS as readonly number[]).includes(st.repeats) ? '' : String(st.repeats),
  );
  const [weekly, setWeekly] = useState(String(st.weeklyLimitMin));
  const [daily, setDaily] = useState(String(st.dailyCapMin));
  const [days, setDays] = useState(st.dayLimitsMin.map(String));

  const bypassed = isBypassed(st.bypassUntil);
  const todayCap = effectiveDailyCapMin(st);

  const pushPolicy = useCallback(async () => {
    if (!st.selection?.selectionData || !isNativeAvailable) return;
    await applyPolicy({
      selectionData: st.selection.selectionData,
      weeklyLimitMin: st.weeklyLimitMin,
      dailyCapMin: st.dailyCapMin,
      useDayGrid: st.useDayGrid,
      dayLimitsMin: st.dayLimitsMin,
      bypassUntil: st.bypassUntil,
    });
  }, [st]);

  useEffect(() => {
    void authorizationStatus().then(setAuth);
  }, []);

  useEffect(() => {
    const sync = async () => {
      if (await consumePendingUnlock()) openScreenUnlock();
      if (await isShielded()) setScreenNativeLocked(true);
    };
    void sync();
    const sub = AppState.addEventListener('change', (status) => {
      if (status === 'active') void sync();
    });
    return () => sub.remove();
  }, [openScreenUnlock, setScreenNativeLocked]);

  useEffect(() => {
    void pushPolicy();
  }, [pushPolicy]);

  const addApps = async () => {
    setError('');
    setBusy(true);
    try {
      if (!isNativeAvailable) {
        setError('Системный FamilyActivityPicker работает только на iPhone / iPad с development build.');
        return;
      }
      let status = auth;
      if (status !== 'approved') {
        status = await requestAuthorization();
        setAuth(status);
      }
      if (status !== 'approved') {
        setError('Нужен доступ к Экранному времени. В Настройках iOS: Экранное время → поделиться данными.');
        return;
      }
      const picked = await presentPicker(st.selection?.selectionData);
      if (!picked.applicationCount && !picked.categoryCount && !picked.webCount) {
        setScreenSelection(null);
        await clearPolicy();
        return;
      }
      setScreenSelection(picked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось открыть системный селектор.');
    } finally {
      setBusy(false);
    }
  };

  const saveLimits = () => {
    patchScreenLimits({
      weeklyLimitMin: Number(weekly) || 0,
      dailyCapMin: Number(daily) || 0,
      dayLimitsMin: days.map((n) => Number(n) || 0),
    });
  };

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={['#1A1430', '#12101C', '#0D0F16']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Text style={styles.heroKicker}>APPLE SCREEN TIME</Text>
        <Text style={styles.heroTitle}>Настоящий системный щит</Text>
        <Text style={styles.heroLead}>
          Выбор приложений идёт через FamilyActivityPicker. Лимиты считает DeviceActivity. Блокировка — ManagedSettings
          на уровне iOS, не «сессия чести».
        </Text>
        <View style={styles.statusRow}>
          <StatusChip label={Platform.OS === 'ios' && isNativeAvailable ? 'iOS native' : 'Web / нет щита'} on={isNativeAvailable} />
          <StatusChip label={auth === 'approved' ? 'Доступ выдан' : 'Нет авторизации'} on={auth === 'approved'} />
          <StatusChip label={st.nativeLocked && !bypassed ? 'Щит ON' : bypassed ? 'Обход до 00:00' : 'Щит OFF'} on={st.nativeLocked && !bypassed} danger />
        </View>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Выбранные приложения</Text>
        <Text style={styles.meta}>{selectionLabel(st.selection)}</Text>
        <PressScale haptic="rigid" onPress={() => void addApps()} style={styles.primary}>
          <Text style={styles.primaryText}>{busy ? 'Открываю iOS…' : '+ Добавить приложение'}</Text>
        </PressScale>
        {st.selection ? (
          <PressScale
            haptic="warning"
            onPress={() => {
              setScreenSelection(null);
              void clearPolicy();
            }}
            style={styles.ghost}>
            <Text style={styles.ghostText}>Снять выбор и щит</Text>
          </PressScale>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!isNativeAvailable ? (
          <Text style={styles.hint}>
            FamilyActivityPicker и щит ManagedSettings работают только в iOS development build (не Expo Go и не веб).
            Нужны Family Controls и App Group `group.com.lifeengine.app`.
          </Text>
        ) : null}
        {isNativeAvailable ? <UsageReport selectionData={st.selection?.selectionData} /> : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Недельный бюджет и дневная отсечка</Text>
        <Text style={styles.fieldLabel}>Недельный лимит, минут</Text>
        <TextInput value={weekly} onChangeText={(t) => setWeekly(t.replace(/[^\d]/g, ''))} onBlur={saveLimits} keyboardType="number-pad" style={styles.input} />
        <Text style={styles.hint}>{formatMinutes(Number(weekly) || 0)} на 7 дней</Text>
        <Text style={styles.fieldLabel}>Дневная отсечка, минут</Text>
        <TextInput value={daily} onChangeText={(t) => setDaily(t.replace(/[^\d]/g, ''))} onBlur={saveLimits} keyboardType="number-pad" style={styles.input} />
        <Text style={styles.hint}>Сегодня {formatMinutes(todayCap)} · 0 = полная блокировка</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Сетка по дням недели</Text>
        <PressScale haptic="light" onPress={() => patchScreenLimits({ useDayGrid: !st.useDayGrid })} style={[styles.toggle, st.useDayGrid && styles.toggleOn]}>
          <Text style={[styles.toggleText, st.useDayGrid && styles.toggleTextOn]}>
            {st.useDayGrid ? 'Сетка включена · каждый день свой лимит' : 'Сетка выключена · одна дневная отсечка'}
          </Text>
        </PressScale>
        {st.useDayGrid ? (
          <View style={styles.weekRow}>
            {WEEK_LABELS.map((label, i) => (
              <View key={label} style={styles.dayEdit}>
                <Text style={styles.dayLabel}>{label}</Text>
                <TextInput
                  value={days[i]}
                  onChangeText={(text) => {
                    const next = [...days];
                    next[i] = text.replace(/[^\d]/g, '');
                    setDays(next);
                  }}
                  onBlur={saveLimits}
                  keyboardType="number-pad"
                  style={styles.dayInput}
                />
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Дисциплинарная фраза</Text>
        <TextInput value={phraseDraft} onChangeText={setPhraseDraft} onBlur={() => setScreenPhrase(phraseDraft)} multiline style={[styles.input, styles.phrase]} />
        <Text style={styles.fieldLabel}>Повторений для аварийного обхода</Text>
        <View style={styles.chipRow}>
          {PHRASE_CHIPS.map((n) => {
            const on = st.repeats === n && !customRepeats;
            return (
              <PressScale
                key={n}
                haptic="light"
                onPress={() => {
                  setCustomRepeats('');
                  setScreenRepeats(n);
                }}
                style={[styles.chip, on && styles.chipOn]}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{n}</Text>
              </PressScale>
            );
          })}
          <PressScale
            haptic="light"
            onPress={() => {
              if (!customRepeats) setCustomRepeats(String(st.repeats));
            }}
            style={[styles.chip, Boolean(customRepeats) && styles.chipOn]}>
            <Text style={[styles.chipText, Boolean(customRepeats) && styles.chipTextOn]}>Кастом</Text>
          </PressScale>
        </View>
        {customRepeats !== '' ? (
          <TextInput
            value={customRepeats}
            onChangeText={(text) => {
              const digits = text.replace(/[^\d]/g, '');
              setCustomRepeats(digits);
              if (digits) setScreenRepeats(Number(digits));
            }}
            keyboardType="number-pad"
            placeholder="1–500"
            placeholderTextColor={colors.faint}
            style={styles.input}
          />
        ) : null}
        {st.nativeLocked && !bypassed ? (
          <PressScale haptic="rigid" onPress={openScreenUnlock} style={styles.danger}>
            <Text style={styles.dangerText}>Фразная разблокировка</Text>
          </PressScale>
        ) : null}
      </View>

      {st.bypassLog.length ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>История обходов</Text>
          {st.bypassLog.slice(0, 5).map((item) => (
            <Text key={item.id} style={styles.history}>
              {item.repeats} фраз · {new Date(item.atISO).toLocaleString('ru-RU')}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function StatusChip({ label, on, danger }: { label: string; on: boolean; danger?: boolean }) {
  return (
    <View style={[styles.chip, on && (danger ? styles.chipDanger : styles.chipOn)]}>
      <Text style={[styles.chipText, on && (danger ? styles.chipDangerText : styles.chipTextOn)]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14, paddingBottom: 24 },
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
    backgroundColor: '#12101C',
    padding: 16,
    gap: 8,
  },
  heroKicker: { color: colors.violet, fontWeight: '800', letterSpacing: 2, fontSize: 11 },
  heroTitle: { color: colors.text, fontSize: 26, fontWeight: '800' },
  heroLead: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  cardTitle: { color: colors.text, fontWeight: '800', fontSize: 16 },
  meta: { color: colors.muted, fontSize: 13 },
  fieldLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0F141F',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  phrase: { minHeight: 88, textAlignVertical: 'top' },
  hint: { color: colors.faint, fontSize: 12, lineHeight: 18, marginTop: -4 },
  error: { color: colors.crimson, fontWeight: '700', fontSize: 13 },
  primary: {
    backgroundColor: colors.violet,
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: colors.white, fontWeight: '800' },
  ghost: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: { color: colors.muted, fontWeight: '800' },
  danger: {
    backgroundColor: colors.crimson,
    borderRadius: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerText: { color: colors.white, fontWeight: '800' },
  toggle: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F141F',
  },
  toggleOn: { backgroundColor: colors.violet, borderColor: colors.violet },
  toggleText: { color: colors.muted, fontWeight: '800', fontSize: 13 },
  toggleTextOn: { color: colors.white },
  weekRow: { flexDirection: 'row', gap: 4 },
  dayEdit: { flex: 1, alignItems: 'center', gap: 4 },
  dayLabel: { color: colors.faint, fontSize: 10, fontWeight: '800' },
  dayInput: {
    width: '100%',
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#0F141F',
    color: colors.text,
    textAlign: 'center',
    fontWeight: '800',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 34,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.crimson, borderColor: colors.crimson },
  chipDanger: { backgroundColor: colors.crimson, borderColor: colors.crimson },
  chipText: { color: colors.muted, fontWeight: '800', fontSize: 12 },
  chipTextOn: { color: colors.white },
  chipDangerText: { color: colors.white },
  history: { color: colors.muted, fontSize: 12, lineHeight: 18 },
});
