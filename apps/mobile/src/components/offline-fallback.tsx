import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/theme';

interface OfflineFallbackProps {
  onRetry?: () => void;
}

export const OfflineFallback: React.FC<OfflineFallbackProps> = ({ onRetry }) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/mark.png')}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.title}>Sorry!</Text>
      <Text style={styles.message}>We’re having some problems now :(</Text>
      <Text style={styles.subtext}>If it persists please let us know</Text>

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  icon: {
    width: 100,
    height: 100,
    marginBottom: 24,
  },
  title: {
    color: Colors.dark.primary,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  message: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtext: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  retryText: {
    color: Colors.dark.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default OfflineFallback;
