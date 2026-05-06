import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useGetWallet, getGetWalletQueryKey } from '@workspace/api-client-react';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { formatNaira } from '@/lib/format';

type MenuItemType = {
  icon: string;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: wallet, isLoading: walletLoading } = useGetWallet();

  const s = makeStyles(colors);

  async function handleLogout() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
  }

  const menuItems: MenuItemType[] = [
    { icon: 'cpu', label: 'My Meters', sub: 'Manage saved meters', onPress: () => router.push('/meters') },
    { icon: 'repeat', label: 'Auto-Buy Subscriptions', sub: 'Manage recurring purchases', onPress: () => router.push('/subscriptions') },
    { icon: 'credit-card', label: 'Wallet & Payments', sub: 'Top up and transaction history', onPress: () => router.push('/wallet') },
    { icon: 'clock', label: 'Purchase History', sub: 'All token purchases', onPress: () => router.push('/(tabs)/history') },
  ];

  return (
    <ScrollView
      style={[s.container]}
      contentContainerStyle={[s.scroll, { paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 16), paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 100) }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[s.pageTitle, { color: colors.foreground }]}>Profile</Text>

      {/* User Card */}
      <View style={[s.userCard, { backgroundColor: colors.primary }]}>
        <View style={[s.avatar, { backgroundColor: colors.primaryForeground + '22' }]}>
          <Text style={[s.avatarText, { color: colors.primaryForeground }]}>
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </Text>
        </View>
        <View style={s.userInfo}>
          <Text style={[s.userName, { color: colors.primaryForeground }]}>{user?.name ?? '—'}</Text>
          <Text style={[s.userEmail, { color: colors.primaryForeground + 'CC' }]}>{user?.email ?? '—'}</Text>
          <Text style={[s.userPhone, { color: colors.primaryForeground + 'CC' }]}>{user?.phone ?? '—'}</Text>
        </View>
      </View>

      {/* Wallet Balance */}
      <Pressable
        style={({ pressed }) => [s.walletCard, { backgroundColor: colors.card, opacity: pressed ? 0.85 : 1 }]}
        onPress={() => router.push('/wallet')}
      >
        <View style={s.walletLeft}>
          <View style={[s.walletIcon, { backgroundColor: colors.success + '15' }]}>
            <Feather name="dollar-sign" size={22} color={colors.success} />
          </View>
          <View>
            <Text style={[s.walletLabel, { color: colors.mutedForeground }]}>Wallet Balance</Text>
            {walletLoading
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Text style={[s.walletAmount, { color: colors.foreground }]}>{formatNaira(wallet?.balance ?? 0)}</Text>
            }
          </View>
        </View>
        <View style={[s.topUpBtn, { backgroundColor: colors.primary }]}>
          <Text style={[s.topUpText, { color: colors.primaryForeground }]}>Top Up</Text>
        </View>
      </Pressable>

      {/* Menu */}
      <View style={[s.menu, { backgroundColor: colors.card }]}>
        {menuItems.map((item, i) => (
          <React.Fragment key={item.label}>
            <Pressable
              style={({ pressed }) => [s.menuItem, { opacity: pressed ? 0.75 : 1 }]}
              onPress={item.onPress}
            >
              <View style={[s.menuIcon, { backgroundColor: colors.secondary }]}>
                <Feather name={item.icon as never} size={18} color={colors.primary} />
              </View>
              <View style={s.menuText}>
                <Text style={[s.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
                {item.sub ? <Text style={[s.menuSub, { color: colors.mutedForeground }]}>{item.sub}</Text> : null}
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
            {i < menuItems.length - 1 && <View style={[s.divider, { backgroundColor: colors.border }]} />}
          </React.Fragment>
        ))}
      </View>

      {/* Logout */}
      <Pressable
        style={({ pressed }) => [s.logoutBtn, { backgroundColor: colors.destructive + '12', opacity: pressed ? 0.8 : 1 }]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[s.logoutText, { color: colors.destructive }]}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingHorizontal: 20 },
    pageTitle: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 20 },
    userCard: { borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
    avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 28, fontFamily: 'Inter_700Bold' },
    userInfo: { flex: 1, gap: 3 },
    userName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
    userEmail: { fontSize: 13, fontFamily: 'Inter_400Regular' },
    userPhone: { fontSize: 13, fontFamily: 'Inter_400Regular' },
    walletCard: { borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
    walletLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    walletIcon: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
    walletLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 2 },
    walletAmount: { fontSize: 20, fontFamily: 'Inter_700Bold' },
    topUpBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    topUpText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
    menu: { borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
    menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
    menuIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    menuText: { flex: 1 },
    menuLabel: { fontSize: 15, fontFamily: 'Inter_500Medium' },
    menuSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
    divider: { height: 1, marginLeft: 70 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 54, borderRadius: 14 },
    logoutText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  });
}
