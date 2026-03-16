import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
  ScrollView, Animated, Platform, KeyboardAvoidingView, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, font } from '../utils/theme';
import { getTodayString } from '../utils/dateUtils';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initial?: any;
  defaultDate?: string;
}

const PRIORITIES = ['low', 'medium', 'high'] as const;
const PRIORITY_META: Record<string, { color: string; icon: string; label: string }> = {
  low:    { color: colors.success, icon: 'chevron-down-outline', label: 'Low' },
  medium: { color: colors.warning, icon: 'remove-outline',       label: 'Med' },
  high:   { color: colors.danger,  icon: 'chevron-up-outline',   label: 'High' },
};

export default function AddTodoModal({ visible, onClose, onSave, initial, defaultDate }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [hh, setHh] = useState('');
  const [mm, setMm] = useState('');
  const [scheduledDate, setScheduledDate] = useState(defaultDate || getTodayString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (visible) {
      if (initial) {
        setTitle(initial.title || '');
        setDescription(initial.description || '');
        setPriority(initial.priority || 'medium');
        const [h, m] = (initial.dueTime || '').split(':');
        setHh(h || '');
        setMm(m || '');
        setScheduledDate(initial.scheduledDate || defaultDate || getTodayString());
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        const now = new Date();
        setHh(String(now.getHours()).padStart(2, '0'));
        setMm(String(now.getMinutes()).padStart(2, '0'));
        setScheduledDate(defaultDate || getTodayString());
      }
      setError('');
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: Dimensions.get('window').height, duration: 250, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSave = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    
    // Format and validate time
    let finalHh = hh.padStart(2, '0');
    let finalMm = mm.padStart(2, '0');
    
    const hNum = parseInt(finalHh);
    const mNum = parseInt(finalMm);
    
    if (isNaN(hNum) || hNum < 0 || hNum > 23 || isNaN(mNum) || mNum < 0 || mNum > 59) {
      setError('Invalid 24h time format (0-23:0-59)');
      return;
    }

    const timeString = `${finalHh}:${finalMm}`;
    setSaving(true); setError('');
    try {
      await onSave({ 
        title: title.trim(), 
        description: description.trim(), 
        priority, 
        dueTime: timeString, 
        scheduledDate 
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.sheetContent}>
              <View style={styles.header}>
                <View>
                  <Text style={styles.title}>{initial ? 'Modify Task' : 'New Objective'}</Text>
                  <Text style={styles.subtitle}>Define your roadmap to success</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Ionicons name="close-outline" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>WHAT'S THE GOAL?</Text>
                  <TextInput
                    style={styles.mainInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="E.g., Complete Project Alpha"
                    placeholderTextColor={colors.textDim}
                    autoFocus={!initial}
                  />
                </View>

                <View style={styles.formSection}>
                  <Text style={styles.sectionLabel}>ADDITIONAL INTEL</Text>
                  <TextInput
                    style={[styles.mainInput, styles.descriptionInput]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Context, details, or steps..."
                    placeholderTextColor={colors.textDim}
                    multiline
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formSection, { flex: 1 }]}>
                    <Text style={styles.sectionLabel}>PRIORITY</Text>
                    <View style={styles.priorityGrid}>
                      {PRIORITIES.map(p => {
                        const meta = PRIORITY_META[p];
                        const active = priority === p;
                        return (
                          <TouchableOpacity
                            key={p}
                            style={[
                              styles.priorityChip,
                              { borderColor: active ? meta.color : colors.border },
                              active && { backgroundColor: meta.color + '15' }
                            ]}
                            onPress={() => setPriority(p)}
                          >
                            <Ionicons name={meta.icon as any} size={16} color={active ? meta.color : colors.textSecondary} />
                            <Text style={[styles.priorityText, active && { color: meta.color, fontWeight: '800' }]}>
                              {meta.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>

                <View style={[styles.formRow, { alignItems: 'flex-start' }]}>
                  <View style={[styles.formSection, { flex: 1 }]}>
                    <Text style={styles.sectionLabel}>DEADLINE</Text>
                    <View style={styles.iconInput}>
                      <Ionicons name="calendar-clear-outline" size={18} color={colors.primary} />
                      <TextInput
                        style={styles.inlineInput}
                        value={scheduledDate}
                        onChangeText={setScheduledDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textDim}
                      />
                    </View>
                  </View>
                  <View style={[styles.formSection, { flex: 1 }]}>
                    <Text style={styles.sectionLabel}>WINDOW (24H)</Text>
                    <View style={styles.clockPicker}>
                      <View style={styles.clockUnit}>
                        <TextInput
                          style={styles.clockInput}
                          value={hh}
                          onChangeText={(v) => setHh(v.replace(/[^0-9]/g, '').slice(0, 2))}
                          placeholder="HH"
                          placeholderTextColor={colors.textDim}
                          keyboardType="number-pad"
                        />
                      </View>
                      <Text style={styles.clockSeparator}>:</Text>
                      <View style={styles.clockUnit}>
                        <TextInput
                          style={styles.clockInput}
                          value={mm}
                          onChangeText={(v) => setMm(v.replace(/[^0-9]/g, '').slice(0, 2))}
                          placeholder="MM"
                          placeholderTextColor={colors.textDim}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </View>
                </View>

                {!!error && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="warning-outline" size={18} color={colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity 
                   onPress={handleSave} 
                   disabled={saving} 
                   activeOpacity={0.9} 
                   style={styles.submitBtn}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitGradient}
                  >
                    <Text style={styles.submitText}>
                      {saving ? 'MISSION LOADING...' : (initial ? 'CONFIRM CHANGES' : 'DEPLOY TASK')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                <View style={{ height: Platform.OS === 'ios' ? 120 : 60 }} />
              </ScrollView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  kav: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  sheetContent: {
    maxHeight: Dimensions.get('window').height * 0.9,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: font.sizes.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSection: {
    marginBottom: spacing.lg,
  },
  formRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  mainInput: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.sizes.md,
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    }),
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  priorityText: {
    fontSize: font.sizes.sm,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  inlineInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: font.sizes.md,
    color: colors.text,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    }),
  },
  clockPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clockUnit: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockInput: {
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    padding: 0,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    }),
  },
  clockSeparator: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 2,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.danger + '10',
    padding: 12,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  errorText: {
    color: colors.danger,
    fontSize: font.sizes.sm,
    fontWeight: '600',
  },
  submitBtn: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginTop: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: `0 8px 15px ${colors.primary}4D`, // 4D is ~0.3 opacity
      },
    }),
  },
  submitGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  dailyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgElevated,
    padding: 16,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  dailyToggleActive: {
    borderColor: colors.primary + '40',
    backgroundColor: colors.primary + '08',
  },
  dailyToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dailyToggleLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dailyToggleLabelActive: {
    color: colors.text,
  },
  dailyToggleSub: {
    fontSize: 11,
    color: colors.textDim,
    marginTop: 2,
  },
  switchTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: colors.primary,
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
});
