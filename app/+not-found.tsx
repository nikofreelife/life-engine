import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/src/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Контур не найден</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Вернуться в Life Engine</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.bg,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  link: { marginTop: 16, paddingVertical: 12 },
  linkText: { fontSize: 14, color: colors.emerald, fontWeight: '700' },
});
