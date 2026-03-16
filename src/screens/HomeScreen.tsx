import React, { useState, useRef, useCallback, useEffect, useMemo, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Animated, StatusBar, Platform, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTodo, Todo } from '../context/TodoContext';
import TodoCard from '../components/TodoCard';
import DateStrip from '../components/DateStrip';
import AddTodoModal from '../components/AddTodoModal';
import PendingModal from '../components/PendingModal';
import EmptyState from '../components/EmptyState';
import { colors, spacing, font, radius } from '../utils/theme';
import { getTodayString } from '../utils/dateUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';

const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function getOrdinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function LiveClock() {
  const [time, setTime] = useState(() => new Date());
  const dotAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');

  return (
    <View style={styles.clockContainer}>
      <Text style={styles.clockDigit}>{hh}</Text>
      <Animated.Text style={[styles.clockSeparator, { opacity: dotAnim }]}>:</Animated.Text>
      <Text style={styles.clockDigit}>{mm}</Text>
      <View style={styles.secondsContainer}>
        <Text style={styles.clockSeconds}>{ss}</Text>
      </View>
    </View>
  );
}

type TabType = 'pending' | 'done' | 'total';

export default function HomeScreen() {
  const {
    todos, pendingPrevious, selectedDate, loading,
    setSelectedDate, fetchTodos, createTodo, updateTodo, deleteTodo,
    toggleComplete, moveToToday, showPendingModal, setShowPendingModal,
  } = useTodo();

  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [addVisible, setAddVisible] = useState(false);
  const [editTodo, setEditTodo] = useState<Todo | null>(null);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const filteredTodos = useMemo(() => {
    let list = todos;
    if (activeTab === 'pending') list = todos.filter(t => !t.completed);
    else if (activeTab === 'done') list = todos.filter(t => t.completed);

    // High > Medium > Low sorting
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return [...list].sort((a, b) => {
      const weightA = priorityWeight[a.priority] || 0;
      const weightB = priorityWeight[b.priority] || 0;
      if (weightA !== weightB) return weightB - weightA;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [todos, activeTab]);

  const stats = useMemo(() => ({
    pending: todos.filter(t => !t.completed).length,
    done: todos.filter(t => t.completed).length,
    total: todos.length,
  }), [todos]);

  useEffect(() => {
    const targetValue = activeTab === 'pending' ? 0 : activeTab === 'done' ? 1 : 2;
    Animated.spring(tabIndicatorAnim, {
      toValue: targetValue,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
  }, [activeTab]);

  // Reset to pending when date changes
  useEffect(() => {
    setActiveTab('pending');
  }, [selectedDate]);

  const handleFabPress = () => setAddVisible(true);
  const handleEdit = (todo: Todo) => {
    setEditTodo(todo);
    setAddVisible(true);
  };

  const now = new Date();
  const dayName = DAY_NAMES[now.getDay()];
  const dateDisplay = `${getOrdinal(now.getDate())} ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const renderTab = (type: TabType, label: string, count: number) => {
    const active = activeTab === type;
    return (
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => setActiveTab(type)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
        <View style={[styles.tabBadge, active && styles.tabBadgeActive]}>
          <Text style={[styles.tabBadgeText, active && styles.tabBadgeTextActive]}>{count}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const tabWidth = (SCREEN_WIDTH - spacing.lg * 2) / 3;
  const indicatorTranslateX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.dateInfo}>
              <Text style={styles.dayName}>{dayName}</Text>
              <Text style={styles.dateFull}>{dateDisplay}</Text>
            </View>
            <LiveClock />
          </View>

          {pendingPrevious.length > 0 && (
            <TouchableOpacity 
              style={styles.overdueAlert} 
              onPress={() => setShowPendingModal(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.danger, '#991b1b']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.overdueGradient}
              >
                <Ionicons name="warning" size={16} color={colors.white} />
                <Text style={styles.overdueText}>{pendingPrevious.length} OVERDUE TASKS</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.white} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          <DateStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
        </View>

        {/* Tab System */}
        <View style={styles.tabContainer}>
          <View style={styles.tabBackground}>
            <Animated.View style={[
              styles.tabIndicator, 
              { 
                width: tabWidth - 8,
                transform: [{ translateX: indicatorTranslateX }] 
              }
            ]} />
            <View style={styles.tabContent}>
              {renderTab('pending', 'Pending', stats.pending)}
              {renderTab('done', 'Done', stats.done)}
              {renderTab('total', 'Total', stats.total)}
            </View>
          </View>
        </View>

        {/* Task List */}
        <FlatList
          data={filteredTodos}
          keyExtractor={item => item._id}
          contentContainerStyle={[
            styles.listContent,
            IS_WEB && styles.webList
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => fetchTodos(selectedDate)}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TodoCard
              todo={item}
              onToggle={() => toggleComplete(item._id)}
              onDelete={() => deleteTodo(item._id)}
              onEdit={() => handleEdit(item)}
            />
          )}
          ListEmptyComponent={!loading ? <EmptyState message={`No ${activeTab} tasks found`} /> : null}
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      </SafeAreaView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleFabPress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={styles.fabGradient}
        >
          <Ionicons name="add-sharp" size={32} color={colors.white} />
        </LinearGradient>
      </TouchableOpacity>

      <AddTodoModal
        visible={addVisible}
        onClose={() => { setAddVisible(false); setEditTodo(null); }}
        onSave={async (data) => {
          if (editTodo) await updateTodo(editTodo._id, data);
          else await createTodo(data);
        }}
        initial={editTodo}
        defaultDate={selectedDate}
      />

      <PendingModal
        visible={showPendingModal}
        todos={pendingPrevious}
        onClose={() => setShowPendingModal(false)}
        onMoveSelected={moveToToday}
        onMoveAll={() => moveToToday(pendingPrevious.map(t => t._id))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.md,
    backgroundColor: colors.bg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  dateInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
  },
  dateFull: {
    fontSize: font.sizes.md,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  clockContainer: {
    alignItems: 'flex-end',
    backgroundColor: colors.bgElevated,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 2,
  },
  clockDigit: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    fontVariant: ['tabular-nums'],
  },
  clockSeparator: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  secondsContainer: {
    marginLeft: 4,
    marginBottom: 2,
  },
  clockSeconds: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
  },
  overdueAlert: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    overflow: 'hidden',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  overdueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  overdueText: {
    flex: 1,
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Tab System
  tabContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  tabBackground: {
    height: 54,
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.borderLight,
    position: 'relative',
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      web: {
        boxShadow: `0 4px 8px ${colors.primary}4D`, // 4D is ~0.3 opacity
      },
    }),
  },
  tabContent: {
    flex: 1,
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    zIndex: 1,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.white,
  },
  tabBadge: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  tabBadgeTextActive: {
    color: colors.white,
  },

  // List
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  webList: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: `0 10px 15px ${colors.primary}66`, // 66 is ~0.4 opacity
      },
    }),
  },
  fabGradient: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});
