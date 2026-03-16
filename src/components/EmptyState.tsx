import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, font, radius } from '../utils/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface Props { message?: string; }

export default function EmptyState({ message = 'No missions detected' }: Props) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -15, duration: 2500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconWrap, { transform: [{ translateY: floatAnim }, { scale: pulseAnim }] }]}>
        <LinearGradient
          colors={[colors.bgElevated, colors.bgCard]}
          style={styles.iconRing}
        >
          <Ionicons name="sparkles-outline" size={54} color={colors.primary} />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.title}>{message}</Text>
      <Text style={styles.sub}>The horizon is clear. Add an objective to begin.</Text>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 80, paddingBottom: 40,
  },
  iconWrap: { marginBottom: spacing.xl },
  iconRing: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 1.5, borderColor: colors.primaryGlow,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 25,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: `0 0 25px ${colors.primary}4D`, // 4D is ~0.3 opacity
      },
    }),
  },
  title: {
    fontSize: 22, fontWeight: '900',
    color: colors.text, marginBottom: 10,
    letterSpacing: -0.5,
  },
  sub: { 
    fontSize: font.sizes.md, 
    color: colors.textSecondary, 
    textAlign: 'center', 
    maxWidth: 250,
    lineHeight: 22,
    marginBottom: 24,
  },
});
