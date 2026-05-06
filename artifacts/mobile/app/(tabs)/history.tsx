import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, RefreshControl, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useListTokenTransactions, getListTokenTransactionsQueryKey,
  useListMeters,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { formatNaira, formatDateTime } from '@/lib/format';
import type { TokenTransaction } from '@workspace/api-client-react';

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedMeter, setSelectedMeter] = useState<number | undefined>(undefined);

  const { data: meters } = useListMeters();
  const { data: transactions, isLoading, isRefetching, refetch } = useListTokenTransactions(
    selectedMeter ? { meterId: selectedMeter } : {}
  );

  function onRefresh() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    queryClient.invalidateQueries({ queryKey: getListTokenTransactionsQueryKey() });
    refetch();
  }

  const s = makeStyles(colors);

  function renderItem({ item }: { item: TokenTransaction }) {
    return (
      <Pressable
        style={({ pressed }) => [s.card, { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 }]}
        onPress={() => router.push({ pathname: '/token-detail/[id]', params: { id: item.id } })}
      >
        <View style={[s.cardIcon, { backgroundColor: item.status === 'success' ? colors.success + '15' : colors.destructive + '15' }]}>
          <Feather name="zap" size={20} color={item.status === 'success' ? colors.success : colors.destructive} />
        </View>
        <View style={s.cardInfo}>
          <Text style={[s.cardMeter, { color: colors.foreground }]} numberOfLines={1}>{item.meterName}</Text>
          <Text style={[s.cardMeterNum, { color: colors.mutedForeground }]}>{item.meterNumber}</Text>
          <Text style={[s.cardDate, { color: colors.mutedForeground }]}>{formatDateTime(item.createdAt)}</Text>
        </View>
        <View style={s.cardRight}>
          <Text style={[s.cardAmount, { color: colors.foreground }]}>{formatNaira(item.amount)}</Text>
          {item.units != null && (
            <Text style={[s.cardUnits, { color: colors.mutedForeground }]}>{item.units.toFixed(2)} kWh</Text>
          )}
          <View style={[s.badge, { backgroundColor: item.status === 'success' ? colors.success + '20' : colors.destructive + '20' }]}>
            <Text style={[s.badgeText, { color: item.status === 'success' ? colors.success : colors.destructive }]}>
              {item.status}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={[s.title, { color: colors.foreground }]}>Purchase History</Text>
      </View>

      {/* Meter Filter */}
      {(meters?.length ?? 0) > 0 && (
        <View style={s.filterScroll}>
          <Pressable
            style={[s.filterChip, { backgroundColor: !selectedMeter ? colors.primary : colors.card, borderColor: !selectedMeter ? colors.primary : colors.border }]}
            onPress={() => setSelectedMeter(undefined)}
          >
            <Text style={[s.filterChipText, { color: !selectedMeter ? colors.primaryForeground : colors.foreground }]}>All</Text>
          </Pressable>
          {meters?.map((m) => (
            <Pressable
              key={m.id}
              style={[s.filterChip, { backgroundColor: selectedMeter === m.id ? colors.primary : colors.card, borderColor: selectedMeter === m.id ? colors.primary : colors.border }]}
              onPress={() => setSelectedMeter(m.id)}
            >
              <Text style={[s.filterChipText, { color: selectedMeter === m.id ? colors.primaryForeground : colors.foreground }]} numberOfLines={1}>
                {m.meterName}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1, alignSelf: 'center', marginTop: 60 }} />
      ) : (
        <FlatList
          data={transactions ?? []}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={[
            s.list,
            { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 100) }
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(transactions && transactions.length > 0)}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="file-text" size={40} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No transactions yet</Text>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>
                {selectedMeter ? 'No purchases for this meter' : 'Your token purchase history will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { fontSize: 26, fontFamily: 'Inter_700Bold' },
    filterScroll: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 16, flexWrap: 'wrap' },
    filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, maxWidth: 120 },
    filterChipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    list: { paddingHorizontal: 20, gap: 10 },
    card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14 },
    cardIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1 },
    cardMeter: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 2 },
    cardMeterNum: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 2 },
    cardDate: { fontSize: 11, fontFamily: 'Inter_400Regular' },
    cardRight: { alignItems: 'flex-end', gap: 3 },
    cardAmount: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
    cardUnits: { fontSize: 11, fontFamily: 'Inter_400Regular' },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    badgeText: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'capitalize' },
    empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
    emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
    emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
  });
}
