import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.logo, { color: colors.primaryForeground }]}>AEDC Pay</Text>
          <Text style={[styles.subtitle, { color: colors.primaryForeground, opacity: 0.8 }]}>
            Power your home, instantly.
          </Text>
        </View>

        <View style={styles.visualContainer}>
          <View style={[styles.circle, { backgroundColor: colors.accent, opacity: 0.1 }]} />
          <View style={[styles.circleInner, { backgroundColor: colors.accent, opacity: 0.2 }]} />
          <View style={[styles.iconContainer, { backgroundColor: colors.accent }]}>
             <Text style={styles.iconText}>⚡</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable 
            style={({ pressed }) => [
              styles.button, 
              { backgroundColor: colors.primaryForeground },
              pressed && { opacity: 0.9 }
            ]}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={[styles.buttonText, { color: colors.primary }]}>Get Started</Text>
          </Pressable>
          
          <Pressable 
            style={({ pressed }) => [
              styles.buttonSecondary, 
              { borderColor: colors.primaryForeground },
              pressed && { opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.1)' }
            ]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={[styles.buttonTextSecondary, { color: colors.primaryForeground }]}>Log In</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginTop: 40,
    alignItems: 'center',
  },
  logo: {
    fontSize: 40,
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  visualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    position: 'absolute',
  },
  circleInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    position: 'absolute',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 40,
  },
  footer: {
    gap: 16,
    marginBottom: 20,
  },
  button: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  buttonSecondary: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
});
