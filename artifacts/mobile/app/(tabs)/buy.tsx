import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, Modal, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  useListMeters, usePurchaseToken,
  getGetDashboardQueryKey, getListTokenTransactionsQueryKey, getGetWalletQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { formatNaira } from '@/lib/format';
import type { Meter, TokenTransaction } from '@workspace/api-client-react';

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export default function BuyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: meters, isLoading: metersLoading } = useListMeters();
  const purchaseMutation = usePurchaseToken();

  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [showMeterPicker, setShowMeterPicker] = useState(false);
  const [result, setResult] = useState<TokenTransaction | null>(null);
  const [error, setError] = useState('');

  const effectiveAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : null);

  async function handlePurchase() {
    if (!selectedMeter || !effectiveAmount || effectiveAmount < 500) {
      setError(
        !selectedMeter ? 'Please select a meter' :
        !effectiveAmount ? 'Please enter an amount' :
        'Minimum amount is ₦500'
      );
      return;
    }
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const txn = await purchaseMutation.mutateAsync({ data: { meterId: selectedMeter.id, amount: effectiveAmount } });
      setResult(txn);
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListTokenTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? 'Purchase failed. Check your wallet balance.';
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function resetForm() {
    setResult(null);
    setSelectedMeter(null);
    setSelectedAmount(null);
    setCustomAmount('');
    setError('');
  }

  const s = makeStyles(colors);

  if (result) {
    return (
      <View style={[s.successScreen, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 20), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 100) }]}>
        <View style={[s.successIcon, { backgroundColor: colors.success + '20' }]}>
          <Feather name="check-circle" size={52} color={colors.success} />
        </View>
        <Text style={[s.successTitle, { color: colors.foreground }]}>Token Generated!</Text>
        <Text style={[s.successSub, { color: colors.mutedForeground }]}>
          {result.units?.toFixed(2)} units for {result.meterName}
        </Text>

        <Pressable
          style={[s.tokenBox, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={async () => {
            if (result.token) {
              await Clipboard.setStringAsync(result.token);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }}
        >
          <Text style={[s.tokenCode, { color: colors.primary }]}>{result.token}</Text>
          <View style={s.copyHint}>
            <Feather name="copy" size={14} color={colors.mutedForeground} />
            <Text style={[s.copyHintText, { color: colors.mutedForeground }]}>Tap to copy</Text>
          </View>
        </Pressable>

        <View style={s.receiptRow}>
          <Text style={[s.receiptLabel, { color: colors.mutedForeground }]}>Amount paid</Text>
          <Text style={[s.receiptValue, { color: colors.foreground }]}>{formatNaira(result.amount)}</Text>
        </View>
        <View style={s.receiptRow}>
          <Text style={[s.receiptLabel, { color: colors.mutedForeground }]}>Reference</Text>
          <Text style={[s.receiptValue, { color: colors.foreground }]}>{result.reference}</Text>
        </View>
        <View style={s.receiptRow}>
          <Text style={[s.receiptLabel, { color: colors.mutedForeground }]}>Meter</Text>
          <Text style={[s.receiptValue, { color: colors.foreground }]}>{result.meterNumber}</Text>
        </View>

        <View style={s.successActions}>
          <Pressable style={({ pressed }) => [s.primaryBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]} onPress={resetForm}>
            <Text style={[s.primaryBtnText, { color: colors.primaryForeground }]}>Buy Another</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [s.outlineBtn, { borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]} onPress={() => router.push('/(tabs)/history')}>
            <Text style={[s.outlineBtnText, { color: colors.foreground }]}>View History</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.container]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 100) }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.pageTitle, { color: colors.foreground }]}>Buy Electricity</Text>
      <Text style={[s.pageSub, { color: colors.mutedForeground }]}>Purchase prepaid meter tokens instantly</Text>

      {/* Meter Selection */}
      <View style={s.section}>
        <Text style={[s.sectionLabel, { color: colors.foreground }]}>Select Meter</Text>
        {metersLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
        ) : (meters?.length ?? 0) === 0 ? (
          <Pressable style={[s.addMeterCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push('/meters/add')}>
            <Feather name="plus-circle" size={22} color={colors.primary} />
            <Text style={[s.addMeterText, { color: colors.primary }]}>Add a Meter</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[s.meterSelector, { backgroundColor: colors.card, borderColor: selectedMeter ? colors.primary : colors.border }]}
            onPress={() => setShowMeterPicker(true)}
          >
            {selectedMeter ? (
              <View style={s.meterSelectorInner}>
                <View style={[s.meterDot, { backgroundColor: colors.primary + '20' }]}>
                  <Feather name="cpu" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.meterName, { color: colors.foreground }]}>{selectedMeter.meterName}</Text>
                  <Text style={[s.meterNum, { color: colors.mutedForeground }]}>{selectedMeter.meterNumber}</Text>
                </View>
                <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
              </View>
            ) : (
              <View style={s.meterSelectorInner}>
                <Feather name="cpu" size={18} color={colors.mutedForeground} />
                <Text style={[s.meterPlaceholder, { color: colors.mutedForeground, marginLeft: 10 }]}>Choose a meter</Text>
                <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
              </View>
            )}
          </Pressable>
        )}
      </View>

      {/* Amount Selection */}
      <View style={s.section}>
        <Text style={[s.sectionLabel, { color: colors.foreground }]}>Amount (NGN)</Text>
        <View style={s.presets}>
          {PRESET_AMOUNTS.map((amt) => (
            <Pressable
              key={amt}
              style={({ pressed }) => [
                s.preset,
                {
                  backgroundColor: selectedAmount === amt ? colors.primary : colors.card,
                  borderColor: selectedAmount === amt ? colors.primary : colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              onPress={() => {
                setSelectedAmount(amt);
                setCustomAmount('');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[s.presetText, { color: selectedAmount === amt ? colors.primaryForeground : colors.foreground }]}>
                {formatNaira(amt)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={[s.customInput, { borderColor: customAmount && !selectedAmount ? colors.primary : colors.border, backgroundColor: colors.card }]}>
          <Text style={[s.nairaSign, { color: colors.mutedForeground }]}>₦</Text>
          <TextInput
            style={[s.customInputText, { color: colors.foreground }]}
            placeholder="Custom amount"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={customAmount}
            onChangeText={(t) => {
              setCustomAmount(t);
              setSelectedAmount(null);
            }}
          />
        </View>
      </View>

      {/* Summary */}
      {selectedMeter && effectiveAmount ? (
        <View style={[s.summary, { backgroundColor: colors.secondary }]}>
          <View style={s.summaryRow}>
            <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Meter</Text>
            <Text style={[s.summaryValue, { color: colors.foreground }]}>{selectedMeter.meterName}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Amount</Text>
            <Text style={[s.summaryValue, { color: colors.foreground }]}>{formatNaira(effectiveAmount)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={[s.summaryLabel, { color: colors.mutedForeground }]}>Est. Units</Text>
            <Text style={[s.summaryValue, { color: colors.primary }]}>{((effectiveAmount / 1000) * 70).toFixed(2)} kWh</Text>
          </View>
        </View>
      ) : null}

      {error ? (
        <View style={[s.errorBox, { backgroundColor: colors.destructive + '15' }]}>
          <Feather name="alert-circle" size={16} color={colors.destructive} />
          <Text style={[s.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed }) => [s.purchaseBtn, { backgroundColor: colors.primary, opacity: pressed || purchaseMutation.isPending ? 0.85 : 1 }]}
        onPress={handlePurchase}
        disabled={purchaseMutation.isPending}
      >
        {purchaseMutation.isPending
          ? <ActivityIndicator color={colors.primaryForeground} />
          : (
            <View style={s.purchaseBtnInner}>
              <Feather name="zap" size={20} color={colors.primaryForeground} />
              <Text style={[s.purchaseBtnText, { color: colors.primaryForeground }]}>Purchase Token</Text>
            </View>
          )}
      </Pressable>

      {/* Meter Picker Modal */}
      <Modal visible={showMeterPicker} transparent animationType="slide" onRequestClose={() => setShowMeterPicker(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowMeterPicker(false)} />
        <View style={[s.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 20 }]}>
          <View style={[s.modalHandle, { backgroundColor: colors.border }]} />
          <Text style={[s.modalTitle, { color: colors.foreground }]}>Select Meter</Text>
          {meters?.map((m) => (
            <Pressable
              key={m.id}
              style={({ pressed }) => [s.meterOption, { backgroundColor: selectedMeter?.id === m.id ? colors.primary + '10' : 'transparent', opacity: pressed ? 0.8 : 1 }]}
              onPress={() => { setSelectedMeter(m); setShowMeterPicker(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <View style={[s.meterDot, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="cpu" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.meterOptionName, { color: colors.foreground }]}>{m.meterName}</Text>
                <Text style={[s.meterOptionNum, { color: colors.mutedForeground }]}>{m.meterNumber} · {m.tariffType}</Text>
              </View>
              {selectedMeter?.id === m.id && <Feather name="check" size={18} color={colors.primary} />}
            </Pressable>
          ))}
          <Pressable style={[s.addMoreBtn, { borderColor: colors.border }]} onPress={() => { setShowMeterPicker(false); router.push('/meters/add'); }}>
            <Feather name="plus" size={16} color={colors.primary} />
            <Text style={[s.addMoreText, { color: colors.primary }]}>Add New Meter</Text>
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 20 },
    successScreen: { flex: 1, backgroundColor: colors.background, alignItems: 'center', paddingHorizontal: 24 },
    successIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    successTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 8 },
    successSub: { fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 32 },
    tokenBox: { width: '100%', borderRadius: 16, borderWidth: 2, padding: 20, alignItems: 'center', marginBottom: 24, gap: 8 },
    tokenCode: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 2, textAlign: 'center' },
    copyHint: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    copyHintText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
    receiptRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    receiptLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
    receiptValue: { fontSize: 14, fontFamily: 'Inter_500Medium' },
    successActions: { width: '100%', gap: 12, marginTop: 24 },
    primaryBtn: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    primaryBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
    outlineBtn: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
    outlineBtnText: { fontSize: 16, fontFamily: 'Inter_500Medium' },
    pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 4 },
    pageSub: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 32 },
    section: { marginBottom: 28 },
    sectionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 12 },
    addMeterCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed' },
    addMeterText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
    meterSelector: { borderWidth: 1.5, borderRadius: 12, padding: 16 },
    meterSelectorInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    meterDot: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    meterName: { fontSize: 15, fontFamily: 'Inter_500Medium' },
    meterNum: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
    meterPlaceholder: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
    preset: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5 },
    presetText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    customInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, height: 52 },
    nairaSign: { fontSize: 18, fontFamily: 'Inter_500Medium', marginRight: 4 },
    customInputText: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
    summary: { borderRadius: 14, padding: 16, gap: 10, marginBottom: 20 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
    summaryValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 16 },
    errorText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
    purchaseBtn: { height: 58, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    purchaseBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    purchaseBtnText: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
    modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 16 },
    meterOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, marginBottom: 4 },
    meterOptionName: { fontSize: 15, fontFamily: 'Inter_500Medium' },
    meterOptionNum: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
    addMoreBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: 12, padding: 14, marginTop: 8 },
    addMoreText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  });
}
