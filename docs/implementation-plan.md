# Plano de Implementação — Fitnesis

> Tarefas quebradas em blocos de 5 a 15 minutos para execução ágil.

## Fase 1: Infraestrutura e Banco de Dados

### Batch 1: Setup Inicial (Infraestrutura)
- [x] Inicializar o Monorepo com Turborepo (apps: backend, ai-service, mobile).
- [x] Configurar o `pnpm` workspace e regras globais do ESLint/Prettier.
- [x] Inicializar projeto NestJS em `apps/backend`.
- [x] Inicializar ambiente Python (FastAPI + LangGraph) em `apps/ai-service`.
- [x] Inicializar projeto Expo (React Native) em `apps/mobile`.
- [x] Criar projeto Supabase no dashboard web (ou local via CLI) e obter credenciais.
- [x] Criar `.env.example` e `.env` no backend e ai-service.

### Batch 2: Database Modeling (Prisma & Supabase)
- [x] Configurar Prisma no NestJS e conectar ao Supabase (PostgreSQL).
- [x] Criar schema Prisma para `user_profiles`, `diet_plans`, e `diet_plan_meals`.
- [x] Criar schema Prisma para `workout_plans` e `workout_plan_exercises`.
- [x] Criar schema Prisma para `daily_tasks`, `chat_conversations`, e `chat_messages`.
- [x] Criar schema Prisma para `subscriptions`, `plan_customizations`, e `calendar_events`.
- [x] Executar migration inicial (`npx prisma migrate dev`).
- [x] Executar script SQL no Supabase para habilitar RLS em todas as tabelas.
- [x] Executar script SQL no Supabase para criar políticas RLS por `user_id`.
- [x] Executar script SQL no Supabase para criar trigger de `auto_create_subscription`.

## Fase 2: Backend Core (NestJS)

### Batch 3: Auth & Profile API
- [x] Configurar iron-session no NestJS e middlewares globais.
- [x] Configurar Supabase Auth (Client SDK no NestJS) para validação.
- [x] Criar guard (`AuthGuard`) e decorator (`@UserId()`) customizados.
- [x] Implementar `AuthController`: registro, login, logout, get me.
- [x] Implementar `UserProfileController`: POST, GET, PATCH do perfil.
- [x] Escrever DTOs com `class-validator` para Auth e UserProfile.
- [x] Testar rotas de Auth e Profile via Swagger (auto-gerado).

### Batch 4: API de Planos e Tarefas
- [x] Implementar CRUD de `DietPlans` (Controller, Service, DTOs).
- [x] Implementar CRUD de `WorkoutPlans` (Controller, Service, DTOs).
- [x] Implementar geração e listagem de `DailyTasks`.
- [x] Implementar rotas para completar/desmarcar tarefas (`PATCH`).
- [x] Implementar `CalendarController` para endpoints de sincronização nativa.

### Batch 5: Billing & Stripe Webhook
- [x] Configurar SDK do Stripe no NestJS.
- [x] Implementar endpoint de Checkout Pro e Checkout Customização.
- [x] Implementar endpoint para cancelar assinatura.
- [x] Configurar Stripe Webhook Controller com raw parser para validação de assinatura.
- [x] Implementar lógica de ativação de Pro baseada nos eventos do webhook.

## Fase 3: AI Service (LangGraph & Python)

### Batch 6: AI Foundation & Tools
- [x] Configurar FastAPI com injetor de dependências para validar header `X-User-Id`.
- [x] Configurar LangChain com Google GenAI (Gemini) no ambiente Python.
- [x] Implementar a Tool `get_user_context` (busca perfil e planos via banco).
- [x] Implementar a Tool `generate_diet_plan` e `generate_workout_plan`.
- [x] Implementar a Tool `analyze_user_progress` (avalia histórico de tarefas diárias).
- [x] Implementar a Tool `customize_plan` (permite refinamento de um plano).
- [x] Configurar os `.md` dos prompts do sistema (Nutricionista, Treinador, Coach).

### Batch 7: Agent Graph e SSE
- [x] Configurar o State do agente (user_id, history, intent).
- [x] Construir os nós do LangGraph: Router, Chat Reply, e roteadores pras Tools.
- [x] Compilar o Graph.
- [x] Implementar Rota do FastAPI `/chat` encapsulada com StreamingResponse (SSE).
- [x] Implementar Rota `/plans/generate` (FastAPI) retornando estruturado via Pydantic.
- [x] Conectar o NestJS ao FastAPI: NestJS repassa requests `/generate` para o AI Service.

## Fase 4: Frontend (Mobile / Expo)

### Batch 8: Frontend Setup & Auth Flow
- [x] Configurar Expo Router e estrutura de pastas (features/shared).
- [x] Extrair design system do Figma via MCP (Cores, Tipografia, Spacing) e colocar no SASS.
- [x] Configurar Zustand store para autenticação (`authStore`).
- [x] Configurar React Query, `apiClient` global e interceptor de sessão expirada.
- [x] Implementar Telas: `access-portal.tsx`, `login.tsx`, `register.tsx`.
- [x] Testar fluxo end-to-end de Login e Registro e persistência do iron-session cookie.

### Batch 9: Onboarding UI
- [x] Implementar layout base do `StepCard` e `ProgressBar`.
- [x] Desenvolver Steps: goal, body, activity, diet, schedule.
- [x] Coletar estado global no Zustand (`onboardingStore`).
- [x] Desenvolver `step-generating` com animação skeleton/spinner chamando endpoint backend.

### Batch 10: App Principal — Tabs & Progress
- [x] Criar a estrutura do Tab Bar Nativo.
- [x] Implementar `Home` (Resumo do dia).
- [x] Instalar `Victory Native` e implementar Gráfico de Progresso Semanal (Pizza).
- [x] Implementar a aba `Fitness Overview` carregando dados dos planos (React Query).

### Batch 11: To-Do List & Interações Avançadas
- [x] Desenvolver a aba `To-do List` com `DatePicker`.
- [x] Implementar lista com Checkboxes simulando feedback (optimistic update via React Query).
- [x] Instalar `react-native-draggable-flatlist`.
- [x] Implementar listagem detalhada de Dietas e Treinos suportando drag and drop para reordenação local e envio ao servidor.

### Batch 12: Chat & SSE Stream
- [x] Implementar UI principal da aba de Chat (`chat/index.tsx` e `chat/[id].tsx`).
- [x] Criar componente `StreamingText` adaptável a SSE.
- [x] Conectar hook customizado `useSSE` à API FastAPI repassada via NestJS.
- [x] Testar fluxo dinâmico: conversar com IA e testar comandos específicos (ex: "ajusta meu treino").

### Batch 13: Finalização & Polish
- [x] Implementar tela `subscription.tsx` chamando checkout Stripe.
- [x] Implementar fallback visual para estado sem rede.
- [x] Revisão geral do código garantindo princípios de Clean Code e remoção de logs sensíveis.
- [x] Gerar APK / TestFlight interno para Quality Assurance final.
