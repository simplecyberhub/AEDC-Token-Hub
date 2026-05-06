import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Platform, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useGetTokenTransaction } from '@workspace/api-client-react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { formatNaira, formatDateTime } from '@/lib/format';

export default function TokenDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const numId = parseInt(id ?? '0', 10);

  const { data: txn, isLoading, isError } = useGetTokenTransaction(numId, {
    query: { enabled: !!numId },
  });

  const s = makeStyles(colors);

  async function copyToken() {
    if (!txn?.token) return;
    await Clipboard.setStringAsync(txn.token);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function shareToken() {
    if (!txn?.token) return;
    try {
      await Share.share({
        message: `AEDC Electricity Token\nMeter: ${txn.meterNumber}\nToken: ${txn.token}\nUnits: ${txn.units?.toFixed(2) ?? '—'} kWh\nAmount: ${formatNaira(txn.amount)}`,
      });
    } catch {}
  }

  return (
    <ScrollView
      style={[s.container]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + 16 + (Platform.OS === 'web' ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40) }]}
      showsVerticalScrollIndicator={false}
    >
      <Pressable style={s.backBtn} onPress={() => router.back()}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>
      <Text style={[s.pageTitle, { color: colors.foreground }]}>Token Detail</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : isError || !txn ? (
        <View style={s.errorState}>
          <Feather name="alert-circle" size={36} color={colors.destructive} />
          <Text style={[s.errorText, { color: colors.mutedForeground }]}>Transaction not found</Text>
          <Pressable onPress={() => router.back()} style={[s.backBtnSmall, { backgroundColor: colors.secondary }]}>
            <Text style={[{ color: colors.primary, fontFamily: 'Inter_500Medium', fontSize: 14 }]}>Go Back</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Status Banner */}
          <View style={[s.statusBanner, { backgroundColor: txn.status === 'success' ? colors.success + '15' : colors.destructive + '15' }]}>
            <Feather name={txn.status === 'success' ? 'check-circle' : 'x-circle'} size={20} color={txn.status === 'success' ? colors.success : colors.destructive} />
            <Text style={[s.statusText, { color: txn.status === 'success' ? colors.success : colors.destructive }]}>
              {txn.status === 'success' ? 'Purchase Successful' : 'Purchase Failed'}
            </Text>
          </View>

          {/* Token Display */}
          {txn.token && (
            <View style={[s.tokenCard, { backgroundColor: colors.primary }]}>
              <Text style={[s.tokenLabel, { color: colors.primaryForeground + 'AA' }]}>Your Token Code</Text>
              <Text style={[s.tokenCode, { color: colors.primaryForeground }]}>{txn.token}</Text>
              <Text style={[s.tokenHint, { color: colors.primaryForeground + '88' }]}>Enter this code on your prepaid meter</Text>
              <View style={s.tokenActions}>
                <Pressable style={({ pressed }) => [s.tokenBtn, { backgroundColor: colors.primaryForeground + '20', opacity: pressed ? 0.7 : 1 }]} onPress={copyToken}>
                  <Feather name="copy" size={16} color={colors.primaryForeground} />
                  <Text style={[s.tokenBtnText, { color: colors.primaryForeground }]}>Copy</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [s.tokenBtn, { backgroundColor: colors.primaryForeground + '20', opacity: pressed ? 0.7 : 1 }]} onPress={shareToken}>
                  <Feather name="share-2" size={16} color={colors.primaryForeground} />
                  <Text style={[s.tokenBtnText, { color: colors.primaryForeground }]}>Share</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Details */}
          <View style={[s.detailCard, { backgroundColor: colors.card }]}>
            {[
              { label: 'Meter Name', value: txn.meterName },
              { label: 'Meter Number', value: txn.meterNumber },
              { label: 'Amount Paid', value: formatNaira(txn.amount) },
              { label: 'Units', value: txn.units != null ? `${txn.units.toFixed(2)} kWh` : '—' },
              { label: 'Reference', value: txn.reference },
              { label: 'Date', value: formatDateTime(txn.createdAt) },
              { label: 'Status', value: txn.status },
            ].map((row, i, arr) => (
              <View key={row.label} style={[s.detailRow, i < arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : {}]}>
                <Text style={[s.detailLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[s.detailValue, { color: colors.foreground }]}>{row.value}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 20 },
    backBtn: { width: 42, height: 42, justifyContent: 'center', marginBottom: 8 },
    pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 20 },
    errorState: { alignItems: 'center', paddingTop: 60, gap: 12 },
    errorText: { fontSize: 16, fontFamily: 'Inter_400Regular' },
    backBtnSmall: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 20 },
    statusText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
    tokenCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 20, gap: 12 },
    tokenLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
    tokenCode: { fontSize: 22, fontFamily: 'Inter_700Bold', letterSpacing: 2, textAlign: 'center' },
    tokenHint: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
    tokenActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
    tokenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
    tokenBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
    detailCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    detailLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
    detailValue: { fontSize: 14, fontFamily: 'Inter_500Medium', textAlign: 'right', maxWidth: '60%' },
  });
}
