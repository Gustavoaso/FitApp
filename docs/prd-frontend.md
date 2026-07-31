# PRD Frontend — Fitnesis

> "Seu nutricionista, personal trainer e coach de hábitos em um único app com IA que se adapta à sua rotina em tempo real."

## 1. Resumo do Produto

O Fitnesis é um aplicativo mobile focado em entregar uma experiência fitness unificada. Em vez de usar vários apps fragmentados, o usuário tem acesso a planos de dieta, planos de treino e um personal coach via IA no mesmo lugar.

**Público-alvo**: Qualquer pessoa buscando melhorar saúde e condicionamento físico.

---

## 2. Stack Técnica

| Componente | Tecnologia |
|---|---|
| Plataforma | React Native + Expo (Mobile nativo) |
| Arquitetura | Monorepo (Turborepo) + Feature-based |
| State Management | Zustand (estado global) |
| Data Fetching | React Query (server state, cache) |
| Estilização | SASS |
| Gráficos | Victory Native |
| Interações UI | react-native-draggable-flatlist (Drag & Drop) |
| Gerenciador de Pacotes | pnpm |

---

## 3. Navegação (Expo Router)

A navegação é dividida em stacks e tabs.

### 3.1 Auth (Stack separado — não autenticado)
- `access-portal.tsx` — Tela inicial com opções de login/register
- `login.tsx` — Autenticação com email/senha
- `register.tsx` — Criação de conta
- `forgot-password.tsx` — Recuperação de senha

### 3.2 Onboarding (Stack pós-registro — 1ª vez)
- `step-goal.tsx` — Objetivo principal
- `step-body.tsx` — Peso, altura, idade, gênero
- `step-activity.tsx` — Nível de atividade
- `step-diet.tsx` — Restrições alimentares
- `step-schedule.tsx` — Dias disponíveis, horários, tempo de treino
- `step-generating.tsx` — Loading animado (IA gerando planos)

### 3.3 App Principal — Tab Bar (4 tabs principais)
| Tab | Arquivo | Descrição |
|---|---|---|
| 💪 **Fitness Overview** | `fitness-overview.tsx` | Visualização dos planos (dieta/treino) e gráficos de progresso. |
| 📅 **Calendar** | `calendar.tsx` | Visão de calendário com refeições e treinos agendados. |
| ✅ **To-do List** | `todo-list.tsx` | Tarefas diárias com checkboxes. |
| ❓ **Help** | `help.tsx` | Central de ajuda e suporte. |

### 3.4 App Principal — Navegação Comum (Stack)
Telas acessadas a partir das tabs ou ações específicas:
- `home.tsx` — Tela inicial de boas-vindas com resumo do dia.
- `chat/index.tsx` — Lista de conversas com o AI Agent.
- `chat/[id].tsx` — Chat em tempo real (streaming via SSE).
- `profile.tsx` — Dados do perfil e configurações.
- `subscription.tsx` — Gerenciamento da assinatura Pro.
- `plans/diet/[id].tsx` — Detalhes aprofundados do plano de dieta.
- `plans/workout/[id].tsx` — Detalhes aprofundados do plano de treino.
- `plans/customize.tsx` — Interface de customização de plano (manual + solicitação IA).

---

## 4. Árvore de Componentes (Feature-based)

```text
src/
  features/
    auth/
      components/ (LoginForm, RegisterForm, AccessPortalCard)
      hooks/      (useAuth, useSession)
      store/      (authStore)
    onboarding/
      components/ (StepCard, ProgressBar, OptionSelector)
      hooks/      (useOnboarding)
      store/      (onboardingStore)
    diet-plan/
      components/ (DietPlanCard, MealCard, FoodItem, MacrosBadge)
      hooks/      (useDietPlans, useDietPlanDetail)
    workout-plan/
      components/ (WorkoutPlanCard, ExerciseCard, MuscleGroupBadge)
      hooks/      (useWorkoutPlans, useWorkoutPlanDetail)
    daily-task/
      components/ (TaskList, TaskItem, DatePicker, CompletionBadge)
      hooks/      (useDailyTasks, useTaskCompletion)
    chat/
      components/ (ChatBubble, MessageInput, StreamingText, ConversationCard)
      hooks/      (useChat, useSSE)
    billing/
      components/ (PlanComparisonCard, CheckoutButton, SubscriptionBadge)
      hooks/      (useSubscription, useCheckout)
    calendar/
      components/ (CalendarView, EventCard)
      hooks/      (useCalendarSync, useCalendarEvents)
    progress/
      components/ (PieChart, WeeklyComplianceChart, MacroBreakdown)
      hooks/      (useProgressData)
    help/
      components/ (HelpCard, FAQItem)

  shared/
    components/   (Button, Input, Card, Modal, Toast, Skeleton, DragHandle)
    hooks/        (useApi, useDebounce)
    services/     (apiClient)
    styles/       (theme.ts, colors.ts, typography.ts, spacing.ts)
    types/        (global types)
    utils/        (formatters, validators)
    constants/    (enums, config)
```

