import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AccessPortalScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/images/pixel-gym-workout-stockcake-removebg-preview.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>FITNESIS</Text>
        <Text style={styles.subtitle}>Your AI Fitness & Diet Companion</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push('/(auth)/login')}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => router.push('/(auth)/register')}
          activeOpacity={0.7}
        >
          <Text style={styles.registerLinkText}>Don’t have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    color: Colors.dark.primary,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  loginButton: {
    backgroundColor: Colors.dark.primary,
    width: '100%',
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: Colors.dark.primaryText,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  registerLink: {
    paddingVertical: 8,
  },
  registerLinkText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
