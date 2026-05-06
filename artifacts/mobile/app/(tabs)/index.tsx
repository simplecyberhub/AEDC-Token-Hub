import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGetDashboard, getGetDashboardQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { formatNaira, formatDateTime } from '@/lib/format';

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isRefetching } = useGetDashboard();

  const s = makeStyles(colors);

  function onRefresh() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    refetch();
  }

  return (
    <ScrollView
      style={[s.container]}
      contentContainerStyle={[
        s.scroll,
        { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 100) },
      ]}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Good day,</Text>
          <Text style={s.name}>{user?.name?.split(' ')[0] ?? 'User'}</Text>
        </View>
        <Pressable
          style={[s.notifBtn, { backgroundColor: colors.card }]}
          onPress={() => router.push('/meters')}
        >
          <Feather name="sliders" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Wallet Card */}
      <Pressable
        style={[s.walletCard, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/wallet')}
      >
        <View style={s.walletTop}>
          <Text style={[s.walletLabel, { color: colors.primaryForeground + 'BB' }]}>Wallet Balance</Text>
          <Feather name="chevron-right" size={18} color={colors.primaryForeground + 'BB'} />
        </View>
        <Text style={[s.walletAmount, { color: colors.primaryForeground }]}>
          {isLoading ? '—' : formatNaira(data?.walletBalance ?? 0)}
        </Text>
        <View style={s.walletBottom}>
          <View style={s.walletStat}>
            <Text style={[s.walletStatLabel, { color: colors.primaryForeground + '99' }]}>Total Spent</Text>
            <Text style={[s.walletStatValue, { color: colors.primaryForeground }]}>
              {isLoading ? '—' : formatNaira(data?.totalSpent ?? 0)}
            </Text>
          </View>
          <View style={s.walletStat}>
            <Text style={[s.walletStatLabel, { color: colors.primaryForeground + '99' }]}>Tokens Bought</Text>
            <Text style={[s.walletStatValue, { color: colors.primaryForeground }]}>
              {isLoading ? '—' : (data?.totalTokensPurchased ?? 0).toString()}
            </Text>
          </View>
          <View style={s.walletStat}>
            <Text style={[s.walletStatLabel, { color: colors.primaryForeground + '99' }]}>Auto-Buy</Text>
            <Text style={[s.walletStatValue, { color: colors.primaryForeground }]}>
              {isLoading ? '—' : (data?.activeSubscriptions ?? 0).toString()}
            </Text>
          </View>
        </View>
      </Pressable>

      {/* Quick Actions */}
      <View style={s.quickActions}>
        <Pressable style={({ pressed }) => [s.action, { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }]} onPress={() => router.push('/(tabs)/buy')}>
          <View style={[s.actionIcon, { backgroundColor: colors.primary + '15' }]}>
            <Feather name="zap" size={22} color={colors.primary} />
          </View>
          <Text style={[s.actionLabel, { color: colors.foreground }]}>Buy Token</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [s.action, { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }]} onPress={() => router.push('/wallet')}>
          <View style={[s.actionIcon, { backgroundColor: colors.accent + '15' }]}>
            <Feather name="plus-circle" size={22} color={colors.accent} />
          </View>
          <Text style={[s.actionLabel, { color: colors.foreground }]}>Top Up</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [s.action, { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }]} onPress={() => router.push('/meters')}>
          <View style={[s.actionIcon, { backgroundColor: colors.success + '15' }]}>
            <Feather name="cpu" size={22} color={colors.success} />
          </View>
          <Text style={[s.actionLabel, { color: colors.foreground }]}>My Meters</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [s.action, { backgroundColor: colors.card, opacity: pressed ? 0.8 : 1 }]} onPress={() => router.push('/subscriptions')}>
          <View style={[s.actionIcon, { backgroundColor: colors.secondary }]}>
            <Feather name="repeat" size={22} color={colors.secondaryForeground} />
          </View>
          <Text style={[s.actionLabel, { color: colors.foreground }]}>Auto-Buy</Text>
        </Pressable>
      </View>

      {/* Recent Transactions */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={[s.sectionTitle, { color: colors.foreground }]}>Recent Purchases</Text>
          <Pressable onPress={() => router.push('/(tabs)/history')}>
            <Text style={[s.seeAll, { color: colors.primary }]}>See all</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
        ) : isError ? (
          <View style={s.emptyState}>
            <Feather name="wifi-off" size={32} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Failed to load data</Text>
            <Pressable onPress={onRefresh} style={[s.retryBtn, { backgroundColor: colors.secondary }]}>
              <Text style={[s.retryText, { color: colors.primary }]}>Retry</Text>
            </Pressable>
          </View>
        ) : (data?.recentTransactions?.length ?? 0) === 0 ? (
          <View style={s.emptyState}>
            <Feather name="zap" size={32} color={colors.mutedForeground} />
            <Text style={[s.emptyText, { color: colors.mutedForeground }]}>No purchases yet</Text>
            <Text style={[s.emptySubText, { color: colors.mutedForeground }]}>Buy your first electricity token</Text>
          </View>
        ) : (
          data!.recentTransactions.map((t) => (
            <Pressable
              key={t.id}
              style={({ pressed }) => [s.txnRow, { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => router.push({ pathname: '/token-detail/[id]', params: { id: t.id } })}
            >
              <View style={[s.txnIcon, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="zap" size={18} color={colors.primary} />
              </View>
              <View style={s.txnInfo}>
                <Text style={[s.txnMeter, { color: colors.foreground }]} numberOfLines={1}>{t.meterName}</Text>
                <Text style={[s.txnDate, { color: colors.mutedForeground }]}>{formatDateTime(t.createdAt)}</Text>
              </View>
              <View style={s.txnRight}>
                <Text style={[s.txnAmount, { color: colors.foreground }]}>{formatNaira(t.amount)}</Text>
                <View style={[s.statusBadge, { backgroundColor: t.status === 'success' ? colors.success + '20' : colors.destructive + '20' }]}>
                  <Text style={[s.statusText, { color: t.status === 'success' ? colors.success : colors.destructive }]}>
                    {t.status}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    greeting: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.mutedForeground },
    name: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.foreground },
    notifBtn: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    walletCard: { borderRadius: 20, padding: 24, marginBottom: 24 },
    walletTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    walletLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
    walletAmount: { fontSize: 36, fontFamily: 'Inter_700Bold', marginBottom: 20 },
    walletBottom: { flexDirection: 'row', justifyContent: 'space-between' },
    walletStat: { alignItems: 'center' },
    walletStatLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', marginBottom: 2 },
    walletStatValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    quickActions: { flexDirection: 'row', gap: 12, marginBottom: 32 },
    action: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 8 },
    actionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    actionLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center' },
    section: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 17, fontFamily: 'Inter_600SemiBold' },
    seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
    emptyText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
    emptySubText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
    retryBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
    txnRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, marginBottom: 10 },
    txnIcon: { width: 42, height: 42, borderRadius: 21, justifyContent: 'center', alignItems: 'center' },
    txnInfo: { flex: 1 },
    txnMeter: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 2 },
    txnDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
    txnRight: { alignItems: 'flex-end', gap: 4 },
    txnAmount: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    statusText: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'capitalize' },
  });
}
