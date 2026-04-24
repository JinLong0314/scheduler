import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api, ApiError } from '../src/lib/api';
import { useAuthStore } from '../src/lib/auth-store';

interface LoginResponse {
  token: string;
  expiresAt: string;
  user: {
    id: string;
    email: string;
    displayName: string;
    role: 'admin' | 'user';
    themeId: string;
    timezone: string;
    locale: string;
  };
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const router = useRouter();

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        json: { email: email.trim(), password },
      });
      await setSession(res);
      router.replace('/(tabs)');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.code === 'INVALID_CREDENTIALS' ? '邮箱或密码错误' : `错误：${err.code}`);
      } else {
        setError('网络错误，请检查网络后重试');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.inner}
      >
        <View style={s.hero}>
          <Text style={s.brand}>Kairo</Text>
          <Text style={s.tagline}>恰当的时机，做对的事</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>登录</Text>
          <TextInput
            style={s.input}
            placeholder="邮箱"
            placeholderTextColor="#A1887F"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />
          <TextInput
            style={s.input}
            placeholder="密码"
            placeholderTextColor="#A1887F"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            returnKeyType="go"
            onSubmitEditing={handleLogin}
          />
          {error && <Text style={s.error}>{error}</Text>}
          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#FAF3E8" /> : <Text style={s.btnText}>登 录</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF3E8' },
  inner: { flex: 1, justifyContent: 'center', padding: 28 },
  hero: { alignItems: 'center', marginBottom: 40 },
  brand: { fontSize: 48, fontWeight: '700', color: '#5D4037', letterSpacing: -1 },
  tagline: { marginTop: 8, color: '#A1887F', fontSize: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#5D4037',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#3E2723', marginBottom: 18 },
  input: {
    borderWidth: 1,
    borderColor: '#E8DDD4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 12,
    color: '#3E2723',
    fontSize: 15,
    backgroundColor: '#FFFDF9',
  },
  error: { color: '#C62828', fontSize: 13, marginBottom: 10, textAlign: 'center' },
  btn: {
    backgroundColor: '#8B6F47',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FAF3E8', fontWeight: '700', fontSize: 15, letterSpacing: 1 },
});
