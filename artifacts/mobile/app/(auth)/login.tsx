import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLogin } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const result = await loginMutation.mutateAsync({ data: { email: email.trim(), password } });
      queryClient.clear();
      await login(result.token, result.user);
    } catch (err: unknown) {
      const msg = (err as { data?: { error?: string } })?.data?.error ?? 'Login failed. Try again.';
      setErrors({ general: msg });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  const s = makeStyles(colors);

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

        <Text style={s.title}>Welcome back</Text>
        <Text style={s.subtitle}>Sign in to your AEDC Pay account</Text>

        {errors.general ? (
          <View style={s.errorBanner}>
            <Feather name="alert-circle" size={16} color={colors.destructive} />
            <Text style={[s.errorBannerText, { color: colors.destructive }]}>{errors.general}</Text>
          </View>
        ) : null}

        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>Email address</Text>
            <View style={[s.inputWrap, errors.email ? { borderColor: colors.destructive } : {}]}>
              <Feather name="mail" size={18} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
              />
            </View>
            {errors.email ? <Text style={[s.fieldError, { color: colors.destructive }]}>{errors.email}</Text> : null}
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={[s.inputWrap, errors.password ? { borderColor: colors.destructive } : {}]}>
              <Feather name="lock" size={18} color={colors.mutedForeground} style={s.inputIcon} />
              <TextInput
                style={[s.input, { flex: 1 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                autoComplete="password"
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={s.eyeBtn}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            {errors.password ? <Text style={[s.fieldError, { color: colors.destructive }]}>{errors.password}</Text> : null}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [s.btn, { backgroundColor: colors.primary, opacity: pressed || loginMutation.isPending ? 0.85 : 1 }]}
          onPress={handleLogin}
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending
            ? <ActivityIndicator color={colors.primaryForeground} />
            : <Text style={[s.btnText, { color: colors.primaryForeground }]}>Sign In</Text>}
        </Pressable>

        <Pressable onPress={() => router.push('/(auth)/register')} style={s.switchRow}>
          <Text style={[s.switchText, { color: colors.mutedForeground }]}>
            Don't have an account?{' '}
            <Text style={{ color: colors.primary, fontFamily: 'Inter_600SemiBold' }}>Register</Text>
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
