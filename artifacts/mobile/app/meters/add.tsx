import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  TextInput, ActivityIndicator, Switch, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCreateMeter, getListMetersQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

const TARIFF_TYPES = ['prepaid', 'postpaid'];

export default function AddMeterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createMutation = useCreateMeter();

  const [form, setForm] = useState({ meterNumber: '', meterName: '', address: '', tariffType: 'prepaid', isDefault: false });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(key: string, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.meterNumber.trim()) e.meterNumber = 'Meter number is required';
    else if (!/^\d{10,13}$/.test(form.meterNumber.trim())) e.meterNumber = 'Enter a valid 10-13 digit meter number';
    if (!form.meterName.trim()) e.meterName = 'Meter nickname is required';
    if (!form.address.trim()) e.address = 'Address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await createMutation.mutateAsync({ data: { ...form, meterNumber: form.meterNumber.trim(), meterName: form.meterName.trim(), address: form.address.trim() } });
      queryClient.invalidateQueries({ queryKey: getListMetersQueryKey() });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? 'Failed to add meter';
      setErrors({ general: msg });
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
      {errors.general ? (
        <View style={[s.errorBanner, { backgroundColor: colors.destructive + '15' }]}>
          <Feather name="alert-circle" size={16} color={colors.destructive} />
          <Text style={[s.errorBannerText, { color: colors.destructive }]}>{errors.general}</Text>
        </View>
      ) : null}

      <View style={s.form}>
        {[
          { key: 'meterNumber', label: 'Meter Number', placeholder: 'e.g. 45012345678', keyboard: 'numeric' as const, icon: 'hash' },
          { key: 'meterName', label: 'Meter Nickname', placeholder: 'e.g. Home, Office', keyboard: 'default' as const, icon: 'tag' },
          { key: 'address', label: 'Address', placeholder: 'e.g. 12 Gana Street, Maitama', keyboard: 'default' as const, icon: 'map-pin' },
        ].map((field) => (
          <View key={field.key} style={s.field}>
            <Text style={[s.label, { color: colors.foreground }]}>{field.label}</Text>
            <View style={[s.inputWrap, { borderColor: errors[field.key] ? colors.destructive : colors.border, backgroundColor: colors.card }]}>
              <Feather name={field.icon as never} size={18} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: colors.foreground }]}
                placeholder={field.placeholder}
                placeholderTextColor={colors.mutedForeground}
                keyboardType={field.keyboard}
                autoCapitalize={field.key === 'meterNumber' ? 'none' : 'sentences'}
                value={form[field.key as keyof typeof form] as string}
                onChangeText={(t) => set(field.key, t)}
              />
            </View>
            {errors[field.key] ? <Text style={[s.fieldError, { color: colors.destructive }]}>{errors[field.key]}</Text> : null}
          </View>
        ))}

        <View style={s.field}>
          <Text style={[s.label, { color: colors.foreground }]}>Tariff Type</Text>
          <View style={s.tariffRow}>
            {TARIFF_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[s.tariffOption, { backgroundColor: form.tariffType === t ? colors.primary : colors.card, borderColor: form.tariffType === t ? colors.primary : colors.border }]}
                onPress={() => set('tariffType', t)}
              >
                <Text style={[s.tariffText, { color: form.tariffType === t ? colors.primaryForeground : colors.foreground }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[s.switchRow, { backgroundColor: colors.card }]}>
          <View style={s.switchInfo}>
            <Text style={[s.switchLabel, { color: colors.foreground }]}>Set as Default Meter</Text>
            <Text style={[s.switchSub, { color: colors.mutedForeground }]}>Use this meter by default when buying tokens</Text>
          </View>
          <Switch
            value={form.isDefault}
            onValueChange={(v) => set('isDefault', v)}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.primaryForeground}
          />
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [s.submitBtn, { backgroundColor: colors.primary, opacity: pressed || createMutation.isPending ? 0.85 : 1 }]}
        onPress={handleSubmit}
        disabled={createMutation.isPending}
      >
        {createMutation.isPending
          ? <ActivityIndicator color={colors.primaryForeground} />
          : <Text style={[s.submitBtnText, { color: colors.primaryForeground }]}>Add Meter</Text>}
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 20, paddingTop: 16 },
    errorBanner: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 16 },
    errorBannerText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
    form: { gap: 20, marginBottom: 28 },
    field: { gap: 6 },
    label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, height: 52 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular' },
    fieldError: { fontSize: 12, fontFamily: 'Inter_400Regular' },
    tariffRow: { flexDirection: 'row', gap: 10 },
    tariffOption: { flex: 1, height: 46, borderRadius: 10, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
    tariffText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 12, gap: 12 },
    switchInfo: { flex: 1 },
    switchLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
    switchSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
    submitBtn: { height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    submitBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  });
}
