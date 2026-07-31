import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { Check, ShieldCheck, Zap, ArrowLeft } from 'lucide-react-native';
import apiClient from '@/services/apiClient';

export default function SubscriptionScreen() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/billing/checkout', { plan: selectedPlan });
      if (response.data?.url) {
        // Open web checkout URL
        console.log('Checkout URL:', response.data.url);
      }
    } catch {
      // Handle error gracefully
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft color={Colors.dark.primary} size={24} />
        </TouchableOpacity>

        <View style={styles.heroSection}>
          <Zap color={Colors.dark.primary} size={48} />
          <Text style={styles.title}>Fitnesis PRO</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited AI plan generations, custom recipe replacements, and priority AI coach response time.
          </Text>
        </View>

        {/* Benefits list */}
        <View style={styles.benefitsCard}>
          {[
            'Unlimited AI Workout & Diet recalibrations',
            'Real-time Chat with AI Nutri & Coach',
            'Advanced progress analytics & graphs',
            'Export meal plans & PDF shopping lists',
          ].map((benefit, idx) => (
            <View key={idx} style={styles.benefitRow}>
              <Check color={Colors.dark.primary} size={18} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Plan Selectors */}
        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardSelected]}
          onPress={() => setSelectedPlan('yearly')}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planName}>Annual Access</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>SAVE 40%</Text>
            </View>
          </View>
          <Text style={styles.planPrice}>$5.99 / month</Text>
          <Text style={styles.planSubtext}>Billed annually at $71.88/yr</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
          onPress={() => setSelectedPlan('monthly')}
        >
          <View style={styles.planHeader}>
            <Text style={styles.planName}>Monthly Access</Text>
          </View>
          <Text style={styles.planPrice}>$9.99 / month</Text>
          <Text style={styles.planSubtext}>Billed monthly, cancel anytime</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={handleCheckout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.dark.primaryText} />
          ) : (
            <Text style={styles.checkoutText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>

        <View style={styles.guaranteeRow}>
          <ShieldCheck color={Colors.dark.textSecondary} size={16} />
          <Text style={styles.guaranteeText}>Secured with Stripe 256-bit encryption</Text>
        </View>
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
    paddingTop: 12,
    paddingBottom: 40,
  },
  backButton: {
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  title: {
    color: Colors.dark.primary,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  benefitsCard: {
    backgroundColor: Colors.dark.card,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    marginBottom: 24,
    borderColor: Colors.dark.border,
    borderWidth: 1,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: '500',
  },
  planCard: {
    backgroundColor: Colors.dark.card,
    borderColor: Colors.dark.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },
  planCardSelected: {
    borderColor: Colors.dark.primary,
    backgroundColor: '#27241A',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    color: Colors.dark.primaryText,
    fontSize: 10,
    fontWeight: '800',
  },
  planPrice: {
    color: Colors.dark.primary,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  planSubtext: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  checkoutButton: {
    backgroundColor: Colors.dark.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  checkoutText: {
    color: Colors.dark.primaryText,
    fontSize: 16,
    fontWeight: '800',
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  guaranteeText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
});
