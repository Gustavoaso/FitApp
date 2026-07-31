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
import apiClient from '@/services/apiClient';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async () => {
    setStatusMessage(null);
    if (!password || !confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Please fill in both password fields' });
      return;
    }
    if (password !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { password });
      setStatusMessage({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => router.replace('/(auth)/login'), 2000);
    } catch {
      setStatusMessage({ type: 'error', text: 'Failed to change your password...' });
    } finally {
      setIsLoading(false);
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
        <Text style={styles.subtitle}>Enter your new password and confirm it</Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor="#666"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleChangePassword}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.dark.primaryText} />
          ) : (
            <Text style={styles.submitButtonText}>Change Password</Text>
          )}
        </TouchableOpacity>
      </View>

      {statusMessage && (
        <View
          style={[
            styles.toastBanner,
            statusMessage.type === 'success' ? styles.toastSuccess : styles.toastError,
          ]}
        >
          <Text style={styles.toastText}>{statusMessage.text}</Text>
        </View>
      )}
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
  submitButton: {
    backgroundColor: Colors.dark.primary,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: Colors.dark.primaryText,
    fontSize: 16,
    fontWeight: '700',
  },
  toastBanner: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  toastSuccess: {
    backgroundColor: Colors.dark.success,
  },
  toastError: {
    backgroundColor: Colors.dark.error,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
