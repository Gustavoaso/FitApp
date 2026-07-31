import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLoginSubmit = async () => {
    if (!email || !password) return;
    try {
      clearError();
      await login(email, password);
      router.replace('/(tabs)');
    } catch {
      // Error handled by store
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Enter your credentials to access the app</Text>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@mail.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.forgotPassword}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text style={styles.forgotPasswordText}>Forgot password {"<"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleLoginSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.dark.primaryText} />
          ) : (
            <Text style={styles.submitButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerLink}>
          <Text style={styles.footerText}>Don’t have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLinkText}>Please register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: Colors.dark.primary,
    fontSize: 28,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    marginBottom: 30,
    lineHeight: 22,
  },
  errorBanner: {
    backgroundColor: '#3A1416',
    borderColor: Colors.dark.error,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: Colors.dark.error,
    fontSize: 14,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: Colors.dark.text,
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.dark.inputBackground,
    borderColor: Colors.dark.border,
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    paddingHorizontal: 16,
    color: Colors.dark.text,
    fontSize: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginBottom: 30,
  },
  forgotPasswordText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: Colors.dark.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: Colors.dark.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  footerLink: {
    marginTop: 40,
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: Colors.dark.primary,
    fontSize: 14,
  },
  footerLinkText: {
    color: Colors.dark.primary,
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
