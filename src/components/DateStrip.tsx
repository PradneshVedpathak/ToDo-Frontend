import React, { useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated, Platform, Dimensions,
} from 'react-native';
import { colors, radius, spacing, font } from '../utils/theme';
import { getDateRange, getTodayString } from '../utils/dateUtils';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  selectedDate: string;
  onSelect: (date: string) => void;
}

const DAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function DateItem({
  dateStr, isSelected, isToday, onPress,
}: {
  dateStr: string; isSelected: boolean; isToday: boolean; onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(isSelected ? 1 : 0.6)).current;
  const d = new Date(dateStr + 'T00:00:00');

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.1 : 1,
        useNativeDriver: true,
        damping: 12, stiffness: 150,
      }),
      Animated.timing(opacityAnim, {
        toValue: isSelected ? 1 : 0.6,
        duration: 250, useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.itemWrapper}>
      <Animated.View style={[
        styles.dateItem,
        { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
        isSelected && styles.dateItemSelected
      ]}>
        {isSelected && (
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}
        <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
          {DAY_SHORT[d.getDay()].toUpperCase()}
        </Text>
        <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
          {d.getDate()}
        </Text>
        {isToday && !isSelected && (
          <View style={styles.todayIndicator} />
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ITEM_WIDTH = 77; // 65 (width) + 12 (gap)

export default function DateStrip({ selectedDate, onSelect }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const dates = Array.from({ length: 30 }, (_, i) => getDateRange(i - 10));
  const today = getTodayString();

  useEffect(() => {
    const idx = dates.indexOf(selectedDate);
    if (idx !== -1 && scrollRef.current) {
      const timer = setTimeout(() => {
        // Center the item: (Index * Width) - (ScreenCenter) + (ItemCenter)
        const offset = (idx * ITEM_WIDTH) - (SCREEN_WIDTH / 2) + (ITEM_WIDTH / 2);
        scrollRef.current?.scrollTo({ 
          x: Math.max(0, offset), 
          animated: true 
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        snapToInterval={77}
        decelerationRate="fast"
      >
        {dates.map(d => (
          <DateItem
            key={d}
            dateStr={d}
            isSelected={d === selectedDate}
            isToday={d === today}
            onPress={() => onSelect(d)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  strip: {
    paddingHorizontal: spacing.lg,
    gap: 12,
  },
  itemWrapper: {
    width: 65,
    height: 85,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dateItemSelected: {
    borderColor: colors.primaryGlow,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: `0 4px 8px ${colors.primary}66`, // 66 is ~0.4 opacity
      },
    }),
  },
  dayLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 1,
  },
  dayLabelSelected: {
    color: 'rgba(255,255,255,0.7)',
  },
  dateNum: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textSecondary,
  },
  dateNumSelected: {
    color: colors.white,
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
});
