import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = 'Loading Fitnesis...',
}) => {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/gym-hamster.gif')}
        style={styles.gif}
        resizeMode="contain"
      />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  gif: {
    width: 220,
    height: 220,
  },
  text: {
    color: Colors.dark.primary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    textAlign: 'center',
  },
});

export default LoadingOverlay;
