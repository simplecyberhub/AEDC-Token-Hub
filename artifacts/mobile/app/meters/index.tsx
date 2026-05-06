import React from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useListMeters, useDeleteMeter, useUpdateMeter,
  getListMetersQueryKey, getGetDashboardQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import type { Meter } from '@workspace/api-client-react';

export default function MetersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: meters, isLoading } = useListMeters();
  const deleteMutation = useDeleteMeter();
  const updateMutation = useUpdateMeter();

  function confirmDelete(meter: Meter) {
    Alert.alert('Delete Meter', `Remove "${meter.meterName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await deleteMutation.mutateAsync({ id: meter.id });
          queryClient.invalidateQueries({ queryKey: getListMetersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        }
      },
    ]);
  }

  async function setDefault(meter: Meter) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateMutation.mutateAsync({ id: meter.id, data: { isDefault: true } });
    queryClient.invalidateQueries({ queryKey: getListMetersQueryKey() });
  }

  const s = makeStyles(colors);

  return (
    <View style={[s.container, { paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }]}>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={meters ?? []}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!(meters && meters.length > 0)}
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: colors.card }]}>
              <View style={s.cardTop}>
                <View style={[s.cardIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="cpu" size={22} color={colors.primary} />
                </View>
                <View style={s.cardInfo}>
                  <View style={s.nameRow}>
                    <Text style={[s.meterName, { color: colors.foreground }]}>{item.meterName}</Text>
                    {item.isDefault && (
                      <View style={[s.defaultBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[s.defaultBadgeText, { color: colors.success }]}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.meterNum, { color: colors.mutedForeground }]}>{item.meterNumber}</Text>
                  <Text style={[s.meterAddr, { color: colors.mutedForeground }]} numberOfLines={1}>{item.address}</Text>
                </View>
              </View>
              <View style={[s.tariffRow, { borderTopColor: colors.border }]}>
                <View style={[s.tariffBadge, { backgroundColor: colors.secondary }]}>
                  <Text style={[s.tariffText, { color: colors.secondaryForeground }]}>{item.tariffType}</Text>
                </View>
                <View style={s.actions}>
                  {!item.isDefault && (
                    <Pressable
                      style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
                      onPress={() => setDefault(item)}
                    >
                      <Text style={[s.actionBtnText, { color: colors.primary }]}>Set Default</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.destructive + '15', opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => confirmDelete(item)}
                  >
                    <Feather name="trash-2" size={14} color={colors.destructive} />
                  </Pressable>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={s.empty}>
              <Feather name="cpu" size={40} color={colors.mutedForeground} />
              <Text style={[s.emptyTitle, { color: colors.foreground }]}>No meters added</Text>
              <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Add your electricity meter to start buying tokens</Text>
            </View>
          }
          ListFooterComponent={
            <Pressable
              style={({ pressed }) => [s.addBtn, { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => router.push('/meters/add')}
            >
              <Feather name="plus" size={18} color={colors.primaryForeground} />
              <Text style={[s.addBtnText, { color: colors.primaryForeground }]}>Add New Meter</Text>
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
    cardTop: { flexDirection: 'row', gap: 14, padding: 16 },
    cardIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    cardInfo: { flex: 1, gap: 3 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    meterName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
    defaultBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    defaultBadgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
    meterNum: { fontSize: 13, fontFamily: 'Inter_400Regular' },
    meterAddr: { fontSize: 12, fontFamily: 'Inter_400Regular' },
    tariffRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
    tariffBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    tariffText: { fontSize: 12, fontFamily: 'Inter_500Medium', textTransform: 'capitalize' },
    actions: { flexDirection: 'row', gap: 8 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
    actionBtnText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
    empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
    emptyTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginTop: 8 },
    emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingHorizontal: 40 },
    addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 54, borderRadius: 14, marginHorizontal: 20, marginTop: 16 },
    addBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  });
}
