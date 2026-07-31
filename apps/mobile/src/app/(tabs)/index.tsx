import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { Flame, Award, ChevronRight } from 'lucide-react-native';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const progressPercent = 75;
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * progressPercent) / 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.name || 'Athlete'}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Flame color="#FF9500" size={20} />
            <Text style={styles.streakText}>5 Days</Text>
          </View>
        </View>

        {/* Progress Circular Chart Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Daily Progress</Text>
          <View style={styles.chartContainer}>
            <Svg width={150} height={150}>
              <Circle
                cx="75"
                cy="75"
                r={radius}
                stroke={Colors.dark.border}
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <Circle
                cx="75"
                cy="75"
                r={radius}
                stroke={Colors.dark.primary}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                transform="rotate(-90 75 75)"
              />
            </Svg>
            <View style={styles.chartCenterText}>
              <Text style={styles.chartPercent}>{progressPercent}%</Text>
              <Text style={styles.chartLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Macro Overview */}
        <Text style={styles.sectionTitle}>Macro Summary</Text>
        <View style={styles.macroGrid}>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>160g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>210g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>55g</Text>
            <Text style={styles.macroLabel}>Fats</Text>
          </View>
        </View>

        {/* Pro Banner */}
        <TouchableOpacity
          style={styles.proBanner}
          onPress={() => router.push('/subscription')}
          activeOpacity={0.85}
        >
          <View style={styles.proLeft}>
            <Award color={Colors.dark.primaryText} size={28} />
            <View>
              <Text style={styles.proTitle}>Upgrade to Fitnesis PRO</Text>
              <Text style={styles.proSubtitle}>Unlock custom AI routines & direct coach chat</Text>
            </View>
          </View>
          <ChevronRight color={Colors.dark.primaryText} size={20} />
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
  },
  userName: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: '800',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderColor: Colors.dark.border,
    borderWidth: 1,
    gap: 6,
  },
  streakText: {
    color: Colors.dark.text,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderWidth: 1,
    marginBottom: 24,
  },
  cardTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '700',
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  chartContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartCenterText: {
    position: 'absolute',
    alignItems: 'center',
  },
  chartPercent: {
    color: Colors.dark.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  chartLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  sectionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 14,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    backgroundColor: Colors.dark.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  macroValue: {
    color: Colors.dark.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  macroLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  proBanner: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  proTitle: {
    color: Colors.dark.primaryText,
    fontSize: 15,
    fontWeight: '800',
  },
  proSubtitle: {
    color: Colors.dark.primaryText,
    fontSize: 12,
    opacity: 0.85,
    marginTop: 2,
  },
});
