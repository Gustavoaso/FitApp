# Plano de Implementação — Fitnesis

> Tarefas quebradas em blocos de 5 a 15 minutos para execução ágil.

## Fase 1: Infraestrutura e Banco de Dados

### Batch 1: Setup Inicial (Infraestrutura)
- [ ] Inicializar o Monorepo com Turborepo (apps: backend, ai-service, mobile).
- [ ] Configurar o `pnpm` workspace e regras globais do ESLint/Prettier.
- [ ] Inicializar projeto NestJS em `apps/backend`.
- [ ] Inicializar ambiente Python (FastAPI + LangGraph) em `apps/ai-service`.
- [ ] Inicializar projeto Expo (React Native) em `apps/mobile`.
- [ ] Criar projeto Supabase no dashboard web (ou local via CLI) e obter credenciais.
- [ ] Criar `.env.example` e `.env` no backend e ai-service.

### Batch 2: Database Modeling (Prisma & Supabase)
- [ ] Configurar Prisma no NestJS e conectar ao Supabase (PostgreSQL).
- [ ] Criar schema Prisma para `user_profiles`, `diet_plans`, e `diet_plan_meals`.
- [ ] Criar schema Prisma para `workout_plans` e `workout_plan_exercises`.
- [ ] Criar schema Prisma para `daily_tasks`, `chat_conversations`, e `chat_messages`.
- [ ] Criar schema Prisma para `subscriptions`, `plan_customizations`, e `calendar_events`.
- [ ] Executar migration inicial (`npx prisma migrate dev`).
- [ ] Executar script SQL no Supabase para habilitar RLS em todas as tabelas.
- [ ] Executar script SQL no Supabase para criar políticas RLS por `user_id`.
- [ ] Executar script SQL no Supabase para criar trigger de `auto_create_subscription`.

## Fase 2: Backend Core (NestJS)

### Batch 3: Auth & Profile API
- [ ] Configurar iron-session no NestJS e middlewares globais.
- [ ] Configurar Supabase Auth (Client SDK no NestJS) para validação.
- [ ] Criar guard (`AuthGuard`) e decorator (`@UserId()`) customizados.
- [ ] Implementar `AuthController`: registro, login, logout, get me.
- [ ] Implementar `UserProfileController`: POST, GET, PATCH do perfil.
- [ ] Escrever DTOs com `class-validator` para Auth e UserProfile.
- [ ] Testar rotas de Auth e Profile via Swagger (auto-gerado).

### Batch 4: API de Planos e Tarefas
- [ ] Implementar CRUD de `DietPlans` (Controller, Service, DTOs).
- [ ] Implementar CRUD de `WorkoutPlans` (Controller, Service, DTOs).
- [ ] Implementar geração e listagem de `DailyTasks`.
- [ ] Implementar rotas para completar/desmarcar tarefas (`PATCH`).
- [ ] Implementar `CalendarController` para endpoints de sincronização nativa.

### Batch 5: Billing & Stripe Webhook
- [ ] Configurar SDK do Stripe no NestJS.
- [ ] Implementar endpoint de Checkout Pro e Checkout Customização.
- [ ] Implementar endpoint para cancelar assinatura.
- [ ] Configurar Stripe Webhook Controller com raw parser para validação de assinatura.
- [ ] Implementar lógica de ativação de Pro baseada nos eventos do webhook.

## Fase 3: AI Service (LangGraph & Python)

### Batch 6: AI Foundation & Tools
- [ ] Configurar FastAPI com injetor de dependências para validar header `X-User-Id`.
- [ ] Configurar LangChain com Google GenAI (Gemini) no ambiente Python.
- [ ] Implementar a Tool `get_user_context` (busca perfil e planos via banco).
- [ ] Implementar a Tool `generate_diet_plan` e `generate_workout_plan`.
- [ ] Implementar a Tool `analyze_user_progress` (avalia histórico de tarefas diárias).
- [ ] Implementar a Tool `customize_plan` (permite refinamento de um plano).
- [ ] Configurar os `.md` dos prompts do sistema (Nutricionista, Treinador, Coach).

### Batch 7: Agent Graph e SSE
- [ ] Configurar o State do agente (user_id, history, intent).
- [ ] Construir os nós do LangGraph: Router, Chat Reply, e roteadores pras Tools.
- [ ] Compilar o Graph.
- [ ] Implementar Rota do FastAPI `/chat` encapsulada com StreamingResponse (SSE).
- [ ] Implementar Rota `/plans/generate` (FastAPI) retornando estruturado via Pydantic.
- [ ] Conectar o NestJS ao FastAPI: NestJS repassa requests `/generate` para o AI Service.

## Fase 4: Frontend (Mobile / Expo)

### Batch 8: Frontend Setup & Auth Flow
- [ ] Configurar Expo Router e estrutura de pastas (features/shared).
- [ ] Extrair design system do Figma via MCP (Cores, Tipografia, Spacing) e colocar no SASS.
- [ ] Configurar Zustand store para autenticação (`authStore`).
- [ ] Configurar React Query, `apiClient` global e interceptor de sessão expirada.
- [ ] Implementar Telas: `access-portal.tsx`, `login.tsx`, `register.tsx`.
- [ ] Testar fluxo end-to-end de Login e Registro e persistência do iron-session cookie.

### Batch 9: Onboarding UI
- [ ] Implementar layout base do `StepCard` e `ProgressBar`.
- [ ] Desenvolver Steps: goal, body, activity, diet, schedule.
- [ ] Coletar estado global no Zustand (`onboardingStore`).
- [ ] Desenvolver `step-generating` com animação skeleton/spinner chamando endpoint backend.

### Batch 10: App Principal — Tabs & Progress
- [ ] Criar a estrutura do Tab Bar Nativo.
- [ ] Implementar `Home` (Resumo do dia).
- [ ] Instalar `Victory Native` e implementar Gráfico de Progresso Semanal (Pizza).
- [ ] Implementar a aba `Fitness Overview` carregando dados dos planos (React Query).

### Batch 11: To-Do List & Interações Avançadas
- [ ] Desenvolver a aba `To-do List` com `DatePicker`.
- [ ] Implementar lista com Checkboxes simulando feedback (optimistic update via React Query).
- [ ] Instalar `react-native-draggable-flatlist`.
- [ ] Implementar listagem detalhada de Dietas e Treinos suportando drag and drop para reordenação local e envio ao servidor.

### Batch 12: Chat & SSE Stream
- [ ] Implementar UI principal da aba de Chat (`chat/index.tsx` e `chat/[id].tsx`).
- [ ] Criar componente `StreamingText` adaptável a SSE.
- [ ] Conectar hook customizado `useSSE` à API FastAPI repassada via NestJS.
- [ ] Testar fluxo dinâmico: conversar com IA e testar comandos específicos (ex: "ajusta meu treino").

### Batch 13: Finalização & Polish
- [ ] Implementar tela `subscription.tsx` chamando checkout Stripe.
- [ ] Implementar fallback visual para estado sem rede.
- [ ] Revisão geral do código garantindo princípios de Clean Code e remoção de logs sensíveis.
- [ ] Gerar APK / TestFlight interno para Quality Assurance final.
