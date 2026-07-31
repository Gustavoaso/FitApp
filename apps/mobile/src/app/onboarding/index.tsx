import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useOnboardingStore } from '@/stores/onboardingStore';
import LoadingOverlay from '@/components/loading-overlay';
import apiClient from '@/services/apiClient';

export default function OnboardingScreen() {
  const router = useRouter();
  const {
    currentStep,
    data,
    setGoal,
    setBodyStats,
    setActivityLevel,
    setDietPreference,
    setWorkoutDays,
    nextStep,
    prevStep,
  } = useOnboardingStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [weight, setWeight] = useState(data.weight);
  const [height, setHeight] = useState(data.height);
  const [age, setAge] = useState(data.age);

  const totalSteps = 5;

  const handleGeneratePlans = async () => {
    setIsGenerating(true);
    try {
      await apiClient.post('/plans/generate', {
        goal: data.goal,
        weight: parseFloat(data.weight) || 70,
        height: parseFloat(data.height) || 175,
        age: parseInt(data.age, 10) || 25,
        activityLevel: data.activityLevel,
        dietPreference: data.dietPreference,
        workoutDays: data.workoutDays,
      });
      router.replace('/(tabs)');
    } catch {
      // Direct navigation if backend simulation active or fallback
      router.replace('/(tabs)');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return <LoadingOverlay message="Generating your personalized AI Diet & Workout Plans..." />;
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What is your main fitness goal?</Text>
            {[
              { id: 'weight_loss', label: '🔥 Weight Loss' },
              { id: 'muscle_gain', label: '💪 Muscle Building' },
              { id: 'maintenance', label: '⚖️ Weight Maintenance' },
              { id: 'stamina', label: '🏃 Endurance & Stamina' },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  data.goal === option.id && styles.optionCardSelected,
                ]}
                onPress={() => setGoal(option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    data.goal === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Tell us about your body stats</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={(val) => {
                  setWeight(val);
                  setBodyStats(val, height, age);
                }}
                keyboardType="numeric"
                placeholder="70"
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={height}
                onChangeText={(val) => {
                  setHeight(val);
                  setBodyStats(weight, val, age);
                }}
                keyboardType="numeric"
                placeholder="175"
                placeholderTextColor="#666"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={(val) => {
                  setAge(val);
                  setBodyStats(weight, height, val);
                }}
                keyboardType="numeric"
                placeholder="25"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Your daily activity level</Text>
            {[
              { id: 'sedentary', label: '🛋️ Sedentary (Office desk job)' },
              { id: 'light', label: '🚶 Lightly Active (1-2 workouts/week)' },
              { id: 'moderate', label: '🏋️ Moderately Active (3-4 workouts/week)' },
              { id: 'intense', label: '🔥 Very Active (5+ workouts/week)' },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  data.activityLevel === option.id && styles.optionCardSelected,
                ]}
                onPress={() => setActivityLevel(option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    data.activityLevel === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Dietary Preferences</Text>
            {[
              { id: 'balanced', label: '🥗 Balanced Macro Diet' },
              { id: 'low_carb', label: '🥑 Low Carb / Keto' },
              { id: 'high_protein', label: '🥩 High Protein' },
              { id: 'vegetarian', label: '🌿 Vegetarian' },
              { id: 'vegan', label: '🌱 Plant Based / Vegan' },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  data.dietPreference === option.id && styles.optionCardSelected,
                ]}
                onPress={() => setDietPreference(option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    data.dietPreference === option.id && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>How many days per week can you workout?</Text>
            {[2, 3, 4, 5, 6].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.optionCard,
                  data.workoutDays === days && styles.optionCardSelected,
                ]}
                onPress={() => setWorkoutDays(days)}
              >
                <Text
                  style={[
                    styles.optionText,
                    data.workoutDays === days && styles.optionTextSelected,
                  ]}
                >
                  ⚡ {days} Days per week
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${((currentStep + 1) / totalSteps) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderStepContent()}
      </ScrollView>

      <View style={styles.footer}>
        {currentStep > 0 ? (
          <TouchableOpacity style={styles.prevButton} onPress={prevStep}>
            <Text style={styles.prevButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {currentStep < totalSteps - 1 ? (
          <TouchableOpacity style={styles.nextButton} onPress={nextStep}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextButton} onPress={handleGeneratePlans}>
            <Text style={styles.nextButtonText}>Generate Plan</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 10,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: Colors.dark.card,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
  },
  progressText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'right',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  stepContainer: {
    gap: 14,
  },
  stepTitle: {
    color: Colors.dark.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  optionCardSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: '#27241A',
  },
  optionText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: Colors.dark.primary,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.dark.inputBackground,
    borderColor: Colors.dark.border,
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 16,
    color: Colors.dark.text,
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    gap: 16,
  },
  prevButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prevButtonText: {
    color: Colors.dark.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.dark.primaryText,
    fontSize: 15,
    fontWeight: '700',
  },
});
