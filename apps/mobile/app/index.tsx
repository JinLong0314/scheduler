import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.hero}>
        <Text style={styles.brand}>Kairo</Text>
        <Text style={styles.tagline}>恰当的时机，做对的事</Text>
      </View>
      <Text style={styles.note}>
        首次运行：请先执行 `pnpm --filter @kairo/mobile start` 并扫码连接 Expo Go。
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF3E8', padding: 24, justifyContent: 'center' },
  hero: { alignItems: 'center', marginBottom: 32 },
  brand: { fontSize: 42, fontWeight: '700', color: '#5D4037' },
  tagline: { marginTop: 8, color: '#A1887F' },
  note: { textAlign: 'center', color: '#A1887F', fontSize: 12 },
});
