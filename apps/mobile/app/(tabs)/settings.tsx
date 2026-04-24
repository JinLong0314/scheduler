import {
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Download, ExternalLink } from 'lucide-react-native';
import { useAuthStore } from '../../src/lib/auth-store';

const API = 'https://kairo-api.jackie-macau.top';

const DOWNLOADS = [
  { id: 'android', label: '下载 Android APK', url: `${API}/mobile/download/android` },
  { id: 'windows', label: '下载 Windows (.exe)', url: `${API}/desktop/download/windows` },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const router = useRouter();

  async function handleLogout() {
    await clear();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.heading}>设置</Text>

        {/* Account info */}
        <View style={s.card}>
          <Text style={s.cardTitle}>账号</Text>
          <InfoRow label="邮箱" value={user?.email ?? '—'} />
          <InfoRow label="显示名称" value={user?.displayName ?? '—'} />
          <InfoRow label="角色" value={user?.role === 'admin' ? '管理员' : '普通用户'} />
        </View>

        {/* Download links */}
        <View style={s.card}>
          <Text style={s.cardTitle}>下载客户端</Text>
          {DOWNLOADS.map((d) => (
            <TouchableOpacity
              key={d.id}
              style={s.downloadRow}
              onPress={() => Linking.openURL(d.url)}
              activeOpacity={0.7}
            >
              <Download color="#8B6F47" size={16} />
              <Text style={s.downloadLabel}>{d.label}</Text>
              <ExternalLink color="#A1887F" size={14} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <LogOut color="#C62828" size={18} />
          <Text style={s.logoutText}>退出登录</Text>
        </TouchableOpacity>

        <Text style={s.version}>Kairo v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF3E8' },
  scroll: { padding: 16, paddingBottom: 40 },
  heading: { fontSize: 22, fontWeight: '700', color: '#3E2723', marginBottom: 18 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
    shadowColor: '#5D4037',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A1887F',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0E6DF',
  },
  rowLabel: { fontSize: 14, color: '#A1887F' },
  rowValue: {
    fontSize: 14,
    color: '#3E2723',
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0E6DF',
    gap: 10,
  },
  downloadLabel: { flex: 1, fontSize: 14, color: '#3E2723' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0EE',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  logoutText: { color: '#C62828', fontWeight: '700', fontSize: 15 },
  version: { textAlign: 'center', color: '#C1A99E', fontSize: 11, marginTop: 24 },
});
