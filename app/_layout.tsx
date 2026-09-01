import 'react-native-gesture-handler';
import { DarkTheme, ThemeProvider, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { StreakFireModal } from '@/components/StreakBadge';
import { ScreenTimeLock } from '@/components/ScreenTimeLock';
import { AuthProvider, useAuth } from '@/src/auth';
import { EngineProvider, useEngine } from '@/src/store';
import { colors } from '@/src/theme';
import * as Linking from 'expo-linking';
import {
  addScreenTimeListener,
  consumePendingUnlock,
  isShielded,
} from '@/modules/life-engine-screentime';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'auth',
};

SplashScreen.preventAutoHideAsync();

const EngineTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.violet,
  },
};

function AuthGate({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const onAuth = segments[0] === 'auth';
    if (!user && !onAuth) router.replace('/auth');
    else if (user && onAuth) router.replace('/(tabs)');
  }, [ready, user, segments, router]);

  if (!ready) return null;
  return <>{children}</>;
}

function StreakHost() {
  const { state, dismissStreakCelebrate } = useEngine();
  if (!state.streakCelebrate) return null;
  return <StreakFireModal days={Math.max(1, state.visitStreak || 1)} onDismiss={dismissStreakCelebrate} />;
}

function ScreenTimeHost() {
  const { openScreenUnlock, setScreenNativeLocked } = useEngine();
  useEffect(() => {
    const open = (url?: string | null) => {
      if (url?.includes('screentime-unlock')) openScreenUnlock();
    };
    void Linking.getInitialURL().then(open);
    const sub = Linking.addEventListener('url', ({ url }) => open(url));
    const sync = async () => {
      if (await consumePendingUnlock()) openScreenUnlock();
      if (await isShielded()) setScreenNativeLocked(true);
    };
    void sync();
    const pending = addScreenTimeListener('onPendingUnlock', () => openScreenUnlock());
    const threshold = addScreenTimeListener('onThresholdReached', () => {
      setScreenNativeLocked(true);
      openScreenUnlock();
    });
    return () => {
      sub.remove();
      pending.remove();
      threshold.remove();
    };
  }, [openScreenUnlock, setScreenNativeLocked]);
  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
      <AuthProvider>
        <EngineProvider>
          <ThemeProvider value={EngineTheme}>
            <StatusBar style="light" />
            <AuthGate>
              <View style={{ flex: 1 }}>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: colors.bg },
                    animation: 'fade',
                  }}>
                  <Stack.Screen name="auth" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
                  <Stack.Screen name="secret" options={{ animation: 'fade', gestureEnabled: false }} />
                </Stack>
                <StreakHost />
                <ScreenTimeHost />
                <ScreenTimeLock />
              </View>
            </AuthGate>
          </ThemeProvider>
        </EngineProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
