import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react-native';
import { api, ApiError } from '../../src/lib/api';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  scheduledDate: string;
  parentId: string | null;
  rollover: boolean;
  orderIndex: number;
  version: number;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(date: string, delta: number): string {
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}

function formatDate(d: string): string {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
}

export default function TodosScreen() {
  const [date, setDate] = useState(todayStr());
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchTodos = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await api<{ items: TodoItem[] }>(`/todos?date=${d}`);
      setTodos(res.items);
    } catch {
      setTodos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos(date);
  }, [date, fetchTodos]);

  async function toggleTodo(t: TodoItem) {
    // Optimistic update
    setTodos((prev) =>
      prev.map((item) => (item.id === t.id ? { ...item, completed: !item.completed } : item)),
    );
    try {
      const updated = await api<TodoItem>(`/todos/${t.id}`, {
        method: 'PATCH',
        json: { completed: !t.completed, version: t.version },
      });
      setTodos((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      // Revert optimistic update
      setTodos((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, completed: t.completed } : item)),
      );
      if (err instanceof ApiError && err.code === 'CHILDREN_INCOMPLETE') {
        alert('请先完成所有子任务');
      }
    }
  }

  async function addTodo() {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const created = await api<TodoItem>('/todos', {
        method: 'POST',
        json: { title, scheduledDate: date, rollover: true },
      });
      setTodos((prev) => [...prev, created]);
      setNewTitle('');
    } catch {
      alert('添加失败，请重试');
    } finally {
      setAdding(false);
    }
  }

  const done = todos.filter((t) => t.completed).length;
  const total = todos.length;
  const isToday = date === todayStr();

  return (
    <SafeAreaView style={s.root}>
      {/* Date navigation */}
      <View style={s.dateRow}>
        <TouchableOpacity onPress={() => setDate((d) => addDays(d, -1))} style={s.arrowBtn}>
          <ChevronLeft color="#8B6F47" size={22} />
        </TouchableOpacity>
        <View style={s.dateCenter}>
          <Text style={s.dateText}>{formatDate(date)}</Text>
          {!isToday && (
            <TouchableOpacity onPress={() => setDate(todayStr())}>
              <Text style={s.todayLink}>回到今天</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setDate((d) => addDays(d, 1))} style={s.arrowBtn}>
          <ChevronRight color="#8B6F47" size={22} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={s.statsRow}>
        <Text style={s.statsText}>
          {done} / {total} 已完成
        </Text>
        {total > 0 && done === total && <Text style={s.allDone}>全部完成 ✓</Text>}
      </View>

      {/* Todo list */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color="#8B6F47" size="large" />
      ) : (
        <FlatList
          data={todos}
          keyExtractor={(t) => t.id}
          contentContainerStyle={s.listContent}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={s.emptyText}>今日无待办 ✦</Text>
              <Text style={s.emptyHint}>在下方输入新任务</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => toggleTodo(item)}
              style={({ pressed }) => [
                s.todoItem,
                item.completed && s.todoItemDone,
                pressed && s.todoItemPressed,
              ]}
            >
              <View style={[s.checkbox, item.completed && s.checkboxDone]}>
                {item.completed && <Check color="#FAF3E8" size={13} strokeWidth={3} />}
              </View>
              <Text style={[s.todoTitle, item.completed && s.todoTitleDone]} numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
          )}
        />
      )}

      {/* Add todo input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={s.addBar}
      >
        <TextInput
          style={s.addInput}
          placeholder="添加待办…"
          placeholderTextColor="#C1A99E"
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={addTodo}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[s.addBtn, adding && s.addBtnDisabled]}
          onPress={addTodo}
          disabled={adding}
          activeOpacity={0.8}
        >
          {adding ? (
            <ActivityIndicator color="#FAF3E8" size="small" />
          ) : (
            <Plus color="#FAF3E8" size={22} />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF3E8' },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DDD4',
  },
  arrowBtn: { padding: 10 },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateText: { fontSize: 16, fontWeight: '600', color: '#3E2723' },
  todayLink: { fontSize: 11, color: '#8B6F47', marginTop: 3 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsText: { fontSize: 12, color: '#A1887F' },
  allDone: { fontSize: 12, color: '#558B2F', fontWeight: '600' },
  listContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 80 },
  empty: { alignItems: 'center', marginTop: 64 },
  emptyText: { fontSize: 16, color: '#A1887F', fontWeight: '500' },
  emptyHint: { marginTop: 6, fontSize: 12, color: '#C1A99E' },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: '#5D4037',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  todoItemDone: { opacity: 0.5 },
  todoItemPressed: { opacity: 0.7 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#D7C9BE',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#8B6F47', borderColor: '#8B6F47' },
  todoTitle: { flex: 1, fontSize: 15, color: '#3E2723', lineHeight: 21 },
  todoTitleDone: { textDecorationLine: 'line-through', color: '#A1887F' },
  addBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8DDD4',
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8DDD4',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#3E2723',
    backgroundColor: '#FFFDF9',
    marginRight: 8,
  },
  addBtn: {
    backgroundColor: '#8B6F47',
    borderRadius: 10,
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.6 },
});
