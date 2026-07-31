import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleRegisterSubmit = async () => {
    setValidationError(null);
    clearError();

    if (!name || !email || !password || !confirmPassword) {
      setValidationError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    try {
      await register(name, email, password);
      router.replace('/onboarding');
    } catch {
      // Error handled in store
    }
  };

  const displayError = validationError || error;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>{'<'}</Text>
        </TouchableOpacity>

        <Text style={styles.subtitle}>Create your credentials to access the app</Text>

        {displayError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{displayError}</Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor="#666"
          />
        </View>

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

        <View style={styles.formGroup}>
          <Text style={styles.label}>Confirm Password</Text>
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
          onPress={handleRegisterSubmit}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.dark.primaryText} />
          ) : (
            <Text style={styles.submitButtonText}>Register</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  backButton: {
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: Colors.dark.primary,
    fontSize: 28,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    marginVertical: 20,
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
    marginBottom: 16,
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
});
