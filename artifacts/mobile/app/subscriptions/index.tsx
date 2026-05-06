import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Alert, Platform, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useListSubscriptions, useDeleteSubscription, useUpdateSubscription,
  getListSubscriptionsQueryKey, getGetDashboardQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { formatNaira, formatDate } from '@/lib/format';
import type { Subscription } from '@workspace/api-client-react';

export default function SubscriptionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: subs, isLoading } = useListSubscriptions();
  const deleteMutation = useDeleteSubscription();
  const updateMutation = useUpdateSubscription();

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: getListSubscriptionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
  }

  async function toggleActive(sub: Subscription) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateMutation.mutateAsync({ id: sub.id, data: { isActive: !sub.isActive } });
    invalidate();
  }

  function confirmDelete(sub: Subscription) {
    Alert.alert('Cancel Subscription', `Cancel auto-buy for "${sub.meterName}"?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Subscription', style: 'destructive', onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deleteMutation.mutateAsync({ id: sub.id });
          invalidate();
        }
      },
    ]);
  }

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }]}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={subs ?? []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(subs && subs.length > 0)}
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: colors.card }]}>
              <View style={s.cardTop}>
                <View style={[s.icon, { backgroundColor: item.isActive ? colors.primary + '15' : colors.muted }]}>
                  <Feather name="repeat" size={20} color={item.isActive ? colors.primary : colors.mutedForeground} />
                </View>
                <View style={s.info}>
                  <Text style={[s.meterName, { color: colors.foreground }]}>{item.meterName}</Text>
                  <Text style={[s.meterNum, { color: colors.mutedForeground }]}>{item.meterNumber}</Text>
                  <View style={s.metaRow}>
                    <Text style={[s.amount, { color: colors.primary }]}>{formatNaira(item.amount)}</Text>
                    <View style={[s.freqBadge, { backgroundColor: colors.secondary }]}>
                      <Text style={[s.freqText, { color: colors.secondaryForeground }]}>{item.frequency}</Text>
                    </View>
                  </View>
                  {item.nextRunDate && (
                    <Text style={[s.nextRun, { color: colors.mutedForeground }]}>
                      Next: {formatDate(item.nextRunDate)}
                    </Text>
                  )}
                </View>
                <Switch
                  value={item.isActive}
                  onValueChange={() => toggleActive(item)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.primaryForeground}
                />
              </View>
              <View style={[s.cardBottom, { borderTopColor: colors.border }]}>
                <Pressable
                  style={({ pressed }) => [s.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => confirmDelete(item)}
                >
                  <Feather name="trash-2" size={14} color={colors.destructive} />
                  <Text style={[s.deleteBtnText, { color: colors.destructive }]}>Cancel</Text>
                </Pressable>
                <View style={[s.statusDot, { backgroundColor: item.isActive ? colors.success : colors.mutedForeground }]} />
                <Text style={[s.statusText, { color: item.isActive ? colors.success : colors.mutedForeground }]}>
                  {item.isActive ? 'Active' : 'Paused'}
                </Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="repeat" size={40} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No subscriptions</Text>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Set up auto-buy to never run out of electricity</Text>
            </View>
          }
          ListFooterComponent={
            <Pressable
              style={({ pressed }) => [s.addBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => router.push('/subscriptions/add')}
            >
              <Feather name="plus" size={18} color={colors.primaryForeground} />
              <Text style={[s.addBtnText, { color: colors.primaryForeground }]}>New Subscription</Text>
            </Pressable>
          }
        />
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
    card: { borderRadius: 16, overflow: 'hidden' },
    cardTop: { flexDirection: 'row', gap: 14, padding: 16, alignItems: 'flex-start' },
    icon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    info: { flex: 1, gap: 4 },
    meterName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
    meterNum: { fontSize: 12, fontFamily: 'Inter_400Regular' },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    amount: { fontSize: 16, fontFamily: 'Inter_700Bold' },
    freqBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    freqText: { fontSize: 12, fontFamily: 'Inter_500Medium', textTransform: 'capitalize' },
    nextRun: { fontSize: 12, fontFamily: 'Inter_400Regular' },
    cardBottom: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
    deleteBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
    emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 14, marginHorizontal: 20, marginTop: 16 },
    addBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  });
}
