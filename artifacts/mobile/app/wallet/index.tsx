import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, Modal, Platform,
  FlatList, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useGetWallet, useTopupWallet, useListWalletTransactions,
  getGetWalletQueryKey, getListWalletTransactionsQueryKey, getGetDashboardQueryKey,
  getGetMeQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { formatNaira, formatDateTime } from '@/lib/format';

const TOPUP_AMOUNTS = [1000, 2000, 5000, 10000];
const PAYMENT_METHODS = ['Bank Transfer', 'Card', 'USSD'];

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useGetWallet();
  const { data: txns, isLoading: txnsLoading, isRefetching, refetch: refetchTxns } = useListWalletTransactions({});
  const topupMutation = useTopupWallet();

  const [showTopup, setShowTopup] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const effectiveAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) : null);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getGetWalletQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListWalletTransactionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  }

  function onRefresh() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    invalidate();
    refetchWallet();
    refetchTxns();
  }

  async function handleTopup() {
    if (!effectiveAmount || effectiveAmount < 100) { setError('Minimum top-up is ₦100'); return; }
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await topupMutation.mutateAsync({ data: { amount: effectiveAmount, paymentMethod } });
      invalidate();
      setSuccess(true);
      setSelectedAmount(null);
      setCustomAmount('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => { setSuccess(false); setShowTopup(false); }, 2000);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? 'Top-up failed';
      setError(msg);
    }
  }

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { paddingTop: Platform.OS === 'web' ? insets.top + 67 : 0 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 40) }]}
      >
        {/* Balance Card */}
        <View style={[s.balanceCard, { backgroundColor: colors.primary }]}>
          <Text style={[s.balanceLabel, { color: colors.primaryForeground + 'AA' }]}>Available Balance</Text>
          {walletLoading
            ? <ActivityIndicator color={colors.primaryForeground} style={{ marginVertical: 8 }} />
            : <Text style={[s.balanceAmount, { color: colors.primaryForeground }]}>{formatNaira(wallet?.balance ?? 0)}</Text>
          }
          <Pressable
            style={({ pressed }) => [s.topupBtn, { backgroundColor: colors.primaryForeground + '22', opacity: pressed ? 0.8 : 1 }]}
            onPress={() => setShowTopup(true)}
          >
            <Feather name="plus" size={18} color={colors.primaryForeground} />
            <Text style={[s.topupBtnText, { color: colors.primaryForeground }]}>Top Up Wallet</Text>
          </Pressable>
        </View>

        {/* Transactions */}
        <View style={s.txnsSection}>
          <Text style={[s.txnsTitle, { color: colors.foreground }]}>Transaction History</Text>
          {txnsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
          ) : (txns?.length ?? 0) === 0 ? (
            <View style={s.empty}>
              <Feather name="inbox" size={36} color={colors.mutedForeground} />
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No wallet transactions yet</Text>
            </View>
          ) : (
            txns!.map((t) => (
              <View key={t.id} style={[s.txnRow, { backgroundColor: colors.card }]}>
                <View style={[s.txnIcon, { backgroundColor: t.type === 'credit' ? colors.success + '15' : colors.destructive + '15' }]}>
                  <Feather name={t.type === 'credit' ? 'arrow-down-left' : 'arrow-up-right'} size={18} color={t.type === 'credit' ? colors.success : colors.destructive} />
                </View>
                <View style={s.txnInfo}>
                  <Text style={[s.txnDesc, { color: colors.foreground }]} numberOfLines={1}>{t.description}</Text>
                  <Text style={[s.txnDate, { color: colors.mutedForeground }]}>{formatDateTime(t.createdAt)}</Text>
                </View>
                <Text style={[s.txnAmount, { color: t.type === 'credit' ? colors.success : colors.destructive }]}>
                  {t.type === 'credit' ? '+' : '-'}{formatNaira(t.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Top-up Modal */}
      <Modal visible={showTopup} transparent animationType="slide" onRequestClose={() => setShowTopup(false)}>
        <Pressable style={s.modalOverlay} onPress={() => setShowTopup(false)} />
        <View style={[s.modalSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 }]}>
          <View style={[s.handle, { backgroundColor: colors.border }]} />
          <Text style={[s.modalTitle, { color: colors.foreground }]}>Top Up Wallet</Text>

          {success ? (
            <View style={s.successMsg}>
              <Feather name="check-circle" size={40} color={colors.success} />
              <Text style={[s.successText, { color: colors.success }]}>Wallet Topped Up!</Text>
            </View>
          ) : (
            <>
              <Text style={[s.sheetLabel, { color: colors.foreground }]}>Select Amount</Text>
              <View style={s.presets}>
                {TOPUP_AMOUNTS.map((amt) => (
                  <Pressable
                    key={amt}
                    style={({ pressed }) => [s.preset, { backgroundColor: selectedAmount === amt ? colors.primary : colors.secondary, borderColor: selectedAmount === amt ? colors.primary : colors.border, opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => { setSelectedAmount(amt); setCustomAmount(''); }}
                  >
                    <Text style={[s.presetText, { color: selectedAmount === amt ? colors.primaryForeground : colors.foreground }]}>{formatNaira(amt)}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={[s.customInput, { borderColor: customAmount ? colors.primary : colors.border, backgroundColor: colors.background }]}>
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

              <Text style={[s.sheetLabel, { color: colors.foreground, marginTop: 16 }]}>Payment Method</Text>
              <View style={s.methodRow}>
                {PAYMENT_METHODS.map((m) => (
                  <Pressable
                    key={m}
                    style={({ pressed }) => [s.methodOpt, { backgroundColor: paymentMethod === m ? colors.primary : colors.secondary, borderColor: paymentMethod === m ? colors.primary : colors.border, opacity: pressed ? 0.8 : 1 }]}
                    onPress={() => setPaymentMethod(m)}
                  >
                    <Text style={[s.methodText, { color: paymentMethod === m ? colors.primaryForeground : colors.foreground }]}>{m}</Text>
                  </Pressable>
                ))}
              </View>

              {error ? (
                <View style={[s.errorBox, { backgroundColor: colors.destructive + '15' }]}>
                  <Feather name="alert-circle" size={16} color={colors.destructive} />
                  <Text style={[s.errorText, { color: colors.destructive }]}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={({ pressed }) => [s.submitBtn, { backgroundColor: colors.primary, opacity: pressed || topupMutation.isPending ? 0.85 : 1 }]}
                onPress={handleTopup}
                disabled={topupMutation.isPending}
              >
                {topupMutation.isPending ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={[s.submitBtnText, { color: colors.primaryForeground }]}>Top Up {effectiveAmount ? formatNaira(effectiveAmount) : ''}</Text>}
              </Pressable>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 20 },
    balanceCard: { borderRadius: 20, padding: 24, marginTop: 16, marginBottom: 28, gap: 8 },
    balanceLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
    balanceAmount: { fontSize: 40, fontFamily: 'Inter_700Bold' },
    topupBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
    topupBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    txnsSection: { gap: 10 },
    txnsTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 6 },
    txnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 },
    txnIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    txnInfo: { flex: 1 },
    txnDesc: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 2 },
    txnDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
    txnAmount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
    empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
    emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingTop: 12 },
    handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 16 },
    sheetLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
    preset: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
    presetText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    customInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, height: 50, marginBottom: 4 },
    naira: { fontSize: 18, fontFamily: 'Inter_500Medium', marginRight: 4 },
    customInputText: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
    methodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    methodOpt: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
    methodText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
    errorBox: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10, borderRadius: 10, marginBottom: 12 },
    errorText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
    submitBtn: { height: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
    successMsg: { alignItems: 'center', gap: 12, paddingVertical: 32 },
    successText: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  });
}
