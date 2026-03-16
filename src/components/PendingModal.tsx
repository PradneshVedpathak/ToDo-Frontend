import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal,
  FlatList, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, font } from '../utils/theme';
import { Todo } from '../context/TodoContext';
import { formatDate } from '../utils/dateUtils';

interface Props {
  visible: boolean;
  todos: Todo[];
  onClose: () => void;
  onMoveSelected: (ids: string[]) => Promise<void>;
  onMoveAll: () => Promise<void>;
}

const PRIORITY_COLORS = { low: colors.priorityLow, medium: colors.priorityMedium, high: colors.priorityHigh };

export default function PendingModal({ visible, todos, onClose, onMoveSelected, onMoveAll }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelected(new Set());
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 180 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === todos.length) setSelected(new Set());
    else setSelected(new Set(todos.map(t => t._id)));
  };

  const handleMoveSelected = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    await onMoveSelected(Array.from(selected));
    setLoading(false);
    if (selected.size === todos.length) onClose();
  };

  const handleMoveAll = async () => {
    setLoading(true);
    await onMoveAll();
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.iconWrap}>
            <LinearGradient colors={[colors.danger, '#CC3333']} style={styles.iconCircle}>
              <Ionicons name="alert-circle" size={28} color={colors.white} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>Pending from Previous Days</Text>
          <Text style={styles.subtitle}>
            You have {todos.length} unfinished task{todos.length !== 1 ? 's' : ''}. Move them to today?
          </Text>

          <TouchableOpacity onPress={selectAll} style={styles.selectAllBtn}>
            <Ionicons
              name={selected.size === todos.length ? 'checkbox' : 'square-outline'}
              size={16} color={colors.primary}
            />
            <Text style={styles.selectAllText}>
              {selected.size === todos.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>

          <FlatList
            data={todos}
            keyExtractor={t => t._id}
            style={styles.list}
            scrollEnabled={todos.length > 4}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.item, selected.has(item._id) && styles.itemSelected]}
                onPress={() => toggleSelect(item._id)}
                activeOpacity={0.7}
              >
                <View style={[styles.itemDot, { backgroundColor: PRIORITY_COLORS[item.priority] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemDate}>{formatDate(item.scheduledDate)}</Text>
                </View>
                <Ionicons
                  name={selected.has(item._id) ? 'checkmark-circle' : 'ellipse-outline'}
                  size={20} color={selected.has(item._id) ? colors.primary : colors.textDim}
                />
              </TouchableOpacity>
            )}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { opacity: selected.size === 0 ? 0.4 : 1 }]}
              onPress={handleMoveSelected}
              disabled={loading || selected.size === 0}
            >
              <LinearGradient colors={[colors.primary, colors.primaryLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionBtnGrad}>
                <Text style={styles.actionBtnText}>
                  {loading ? '...' : `Move Selected (${selected.size})`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.moveAllBtn} onPress={handleMoveAll} disabled={loading}>
              <Text style={styles.moveAllText}>Move All to Today</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={onClose}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.lg,
    width: '100%', maxWidth: 420, borderWidth: 1, borderColor: colors.border,
  },
  iconWrap: { alignItems: 'center', marginBottom: spacing.md },
  iconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: font.sizes.xl, fontWeight: font.weights.bold, color: colors.text, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: font.sizes.sm, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md },
  selectAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, marginBottom: 4 },
  selectAllText: { fontSize: font.sizes.sm, color: colors.primary, fontWeight: font.weights.medium },
  list: { maxHeight: 240, marginBottom: spacing.md },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: 6,
    backgroundColor: colors.bgElevated,
  },
  itemSelected: { borderColor: colors.primary, backgroundColor: colors.primaryGlow },
  itemDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  itemTitle: { fontSize: font.sizes.md, color: colors.text, fontWeight: font.weights.medium },
  itemDate: { fontSize: font.sizes.xs, color: colors.textDim, marginTop: 2 },
  actions: { gap: spacing.sm },
  actionBtn: { borderRadius: radius.lg, overflow: 'hidden' },
  actionBtnGrad: { paddingVertical: spacing.sm + 4, alignItems: 'center' },
  actionBtnText: { fontSize: font.sizes.md, fontWeight: font.weights.bold, color: colors.white },
  moveAllBtn: {
    paddingVertical: spacing.sm + 4, alignItems: 'center', borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bgElevated,
  },
  moveAllText: { fontSize: font.sizes.md, color: colors.text, fontWeight: font.weights.medium },
  dismissBtn: { paddingVertical: 10, alignItems: 'center' },
  dismissText: { fontSize: font.sizes.md, color: colors.textDim },
});
