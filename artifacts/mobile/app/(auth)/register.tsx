import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRegister } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const registerMutation = useRegister();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[0-9+\s-]{10,15}$/.test(form.phone.trim())) e.phone = 'Enter a valid phone number';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await registerMutation.mutateAsync({
        data: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password },
      });
      queryClient.clear();
      await login(result.token, result.user);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? 'Registration failed. Try again.';
      setErrors({ general: msg });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  const s = makeStyles(colors);

  const fields: { key: keyof typeof form; label: string; placeholder: string; icon: string; keyboard?: 'email-address' | 'phone-pad'; auto?: 'name' | 'email' | 'tel' | 'password'; secure?: boolean }[] = [
    { key: 'name', label: 'Full name', placeholder: 'John Doe', icon: 'user', auto: 'name' },
    { key: 'email', label: 'Email address', placeholder: 'you@example.com', icon: 'mail', keyboard: 'email-address', auto: 'email' },
    { key: 'phone', label: 'Phone number', placeholder: '0801 234 5678', icon: 'phone', keyboard: 'phone-pad', auto: 'tel' },
    { key: 'password', label: 'Password', placeholder: '••••••••', icon: 'lock', secure: true, auto: 'password' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={[s.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable style={s.back} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>

        <Text style={s.title}>Create account</Text>
        <Text style={s.subtitle}>Join AEDC Pay and manage your electricity effortlessly</Text>

        {errors.general ? (
          <View style={s.errorBanner}>
            <Feather name="alert-circle" size={16} color={colors.destructive} />
            <Text style={[s.errorBannerText, { color: colors.destructive }]}>{errors.general}</Text>
          </View>
        ) : null}

        <View style={s.form}>
          {fields.map((f) => (
            <View key={f.key} style={s.field}>
              <Text style={s.label}>{f.label}</Text>
              <View style={[s.inputWrap, errors[f.key] ? { borderColor: colors.destructive } : {}]}>
                <Feather name={f.icon as never} size={18} color={colors.mutedForeground} style={s.inputIcon} />
                <TextInput
                  style={[s.input, f.key !== 'password' ? {} : { flex: 1 }]}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType={f.keyboard}
                  autoCapitalize={f.key === 'email' ? 'none' : 'words'}
                  secureTextEntry={f.secure && !showPassword}
                  autoComplete={f.auto as never}
                  value={form[f.key]}
                  onChangeText={(t) => set(f.key, t)}
                />
                {f.secure ? (
                  <Pressable onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
                  </Pressable>
                ) : null}
              </View>
              {errors[f.key] ? <Text style={[s.fieldError, { color: colors.destructive }]}>{errors[f.key]}</Text> : null}
            </View>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [s.btn, { backgroundColor: colors.primary, opacity: pressed || registerMutation.isPending ? 0.85 : 1 }]}
          onPress={handleRegister}
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending
            ? <ActivityIndicator color={colors.primaryForeground} />
            : <Text style={[s.btnText, { color: colors.primaryForeground }]}>Create Account</Text>}
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/login')} style={s.switchRow}>
          <Text style={[s.switchText, { color: colors.mutedForeground }]}>
            Already have an account?{' '}
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Sign In</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 24, paddingBottom: 40 },
    back: { marginTop: 16, marginBottom: 24, width: 40, height: 40, justifyContent: 'center' },
    title: { fontSize: 28, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 8 },
    subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.mutedForeground, marginBottom: 32 },
    errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.destructive + '15', borderRadius: 10, padding: 12, marginBottom: 16 },
    errorBannerText: { fontSize: 14, fontFamily: 'Inter_400Regular', flex: 1 },
    form: { gap: 20, marginBottom: 32 },
    field: { gap: 6 },
    label: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.foreground },
    inputWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, backgroundColor: colors.card, paddingHorizontal: 14, height: 52 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.foreground },
    eyeBtn: { padding: 4 },
    fieldError: { fontSize: 12, fontFamily: 'Inter_400Regular' },
    btn: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    btnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
    switchRow: { alignItems: 'center' },
    switchText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  });
}
