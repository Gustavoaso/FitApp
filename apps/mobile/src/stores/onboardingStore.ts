import { create } from 'zustand';

export interface OnboardingData {
  goal: string;
  weight: string;
  height: string;
  age: string;
  activityLevel: string;
  dietPreference: string;
  workoutDays: number;
}

interface OnboardingState {
  currentStep: number;
  data: OnboardingData;
  setGoal: (goal: string) => void;
  setBodyStats: (weight: string, height: string, age: string) => void;
  setActivityLevel: (level: string) => void;
  setDietPreference: (preference: string) => void;
  setWorkoutDays: (days: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetOnboarding: () => void;
}

const initialData: OnboardingData = {
  goal: 'weight_loss',
  weight: '70',
  height: '175',
  age: '25',
  activityLevel: 'moderate',
  dietPreference: 'balanced',
  workoutDays: 4,
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 0,
  data: initialData,

  setGoal: (goal: string) =>
    set((state: OnboardingState) => ({ data: { ...state.data, goal } })),

  setBodyStats: (weight: string, height: string, age: string) =>
    set((state: OnboardingState) => ({ data: { ...state.data, weight, height, age } })),

  setActivityLevel: (activityLevel: string) =>
    set((state: OnboardingState) => ({ data: { ...state.data, activityLevel } })),

  setDietPreference: (dietPreference: string) =>
    set((state: OnboardingState) => ({ data: { ...state.data, dietPreference } })),

  setWorkoutDays: (workoutDays: number) =>
    set((state: OnboardingState) => ({ data: { ...state.data, workoutDays } })),

  nextStep: () => set((state: OnboardingState) => ({ currentStep: state.currentStep + 1 })),
  prevStep: () => set((state: OnboardingState) => ({ currentStep: Math.max(0, state.currentStep - 1) })),
  resetOnboarding: () => set({ currentStep: 0, data: initialData }),
}));
