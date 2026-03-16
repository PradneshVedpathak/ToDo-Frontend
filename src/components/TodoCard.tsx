import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing, font } from '../utils/theme';
import { Todo } from '../context/TodoContext';
import { formatTime, isOverdue } from '../utils/dateUtils';

interface Props {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  low: colors.success,
  medium: colors.warning,
  high: colors.danger,
};

const PRIORITY_ICON: Record<string, string> = {
  low: 'chevron-down',
  medium: 'reorder-two',
  high: 'chevron-up',
};

export default function TodoCard({ todo, onToggle, onDelete, onEdit }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(todo.completed ? 1 : 0)).current;

  const handleToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    Animated.timing(checkAnim, {
      toValue: todo.completed ? 0 : 1, duration: 250, useNativeDriver: false,
    }).start();
    onToggle();
  };

  const overdue = !todo.completed && isOverdue(todo.scheduledDate, todo.dueTime);
  const priorityColor = PRIORITY_COLOR[todo.priority] || colors.warning;
  const priorityIcon = PRIORITY_ICON[todo.priority] || 'reorder-two';

  const checkBorderColor = checkAnim.interpolate({
    inputRange: [0, 1], outputRange: [colors.borderLight, colors.primary],
  });
  const checkBg = checkAnim.interpolate({
    inputRange: [0, 1], outputRange: ['transparent', colors.primary],
  });

  return (
    <Animated.View style={[
      styles.container, 
      { transform: [{ scale: scaleAnim }] }, 
      todo.completed && styles.containerDone,
      !todo.completed && { borderColor: colors.primaryGlow }
    ]}>
      {/* Visual Priority Accent */}
      <View style={[styles.priorityLine, { backgroundColor: priorityColor }]} />

      <TouchableOpacity style={styles.checkArea} onPress={handleToggle} activeOpacity={0.7}>
        <Animated.View style={[styles.checkCircle, { borderColor: checkBorderColor, backgroundColor: checkBg }]}>
          {todo.completed && (
            <Ionicons name="checkmark-sharp" size={16} color={colors.white} />
          )}
        </Animated.View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.mainContent} onPress={onEdit} activeOpacity={0.8}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, todo.completed && styles.titleDone]} numberOfLines={2}>
            {todo.title}
          </Text>
          {!!todo.description && (
            <Text style={styles.description} numberOfLines={1}>{todo.description}</Text>
          )}
        </View>

        <View style={styles.footer}>
          {todo.dueTime ? (
            <View style={[styles.badge, overdue && styles.badgeOverdue]}>
              <Ionicons
                name="time-outline" size={12}
                color={overdue ? colors.danger : colors.textSecondary}
              />
              <Text style={[styles.badgeText, overdue && styles.badgeTextOverdue]}>
                {formatTime(todo.dueTime)}
              </Text>
            </View>
          ) : null}
          
          <View style={[styles.badge, { borderColor: priorityColor + '30' }]}>
            <Ionicons name={priorityIcon as any} size={12} color={priorityColor} />
            <Text style={[styles.badgeText, { color: priorityColor }]}>
              {todo.priority.toUpperCase()}
            </Text>
          </View>

          {todo.isDaily && (
            <View style={[styles.badge, { borderColor: colors.secondary + '30' }]}>
              <Ionicons name="repeat" size={12} color={colors.secondary} />
              <Text style={[styles.badgeText, { color: colors.secondary }]}>DAILY</Text>
            </View>
          )}

          {todo.completed && (
            <View style={[styles.badge, { borderColor: colors.success + '30' }]}>
              <Ionicons name="checkmark-done" size={12} color={colors.success} />
              <Text style={[styles.badgeText, { color: colors.success }]}>COMPLETED</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteArea} onPress={onDelete} activeOpacity={1.5}>
        <Ionicons name="trash-bin-outline" size={22} color={colors.danger} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: `0 4px 10px ${colors.primary}1A`, // 1A is ~0.1 opacity
      },
    }),
    overflow: 'hidden',
    minHeight: 100, // Larger card
  },
  containerDone: {
    opacity: 0.5,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  priorityLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  checkArea: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContent: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  textContainer: {
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: font.sizes.lg,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 24,
  },
  titleDone: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
    fontWeight: '400',
  },
  description: {
    fontSize: font.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgElevated,
  },
  badgeOverdue: {
    borderColor: colors.danger + '40',
    backgroundColor: colors.danger + '10',
  },
  badgeText: {
    fontSize: font.sizes.xs,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeTextOverdue: {
    color: colors.danger,
  },
  deleteArea: {
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
