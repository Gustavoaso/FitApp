# Fitnesis — Mobile SaaS Application

Fitnesis is an AI-powered fitness and diet companion mobile application built with Expo (React Native), NestJS, FastAPI (LangGraph AI Service), and Supabase.

## Features

### 1. Authentication & Access Portal
- **Description**: Secure access portal with login, user registration, password recovery, and iron-session authenticated proxy session handling.
- **Workflow**:
  1. User opens app and lands on the Access Portal (`/(auth)/access-portal`).
  2. User selects **Login** or **Register**.
  3. Form submits credentials to NestJS backend proxy (`/auth/login` or `/auth/register`).
  4. Upon successful validation, session cookie is set and user is routed to the Onboarding wizard or Tab interface.

### 2. Personalization & AI Plan Generation Onboarding
- **Description**: Interactive step-by-step wizard to collect user body stats, goals, activity level, diet preferences, and workout frequency.
- **Workflow**:
  1. User proceeds through 5 onboarding steps: Goal, Body Stats, Activity Level, Diet Preference, and Workout Schedule.
  2. On final step submit, the app displays the loading screen with the animated gym hamster GIF.
  3. Request is dispatched to backend endpoint `/plans/generate`, triggering the AI agent service.
  4. Generated diet and workout routines are stored, and user navigates directly into the main app tabs.

### 3. Home Dashboard & Progress Analytics
- **Description**: Overview screen featuring daily task completion ring, streak badge, and calorie macro summary.
- **Workflow**:
  1. Displays user greeting, current workout streak, and daily task completion percentage ring via SVG rendering.
  2. Breaks down macro intake (Protein, Carbs, Fats).
  3. Provides direct upgrade banner to Fitnesis PRO subscription.

### 4. Fitness Plan Overview
- **Description**: Detailed breakdown of daily meal schedules and exercise routines.
- **Workflow**:
  1. Queries active diet plan meals (Breakfast, Lunch, Snack, Dinner) with calorie targets.
  2. Lists daily workout exercises with targeted sets and repetition schemes.

### 5. Interactive Daily To-Do List
- **Description**: Date-swappable task checklist with real-time optimistic updates and drag-and-drop reordering handles.
- **Workflow**:
  1. User selects date via the top date-switcher bar.
  2. Toggling task checkboxes immediately updates completed status on UI and synchronizes with server.
  3. Drag handles allow users to reorder daily task sequence.

### 6. AI Coach & SSE Streaming Assistant
- **Description**: Interactive conversational assistant powered by LangGraph to adjust plans and answer fitness questions in real time.
- **Workflow**:
  1. User selects pre-made suggestion chips or types custom instructions.
  2. Message streams through NestJS AI proxy `/chat`.
  3. Assistant responds with updated plan recommendations and coaching advice.

### 7. PRO Subscription & Stripe Checkout
- **Description**: Monetization screen presenting annual and monthly PRO tiers with secure Stripe checkout connection.
- **Workflow**:
  1. User selects plan tier (Annual vs Monthly).
  2. Taps "Subscribe Now" to initiate Stripe Checkout session via `/billing/checkout`.

## Architecture & Monorepo Structure

- `apps/mobile`: Expo (React Native) app with Expo Router, Zustand, React Query, and Lucide icons.
- `apps/backend`: NestJS API gateway with iron-session auth, Supabase integration, and Stripe webhooks.
- `apps/ai-service`: FastAPI & LangGraph agent service powered by Google Gemini.