---

## 5. Design System & UI

O Design System será extraído do [Protótipo no Figma](https://www.figma.com/design/WUhkSiole2vcdudDl8dFK7/Fitnesis?node-id=0-1&p=f&t=QXmfBbAgnhVOwKH5-0) usando o MCP `figma-console`.

- **Cores**: Definidas no Figma (variáveis de estilo).
- **Tipografia**: Definida no Figma.
- **Spacing**: Sistema múltiplo de 4px (4, 8, 12, 16, 24, 32, 48).
- **Estilização**: SASS (folhas de estilo modulares ou globais).
- **Componentes Especiais**:
  - `Victory Native`: Gráficos de pizza mostrando % de cumprimento (dieta vs treino, água, macros).
  - `react-native-draggable-flatlist`: Para o usuário reordenar refeições e exercícios manualmente.
  - `StreamingText`: Um componente que renderiza o texto do AI chat progressivamente (token a token).

---

## 6. Camada de API & Integração

### apiClient
Um wrapper em cima da API `fetch` nativa que automaticamente:
- Intercepta respostas `401 Unauthorized` para redirecionar para o login.
- Lida com a base URL dinamicamente via `.env`.
- Não precisa injetar token manualmente no header de Authorization se estivermos usando `iron-session` (o cookie vai automaticamente, caso seja web-based authentication flow) **ou** um interceptor pra injetar o token de sessão caso usemos um modelo token-based nativo (dependendo de como iron-session é adaptado pro React Native).

### React Query
- Todos os `GET`s usarão `useQuery` com `staleTime` configurado para manter cache local e navegação fluida.
- Modificações (POST, PATCH, DELETE) usarão `useMutation` com invalidação otimista (optimistic updates) especialmente para a To-do List (checkboxes de tarefas).

### SSE (Server-Sent Events)
- O chat com IA usará um hook customizado `useSSE` (via `react-native-sse` ou fetch adaptado) para receber os chunks de texto do agente e exibir em tempo real.

---

## 7. Requisitos Não-Funcionais (Frontend / UX)

### UX
| ID | Requisito |
|---|---|
| RNF-14 | App responsivo, adaptável a diferentes tamanhos de tela mobile (iOS/Android). |
| RNF-15 | Loading states visuais usando `Skeletons` em telas e `Spinners` em botões. |
| RNF-16 | Feedback visual claro via `Toasts` (sucesso/erro) e micro-animações (ex: checkmark). |
| RNF-17 | Navegação nativa fluida (stack nativa via Expo Router). |
| RNF-18 | Suporte a visualização offline do último cache salvo pelo React Query. |

### Código
| ID | Requisito |
|---|---|
| RNF-20 | TypeScript Strict Mode em 100% da codebase (sem `any`). |
| RNF-21 | Arquitetura estrita feature-based. |
| RNF-25 | Zero comentários no código (Clean Code). |
| RNF-26 | Funções e componentes pequenos, únicos e com nomes autoexplicativos. |

---

## 8. Security Checklist (Frontend)

- [ ] Variáveis sensíveis NÃO estão expostas ao bundle client-side (somente URIs e IDs públicos no `EXPO_PUBLIC_`).
- [ ] Formulários possuem validação estrita (Zod + React Hook Form).
- [ ] Erros da API são mascarados com mensagens amigáveis ("Ocorreu um erro, tente novamente") e não mostram stack trace.
- [ ] Nenhuma chave de API de terceiros (como OpenAI ou Stripe Secret) está no frontend.
- [ ] Não armazenar dados sensíveis no `AsyncStorage` de forma insegura (utilizar `SecureStore` para tokens, se aplicável ao invés de cookies).

---

## 9. Dependências Base (package.json - Mobile)

```json
{
  "dependencies": {
    "expo": "^51.0.0",
    "expo-router": "^3.5.0",
    "react-native": "0.74.5",
    "react-native-safe-area-context": "4.10.5",
    "react-native-screens": "3.31.1",
    "zustand": "^4.5.2",
    "@tanstack/react-query": "^5.0.0",
    "sass": "^1.77.0",
    "victory-native": "^41.0.0",
    "react-native-draggable-flatlist": "^4.0.0",
    "react-native-gesture-handler": "~2.16.1",
    "react-native-reanimated": "~3.10.1",
    "react-native-svg": "15.2.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.3.0",
    "expo-secure-store": "~13.0.1"
  },
  "devDependencies": {
    "typescript": "^5.1.3",
    "@types/react": "~18.2.45"
  }
}
```
