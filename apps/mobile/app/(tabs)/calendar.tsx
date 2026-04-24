import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { api } from '../../src/lib/api';

interface EventItem {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  colorKey: string;
}

const COLOR_MAP: Record<string, string> = {
  accent: '#8B6F47',
  'event-1': '#1976D2',
  'event-2': '#388E3C',
  'event-3': '#F57C00',
  'event-4': '#7B1FA2',
  'event-5': '#C62828',
};

function formatMonthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
  });
}

function formatEventDate(startAt: string): string {
  return new Date(startAt).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatEventTime(e: EventItem): string {
  if (e.allDay) return '全天';
  const s = new Date(e.startAt);
  const t = new Date(e.endAt);
  const fmt = (d: Date) =>
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fmt(s)} – ${fmt(t)}`;
}

export default function CalendarScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const from = new Date(y, m, 1).toISOString();
    const to = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
    try {
      const res = await api<{ items: EventItem[] }>(
        `/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      );
      setEvents(res.items.sort((a, b) => a.startAt.localeCompare(b.startAt)));
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(year, month);
  }, [year, month, fetchEvents]);

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <SafeAreaView style={s.root}>
      {/* Month navigation */}
      <View style={s.header}>
        <TouchableOpacity onPress={prevMonth} style={s.arrowBtn}>
          <ChevronLeft color="#8B6F47" size={22} />
        </TouchableOpacity>
        <Text style={s.monthLabel}>{formatMonthLabel(year, month)}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.arrowBtn}>
          <ChevronRight color="#8B6F47" size={22} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color="#8B6F47" size="large" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>本月暂无日程</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View
                style={[s.colorBar, { backgroundColor: COLOR_MAP[item.colorKey] ?? '#8B6F47' }]}
              />
              <View style={s.cardBody}>
                <Text style={s.eventTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={s.eventMeta}>
                  {formatEventDate(item.startAt)} · {formatEventTime(item)}
                </Text>
                {item.description ? (
                  <Text style={s.eventDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF3E8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD4',
  },
  arrowBtn: { padding: 10 },
  monthLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#3E2723',
  },
  listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 20 },
  empty: { alignItems: 'center', marginTop: 64 },
  emptyText: { fontSize: 15, color: '#A1887F' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#5D4037',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  colorBar: { width: 4 },
  cardBody: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: '#3E2723' },
  eventMeta: { fontSize: 12, color: '#A1887F', marginTop: 4 },
  eventDesc: { fontSize: 12, color: '#6D4C41', marginTop: 4, lineHeight: 17 },
});
