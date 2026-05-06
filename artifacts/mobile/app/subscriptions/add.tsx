import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, Modal, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useListMeters, useCreateSubscription, getListSubscriptionsQueryKey, getGetDashboardQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { formatNaira } from '@/lib/format';
import type { Meter } from '@workspace/api-client-react';

const FREQUENCIES = [
  { label: 'Daily', value: 'daily', icon: 'sun' as const },
  { label: 'Weekly', value: 'weekly', icon: 'calendar' as const },
  { label: 'Monthly', value: 'monthly', icon: 'repeat' as const },
];
const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export default function AddSubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: meters, isLoading: metersLoading } = useListMeters();
  const createMutation = useCreateSubscription();

  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [frequency, setFrequency] = useState('monthly');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showMeterPicker, setShowMeterPicker] = useState(false);
  const [error, setError] = useState('');

  const effectiveAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : null);

  async function handleSubmit() {
    if (!selectedMeter) { setError('Please select a meter'); return; }
    if (!effectiveAmount || effectiveAmount < 500) { setError('Minimum amount is ₦500'); return; }
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await createMutation.mutateAsync({ data: { meterId: selectedMeter.id, amount: effectiveAmount, frequency } });
      queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? 'Failed to create subscription';
      setError(msg);
    }
  }

  const s = makeStyles(colors);

  return (
    <ScrollView
      style={[s.container]}
      contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40) }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Meter */}
      <View style={s.section}>
        <Text style={[s.sectionLabel, { color: colors.foreground }]}>Select Meter</Text>
        {metersLoading ? <ActivityIndicator color={colors.primary} /> : (
          <Pressable
            style={[s.selector, { backgroundColor: colors.card, borderColor: selectedMeter ? colors.primary : colors.border }]}
            onPress={() => setShowMeterPicker(true)}
          >
            {selectedMeter ? (
              <View style={s.selectorInner}>
                <View style={[s.selectorIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="cpu" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.selectorName, { color: colors.foreground }]}>{selectedMeter.meterName}</Text>
                  <Text style={[s.selectorSub, { color: colors.mutedForeground }]}>{selectedMeter.meterNumber}</Text>
                </View>
                <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
              </View>
            ) : (
              <View style={s.selectorInner}>
                <Feather name="cpu" size={18} color={colors.mutedForeground} />
                <Text style={[s.selectorPlaceholder, { color: colors.mutedForeground }]}>Choose a meter</Text>
                <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* Frequency */}
      <View style={s.section}>
        <Text style={[s.sectionLabel, { color: colors.foreground }]}>Frequency</Text>
        <View style={s.freqRow}>
          {FREQUENCIES.map((f) => (
            <Pressable
              key={f.value}
              style={({ pressed }) => [
                s.freqOption,
                { backgroundColor: frequency === f.value ? colors.primary : colors.card, borderColor: frequency === f.value ? colors.primary : colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => { setFrequency(f.value); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Feather name={f.icon} size={18} color={frequency === f.value ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[s.freqLabel, { color: frequency === f.value ? colors.primaryForeground : colors.foreground }]}>{f.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Amount */}
      <View style={s.section}>
        <Text style={[s.sectionLabel, { color: colors.foreground }]}>Amount per Purchase</Text>
        <View style={s.presets}>
          {PRESET_AMOUNTS.map((amt) => (
            <Pressable
              key={amt}
              style={({ pressed }) => [
                s.preset,
                { backgroundColor: selectedAmount === amt ? colors.primary : colors.card, borderColor: selectedAmount === amt ? colors.primary : colors.border, opacity: pressed ? 0.8 : 1 },
              ]}
              onPress={() => { setSelectedAmount(amt); setCustomAmount(''); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[s.presetText, { color: selectedAmount === amt ? colors.primaryForeground : colors.foreground }]}>
                {formatNaira(amt)}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={[s.customInput, { borderColor: customAmount ? colors.primary : colors.border, backgroundColor: colors.card }]}>
          <Text style={[s.naira, { color: colors.mutedForeground }]}>₦</Text>
          <TextInput
            style={[s.customInputText, { color: colors.foreground }]}
            placeholder="Custom amount"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={customAmount}
            onChangeText={(t) => { setCustomAmount(t); setSelectedAmount(null); }}
          />
        </View>
      </View>

      {error ? (
        <View style={[s.errorBox, { backgroundColor: colors.destructive + '15' }]}>
          <Feather name="alert-circle" size={16} color={colors.destructive} />
          <Text style={[s.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      ) : null}

      {selectedMeter && effectiveAmount ? (
        <View style={[s.summary, { backgroundColor: colors.secondary }]}>
          <Text style={[s.summaryTitle, { color: colors.foreground }]}>Summary</Text>
          <View style={s.summaryRow}><Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Meter</Text><Text style={[s.summaryValue, { color: colors.foreground }]}>{selectedMeter.meterName}</Text></View>
          <View style={s.summaryRow}><Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Amount</Text><Text style={[s.summaryValue, { color: colors.foreground }]}>{formatNaira(effectiveAmount)}</Text></View>
          <View style={s.summaryRow}><Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Frequency</Text><Text style={[s.summaryValue, { color: colors.foreground }]}>{FREQUENCIES.find((f) => f.value === frequency)?.label}</Text></View>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [s.submitBtn, { backgroundColor: colors.primary, opacity: pressed || createMutation.isPending ? 0.85 : 1 }]}
        onPress={handleSubmit}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[s.submitBtnText, { color: colors.primaryForeground }]}>Create Subscription</Text>}
      </Pressable>

      {/* Meter Modal */}
      <Modal visible={showMeterPicker} transparent animationType="slide" onRequestClose={() => setShowMeterPicker(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowMeterPicker(false)} />
        <View style={[s.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={[s.handle, { backgroundColor: colors.border }]} />
          <Text style={[s.modalTitle, { color: colors.foreground }]}>Select Meter</Text>
          {(meters ?? []).map((m) => (
            <Pressable
              key={m.id}
              style={({ pressed }) => [s.meterOpt, { backgroundColor: selectedMeter?.id === m.id ? colors.primary + '10' : 'transparent', opacity: pressed ? 0.8 : 1 }]}
              onPress={() => { setSelectedMeter(m); setShowMeterPicker(false); }}
            >
              <View style={[s.selectorIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="cpu" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.selectorName, { color: colors.foreground }]}>{m.meterName}</Text>
                <Text style={[s.selectorSub, { color: colors.mutedForeground }]}>{m.meterNumber}</Text>
              </View>
              {selectedMeter?.id === m.id && <Feather name="check" size={18} color={colors.primary} />}
            </Pressable>
          ))}
        </View>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 20, paddingTop: 16 },
    section: { marginBottom: 28 },
    sectionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
    selector: { borderWidth: 1.5, borderRadius: 12, padding: 16 },
    selectorInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    selectorIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    selectorName: { fontSize: 15, fontFamily: 'Inter_500Medium' },
    selectorSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
    selectorPlaceholder: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', marginLeft: 8 },
    freqRow: { flexDirection: 'row', gap: 10 },
    freqOption: { flex: 1, borderRadius: 12, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 6 },
    freqLabel: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
    preset: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5 },
    presetText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    customInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, height: 52 },
    naira: { fontSize: 18, fontFamily: 'Inter_500Medium', marginRight: 4 },
    customInputText: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
    errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 16 },
    errorText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
    summary: { borderRadius: 14, padding: 16, gap: 10, marginBottom: 20 },
    summaryTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
    summaryValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    submitBtn: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 16 },
    meterOpt: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, marginBottom: 4 },
  });
}
