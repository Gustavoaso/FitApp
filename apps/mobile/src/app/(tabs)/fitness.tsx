import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Utensils, Dumbbell, Clock, RefreshCw } from 'lucide-react-native';

export default function FitnessScreen() {
  const isLoading = false;

  const mockDietMeals = [
    { id: '1', title: 'Breakfast', desc: 'Oatmeal with berries & Whey protein', calories: '450 kcal' },
    { id: '2', title: 'Lunch', desc: 'Grilled chicken breast, brown rice & broccoli', calories: '650 kcal' },
    { id: '3', title: 'Snack', desc: 'Greek yogurt & almonds', calories: '250 kcal' },
    { id: '4', title: 'Dinner', desc: 'Baked salmon with quinoa & asparagus', calories: '550 kcal' },
  ];

  const mockWorkoutExercises = [
    { id: '1', name: 'Barbell Bench Press', sets: '4 sets x 10 reps' },
    { id: '2', name: 'Incline Dumbbell Press', sets: '3 sets x 12 reps' },
    { id: '3', name: 'Cable Flyes', sets: '3 sets x 15 reps' },
    { id: '4', name: 'Triceps Rope Pushdown', sets: '4 sets x 12 reps' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Fitness Overview</Text>
          <TouchableOpacity style={styles.refreshButton}>
            <RefreshCw color={Colors.dark.primary} size={20} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={Colors.dark.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Active Diet Plan */}
            <View style={styles.sectionHeader}>
              <Utensils color={Colors.dark.primary} size={20} />
              <Text style={styles.sectionTitle}>Today's Diet Plan</Text>
            </View>

            <View style={styles.cardGroup}>
              {mockDietMeals.map((meal) => (
                <View key={meal.id} style={styles.cardItem}>
                  <View style={styles.cardContent}>
                    <Text style={styles.itemTitle}>{meal.title}</Text>
                    <Text style={styles.itemDesc}>{meal.desc}</Text>
                  </View>
                  <Text style={styles.badgeText}>{meal.calories}</Text>
                </View>
              ))}
            </View>

            {/* Active Workout Plan */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Dumbbell color={Colors.dark.primary} size={20} />
              <Text style={styles.sectionTitle}>Today's Workout Routine</Text>
            </View>

            <View style={styles.cardGroup}>
              {mockWorkoutExercises.map((exercise) => (
                <View key={exercise.id} style={styles.cardItem}>
                  <View style={styles.cardContent}>
                    <Text style={styles.itemTitle}>{exercise.name}</Text>
                    <View style={styles.timeRow}>
                      <Clock color={Colors.dark.textSecondary} size={14} />
                      <Text style={styles.itemDesc}>{exercise.sets}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: '800',
  },
  refreshButton: {
    padding: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
  },
  cardGroup: {
    gap: 10,
  },
  cardItem: {
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  itemTitle: {
    color: Colors.dark.text,
    fontSize: 15,
    fontWeight: '600',
  },
  itemDesc: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  badgeText: {
    color: Colors.dark.primary,
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#27241A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
});
