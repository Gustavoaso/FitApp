# Discovery Notes — Fitnesis
> Arquivo gerado automaticamente durante o workflow /build-saas.
> Fonte de verdade para geração dos PRDs. Não edite manualmente.

## Visão
- **Problema**: Apps fitness são fragmentados — cada um faz uma coisa (dieta, treino, coaching). O usuário precisa de vários apps e não consegue uma experiência integrada e personalizada.
- **Proposta de valor**: O Fitnesis entrega tudo em um só lugar: plano de dieta + plano de treino personalizados baseados na rotina, hábitos alimentares e estilo de vida do usuário. Além disso, inclui um personal coach com IA que incentiva, lembra de refeições e treinos, adiciona tarefas na agenda do celular, envia notificações e se adapta dinamicamente ao feedback em tempo real do usuário.
- **Diferenciais**: Nutricionista + Personal Trainer + Personal Coach em um único app. Adaptação dinâmica baseada no feedback contínuo do usuário (o que cumpriu ou não).
- **Público-alvo**: Qualquer pessoa que queira melhorar saúde e condicionamento físico, sem restrição de nível (iniciantes, intermediários e avançados).
- **Referências**: MyFitnessPal (tracking de calorias) + Freeletics (treinos com IA) + Fitbod (planos de treino personalizados) + Whoop (coaching + métricas). O Fitnesis é a fusão de todos em uma experiência unificada e adaptativa.
- **Pitch**: "Seu nutricionista, personal trainer e coach de hábitos em um único app com IA que se adapta à sua rotina em tempo real."

## Funcionalidades
- **Feature 1 — Onboarding inteligente**: Usuário responde perguntas sobre rotina, hábitos alimentares, nível de atividade e objetivos. A IA usa essas informações para gerar os planos.
- **Feature 2 — Plano de dieta + plano de treino personalizados**: IA gera dois documentos completos e personalizados baseados no perfil do usuário.
- **Feature 3 — Feedback diário e adaptação**: Usuário marca tarefas como cumpridas ou não (refeições, treinos). O app se adapta dinamicamente, ajustando os planos conforme o progresso real.
- **IA**: Core do produto. A IA é responsável por gerar planos de dieta e treino, fazer coaching, enviar lembretes e adaptar tudo dinamicamente com base no feedback do usuário.
- **Upload**: Nenhum no MVP. Pode ser adicionado futuramente (fotos de progresso, refeições, exames).
- **Integrações externas**:
  - 💳 Stripe (pagamento/assinatura)
  - 📅 Google Calendar (adicionar treinos e refeições na agenda)
  - 🔔 Push Notifications (lembretes de refeições, treinos e tarefas)
  - 🤖 API de LLM — OpenAI/Anthropic (geração de planos, coaching, adaptação)

## Monetização
- **Modelo**: Freemium + Pay-per-customization + Assinatura mensal
- **Free tier**:
  - Onboarding + geração do plano básico de dieta e treino (grátis)
  - Se não gostar do plano, pode pagar R$ 7,00 para customizar AQUELE plano específico
  - Customização via IA: o agente refaz o plano com as alterações solicitadas — permitido SOMENTE 1 vez por plano (por R$ 7)
  - Customização manual: o usuário pode editar manualmente o plano quantas vezes quiser (sem custo extra após pagar os R$ 7)
- **Assinatura mensal (Pro)**:
  - R$ 29,90/mês
  - Customização via IA e manual INCLUSA no plano — sem taxa extra de R$ 7
  - Acesso a todas as funcionalidades premium

## Técnico
- **Arquitetura**: Monorepo + Turborepo + pnpm
- **Frontend**: React Native + Expo + TypeScript + SASS + Zustand (state) + React Query (data fetching) + Feature-based architecture
- **Backend**: NestJS + TypeScript + Prisma ORM + Docker
- **IA**: LangGraph (Python) — serviço separado dentro do monorepo
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + RLS + iron-session
- **Pagamento**: Stripe
- **Hosting**: EAS (Expo Application Services) para frontend | Railway para backend
- **Observações**: O backend NestJS se comunica com o serviço LangGraph (Python) para operações de IA. Docker para containerização do backend.

## Contexto
- **Plataforma**: App mobile nativo (React Native + Expo)
- **Referência visual**: Protótipo no Figma — https://www.figma.com/design/WUhkSiole2vcdudDl8dFK7/Fitnesis?node-id=0-1&p=f&t=QXmfBbAgnhVOwKH5-0
- **Nota**: O Figma será lido via MCP (figma-console) para extrair design system, componentes e layout nas etapas de frontend.
- **Prazo MVP**: 2-4 semanas (mínimo viável, rápido)
- **Escopo V1**:
  1. Chat com AI Agent (personal coach)
  2. Geração de planos de treino e dieta (via IA)
  3. Customização dos planos (paga R$7 no free / inclusa no Pro)
  4. To-do list com refeições e treinos (feedback de cumprimento)
  5. Integração com calendário nativo do celular
  6. Criação automática de tarefas no calendário
- **Para V2+ (futuro)**: Upload de fotos (progresso, refeições), push notifications avançadas, gamificação, métricas/gráficos de evolução

## PRD — User Stories

### Onboarding
1. Como **usuário novo**, quero responder perguntas sobre minha rotina, hábitos e objetivos, para que a IA gere planos personalizados pra mim.
   - *Aceite*: Onboarding completo com pelo menos: objetivo, nível de atividade, restrições alimentares, horários disponíveis. Ao finalizar, planos são gerados automaticamente.

### Planos de Dieta e Treino
2. Como **usuário**, quero receber um plano de dieta completo gerado pela IA, para saber o que comer em cada refeição do dia.
   - *Aceite*: Plano gerado com refeições organizadas por dia/horário, com alimentos, quantidades e macros.
3. Como **usuário**, quero receber um plano de treino completo gerado pela IA, para saber quais exercícios fazer, séries e repetições.
   - *Aceite*: Plano com exercícios organizados por dia da semana, com séries, reps, tempo de descanso.

### Customização
4. Como **usuário free**, quero poder pagar R$ 7 para customizar um plano específico via IA, para ajustar o que não gostei.
   - *Aceite*: Pagamento processado via Stripe, IA regenera o plano 1 vez com as alterações solicitadas.
5. Como **usuário free**, quero poder editar manualmente meu plano após pagar a customização, para fazer ajustes finos.
   - *Aceite*: Edição manual ilimitada após pagamento da taxa de customização.
6. Como **assinante Pro**, quero customizar meus planos via IA e manualmente sem custo extra, para ter flexibilidade total.
   - *Aceite*: Customizações via IA ilimitadas, sem cobrança adicional.

### Chat com IA
7. Como **usuário**, quero conversar com o AI Agent (personal coach), para tirar dúvidas, pedir orientações e receber incentivo.
   - *Aceite*: Chat em tempo real com streaming de resposta (SSE), contexto do perfil e planos do usuário.

### To-do List
8. Como **usuário**, quero ver uma to-do list diária com minhas refeições e treinos, para acompanhar o que preciso fazer.
   - *Aceite*: Lista organizada por horário, com checkbox pra marcar como cumprido/não cumprido.
9. Como **usuário**, quero dar feedback marcando tarefas como cumpridas ou não, para que o app se adapte à minha realidade.
   - *Aceite*: Feedback salvo, IA considera o histórico de cumprimento nas futuras adaptações.

### Calendário
10. Como **usuário**, quero que o app adicione automaticamente minhas refeições e treinos no calendário nativo do celular, para não esquecer.
    - *Aceite*: Eventos criados no calendário nativo com título, horário e descrição.

### Auth & Billing
11. Como **usuário**, quero criar conta e fazer login de forma segura, para acessar meus planos e dados.
    - *Aceite*: Registro/login via Supabase Auth, sessão gerenciada com iron-session.
12. Como **usuário**, quero assinar o plano Pro (R$ 29,90/mês) para ter acesso a todas as funcionalidades premium.
    - *Aceite*: Checkout via Stripe, assinatura ativa refletida no perfil, acesso liberado imediatamente.

## PRD — Requisitos Funcionais

### Auth
| ID | Requisito |
|---|---|
| RF-01 | Registro com email + senha via Supabase Auth |
| RF-02 | Login com email + senha, sessão gerenciada por iron-session (cookie httpOnly) |
| RF-03 | Logout com destruição da sessão |
| RF-04 | Proteção de rotas — usuário não autenticado é redirecionado para login |
| RF-05 | Recuperação de senha via email |

### Onboarding & IA
| ID | Requisito |
|---|---|
| RF-06 | Fluxo de onboarding com perguntas step-by-step (objetivo, nível, restrições alimentares, horários, peso, altura, idade) |
| RF-07 | Salvar perfil do usuário com todas as respostas do onboarding |
| RF-08 | IA gera plano de dieta personalizado ao finalizar o onboarding |
| RF-09 | IA gera plano de treino personalizado ao finalizar o onboarding |
| RF-10 | Chat com AI Agent (personal coach) em tempo real via SSE |
| RF-11 | AI Agent tem acesso ao contexto do perfil, planos e histórico de tarefas do usuário |

### Planos & Customização
| ID | Requisito |
|---|---|
| RF-12 | Visualizar plano de dieta completo (refeições por dia, alimentos, macros) |
| RF-13 | Visualizar plano de treino completo (exercícios por dia, séries, reps, descanso) |
| RF-14 | Usuário free pode pagar R$ 7 (Stripe) pra desbloquear customização de um plano específico |
| RF-15 | Customização via IA: agente regenera o plano com alterações — 1x por plano (free) |
| RF-16 | Customização manual: usuário edita campos do plano diretamente (ilimitado após pagamento) |
| RF-17 | Assinante Pro: customização via IA e manual sem cobrança extra |

### To-do List & Feedback
| ID | Requisito |
|---|---|
| RF-18 | Gerar to-do list diária automática com refeições e treinos do plano |
| RF-19 | Checkbox pra marcar cada tarefa como cumprida ou não cumprida |
| RF-20 | Salvar histórico de cumprimento por dia |
| RF-21 | IA considera histórico de feedback nas futuras adaptações dos planos |

### Calendário
| ID | Requisito |
|---|---|
| RF-22 | Integrar com calendário nativo do celular (iOS/Android) |
| RF-23 | Criar eventos automáticos para cada refeição e treino (título, horário, descrição) |
| RF-24 | Atualizar eventos no calendário quando o plano for alterado |

### Billing
| ID | Requisito |
|---|---|
| RF-25 | Checkout de pagamento avulso (R$ 7 por customização) via Stripe |
| RF-26 | Checkout de assinatura mensal Pro (R$ 29,90/mês) via Stripe |
| RF-27 | Webhook do Stripe pra confirmar pagamento e ativar funcionalidades |
| RF-28 | Cancelamento de assinatura pelo usuário |
| RF-29 | Controle de acesso baseado no plano (free vs Pro) |

## PRD — Requisitos Não-Funcionais

### Segurança
| ID | Requisito |
|---|---|
| RNF-01 | Todas as tabelas Supabase com RLS habilitado e políticas por `user_id` |
| RNF-02 | Sessão via iron-session (cookie httpOnly, secure, sameSite=lax) |
| RNF-03 | Backend valida `X-User-Id` header em todas as rotas protegidas |
| RNF-04 | CORS restritivo — aceitar apenas origens do app mobile |
| RNF-05 | Validação de input em todas as rotas (class-validator no NestJS) |
| RNF-06 | Webhook do Stripe com validação de assinatura antes de processar |
| RNF-07 | Rate limiting por `user_id` em rotas sensíveis (auth, chat IA, billing) |
| RNF-08 | Secrets exclusivamente em `.env` — nunca hardcoded |

### Performance
| ID | Requisito |
|---|---|
| RNF-09 | Respostas de API em < 500ms (exceto geração de planos via IA) |
| RNF-10 | Streaming de respostas do AI Agent via SSE — nunca esperar resposta completa |
| RNF-11 | Paginação em listas (histórico de chat, tarefas) |
| RNF-12 | Cache de dados estáticos com React Query (staleTime configurado) |
| RNF-13 | Timeout configurado em chamadas externas (Supabase, Stripe, LLM) |

### UX
| ID | Requisito |
|---|---|
| RNF-14 | App responsivo para diferentes tamanhos de tela mobile |
| RNF-15 | Loading states em todas as operações assíncronas (skeletons, spinners) |
| RNF-16 | Feedback visual em ações do usuário (toasts, animações) |
| RNF-17 | Navegação fluida com transições suaves |
| RNF-18 | Offline-friendly: mostrar última versão dos planos mesmo sem conexão |

### Código & Infra
| ID | Requisito |
|---|---|
| RNF-19 | Monorepo com Turborepo — builds e lints em paralelo |
| RNF-20 | TypeScript strict mode em todo o codebase (sem `any`) |
| RNF-21 | Arquitetura feature-based no frontend |
| RNF-22 | Docker para containerização do backend |
| RNF-23 | `.env.example` com todas as variáveis necessárias (sem valores reais) |

### Documentação & Clean Code
| ID | Requisito |
|---|---|
| RNF-24 | API documentada com Swagger (NestJS @nestjs/swagger) — auto-gerada a partir dos DTOs |
| RNF-25 | Zero comentários na codebase — código deve ser autoexplicativo (clean code) |
| RNF-26 | Princípios de Clean Code: nomes descritivos, funções pequenas (máx 20 linhas), single responsibility |
| RNF-27 | README.md atualizado com setup, features e instruções de desenvolvimento |

## Database — Entidades e Relações

### Decisões de modelagem
- **Restrições alimentares**: Array de strings pré-definidas (enum)
- **Soft delete**: Em `user_profiles`, `diet_plans`, `workout_plans` (campos importantes). Hard delete em `chat_messages`, `daily_tasks`.
- **Versionamento**: Apenas ao customizar via IA — `parent_plan_id` guarda referência ao plano original.

### Tabelas

#### user_profiles
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK, default gen_random_uuid() |
| user_id | UUID | FK → auth.users(id), UNIQUE, NOT NULL |
| full_name | VARCHAR(255) | NOT NULL |
| age | INTEGER | NOT NULL |
| weight_kg | DECIMAL(5,2) | NOT NULL |
| height_cm | DECIMAL(5,2) | NOT NULL |
| gender | ENUM | male, female, other |
| fitness_goal | ENUM | lose_weight, gain_muscle, maintain, improve_health, gain_endurance |
| activity_level | ENUM | sedentary, light, moderate, active, very_active |
| dietary_restrictions | TEXT[] | vegetarian, vegan, gluten_free, lactose_free, low_carb, none |
| available_days | TEXT[] | monday, tuesday, etc. |
| available_time_minutes | INTEGER | Tempo por sessão de treino |
| wake_up_time | TIME | |
| sleep_time | TIME | |
| onboarding_completed | BOOLEAN | default false |
| created_at | TIMESTAMPTZ | default now() |
| updated_at | TIMESTAMPTZ | default now() |
| deleted_at | TIMESTAMPTZ | nullable, soft delete |

#### diet_plans
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users(id), NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| total_daily_calories | INTEGER | |
| is_customized | BOOLEAN | default false |
| customization_paid | BOOLEAN | default false |
| ai_customization_used | BOOLEAN | default false |
| version | INTEGER | default 1 |
| parent_plan_id | UUID | FK → diet_plans(id), nullable |
| status | ENUM | active, archived |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | soft delete |

#### diet_plan_meals
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK |
| diet_plan_id | UUID | FK → diet_plans(id), ON DELETE CASCADE |
| meal_type | ENUM | breakfast, morning_snack, lunch, afternoon_snack, dinner, evening_snack |
| scheduled_time | TIME | |
| foods | JSONB | Array de { name, quantity, unit, calories, protein, carbs, fat } |
| total_calories | INTEGER | |
| total_protein | DECIMAL(6,2) | |
| total_carbs | DECIMAL(6,2) | |
| total_fat | DECIMAL(6,2) | |
| day_of_week | ENUM | monday a sunday |
| sort_order | INTEGER | |
| created_at | TIMESTAMPTZ | |

#### workout_plans
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users(id), NOT NULL |
| title | VARCHAR(255) | NOT NULL |
| description | TEXT | |
| difficulty_level | ENUM | beginner, intermediate, advanced |
| is_customized | BOOLEAN | default false |
| customization_paid | BOOLEAN | default false |
| ai_customization_used | BOOLEAN | default false |
| version | INTEGER | default 1 |
| parent_plan_id | UUID | FK → workout_plans(id), nullable |
| status | ENUM | active, archived |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| deleted_at | TIMESTAMPTZ | soft delete |

#### workout_plan_exercises
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK |
| workout_plan_id | UUID | FK → workout_plans(id), ON DELETE CASCADE |
| exercise_name | VARCHAR(255) | NOT NULL |
| muscle_group | VARCHAR(100) | |
| sets | INTEGER | |
| reps | VARCHAR(50) | ex: 12, 8-12, até falha |
| rest_seconds | INTEGER | |
| duration_minutes | INTEGER | Para cardio |
| notes | TEXT | |
| day_of_week | ENUM | monday a sunday |
| sort_order | INTEGER | |
| created_at | TIMESTAMPTZ | |

#### daily_tasks
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users(id), NOT NULL |
| task_date | DATE | NOT NULL |
| task_type | ENUM | meal, workout |
| reference_id | UUID | FK → diet_plan_meals ou workout_plan_exercises |
| title | VARCHAR(255) | |
| scheduled_time | TIME | |
| is_completed | BOOLEAN | default false |
| completed_at | TIMESTAMPTZ | nullable |
| created_at | TIMESTAMPTZ | |

#### chat_conversations
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users(id), NOT NULL |
| title | VARCHAR(255) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### chat_messages
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK |
| conversation_id | UUID | FK → chat_conversations(id), ON DELETE CASCADE |
| role | ENUM | user, assistant |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | |

#### subscriptions
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users(id), UNIQUE, NOT NULL |
| stripe_customer_id | VARCHAR(255) | NOT NULL |
| stripe_subscription_id | VARCHAR(255) | nullable |
| plan_type | ENUM | free, pro |
| status | ENUM | active, canceled, past_due, trialing |
| current_period_start | TIMESTAMPTZ | |
| current_period_end | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### plan_customizations
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users(id), NOT NULL |
| plan_type | ENUM | diet, workout |
| plan_id | UUID | NOT NULL |
| stripe_payment_intent_id | VARCHAR(255) | NOT NULL |
| amount_cents | INTEGER | 700 |
| status | ENUM | pending, paid, failed |
| created_at | TIMESTAMPTZ | |

#### calendar_events
| Campo | Tipo | Detalhes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → auth.users(id), NOT NULL |
| task_id | UUID | FK → daily_tasks(id), NOT NULL |
| native_event_id | VARCHAR(255) | ID do evento no calendário nativo |
| event_title | VARCHAR(255) | |
| event_date | DATE | |
| event_time | TIME | |
| synced_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ | |

### RLS Policies
- Todas as tabelas com `user_id`: SELECT, INSERT, UPDATE, DELETE filtrado por `auth.uid() = user_id`
- Tabelas filhas (meals, exercises, messages): acesso via JOIN com tabela pai (`diet_plans.user_id`, `workout_plans.user_id`, `chat_conversations.user_id`)

### Triggers
- `updated_at` auto-update em: user_profiles, diet_plans, workout_plans, chat_conversations, subscriptions
- `auto_create_subscription` — ao criar usuário, cria subscription com plan_type = 'free'

### Indexes
- user_profiles(user_id) — UNIQUE
- diet_plans(user_id, status)
- workout_plans(user_id, status)
- daily_tasks(user_id, task_date)
- chat_messages(conversation_id, created_at)
- subscriptions(user_id) — UNIQUE
- subscriptions(stripe_customer_id)
- plan_customizations(user_id, plan_id)

### Seed Data
- Stripe products: Customização de Plano (R$ 7,00 one_time), Pro Mensal (R$ 29,90/mês)

### Diagrama ER
```
auth.users 1──1 user_profiles
auth.users 1──N diet_plans
auth.users 1──N workout_plans
auth.users 1──N daily_tasks
auth.users 1──N chat_conversations
auth.users 1──1 subscriptions
auth.users 1──N plan_customizations
auth.users 1──N calendar_events
diet_plans 1──N diet_plan_meals
diet_plans 1──1 diet_plans (parent_plan_id)
workout_plans 1──N workout_plan_exercises
workout_plans 1──1 workout_plans (parent_plan_id)
chat_conversations 1──N chat_messages
daily_tasks 1──1 calendar_events
```

## Backend — Endpoints e Integrações

### Decisões
- Nenhuma infra extra pro MVP (sem Redis, sem filas). Geração de planos síncrona via SSE.
- LLM provider flexível via env var, começando com Google Gemini.
- SSE para streaming de respostas da IA.

### Estrutura de Pastas
```
apps/
  backend/                    ← NestJS
    src/
      auth/                   (module, controller, service, dto/, guards/)
      user-profile/           (module, controller, service, dto/)
      diet-plan/              (module, controller, service, dto/)
      workout-plan/           (module, controller, service, dto/)
      daily-task/             (module, controller, service, dto/)
      chat/                   (module, controller, service, dto/)
      billing/                (module, controller, service, stripe-webhook.controller, dto/)
      calendar/               (module, controller, service, dto/)
      common/                 (guards/, interceptors/, filters/, decorators/, pipes/)
      prisma/                 (module, service, schema.prisma)
    Dockerfile
    .env.example

  ai-service/                 ← LangGraph (Python) + FastAPI
    agent/
      graph.py, state.py
      nodes/                  (generate_diet_plan, generate_workout_plan, customize_plan, analyze_progress, chat_router)
      tools/                  (get_user_context, generate_diet_plan, generate_workout_plan, customize_plan, analyze_user_progress)
      prompts/                (diet_plan_prompt.md, workout_plan_prompt.md, coach_system_prompt.md, customization_prompt.md)
    api/
      main.py                 (FastAPI wrapper)
      routes/                 (chat.py, plans.py)
      schemas/
    requirements.txt
    Dockerfile
```

### Endpoints

#### Auth
| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | /auth/register | Registro com email + senha | ❌ |
| POST | /auth/login | Login, retorna cookie iron-session | ❌ |
| POST | /auth/logout | Destrói sessão | ✅ |
| POST | /auth/forgot-password | Envia email de recuperação | ❌ |
| GET | /auth/me | Retorna usuário logado | ✅ |

#### User Profile
| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | /user-profile | Cria perfil (onboarding) | ✅ |
| GET | /user-profile | Retorna perfil do usuário | ✅ |
| PATCH | /user-profile | Atualiza perfil | ✅ |

#### Diet Plans
| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | /diet-plans/generate | Gera plano via IA | ✅ |
| GET | /diet-plans | Lista planos do usuário | ✅ |
| GET | /diet-plans/:id | Detalhe com meals | ✅ |
| PATCH | /diet-plans/:id | Edição manual | ✅ |
| POST | /diet-plans/:id/customize | Customização via IA | ✅ |
| DELETE | /diet-plans/:id | Soft delete | ✅ |

#### Workout Plans
| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | /workout-plans/generate | Gera plano via IA | ✅ |
| GET | /workout-plans | Lista planos do usuário | ✅ |
| GET | /workout-plans/:id | Detalhe com exercícios | ✅ |
| PATCH | /workout-plans/:id | Edição manual | ✅ |
| POST | /workout-plans/:id/customize | Customização via IA | ✅ |
| DELETE | /workout-plans/:id | Soft delete | ✅ |

#### Daily Tasks
| Método | Path | Descrição | Auth |
|---|---|---|---|
| GET | /daily-tasks?date=YYYY-MM-DD | Lista tarefas de um dia | ✅ |
| PATCH | /daily-tasks/:id/complete | Marca como cumprida | ✅ |
| PATCH | /daily-tasks/:id/uncomplete | Desmarca | ✅ |
| POST | /daily-tasks/generate | Gera tarefas do dia | ✅ |

#### Chat
| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | /chat/conversations | Cria nova conversa | ✅ |
| GET | /chat/conversations | Lista conversas | ✅ |
| GET | /chat/conversations/:id/messages | Lista mensagens (paginado) | ✅ |
| POST | /chat/conversations/:id/messages | Envia mensagem + resposta via SSE | ✅ |

#### Billing
| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | /billing/create-checkout | Cria checkout Stripe | ✅ |
| GET | /billing/subscription | Status da assinatura | ✅ |
| POST | /billing/cancel-subscription | Cancela Pro | ✅ |
| POST | /billing/webhook | Webhook Stripe | ❌ (validação por assinatura) |

#### Calendar
| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | /calendar/sync | Sincroniza com calendário nativo | ✅ |
| GET | /calendar/events | Lista eventos sincronizados | ✅ |

### Auth Middleware
- Mobile App → NestJS (iron-session cookie) → AuthGuard decripta → extrai user_id → @UserId() decorator
- NestJS → AI Service: envia X-User-Id header → FastAPI valida via dependency injection

### Padrões
- Error handling: Global exception filter, mensagens seguras
- Logging: NestJS built-in logger, structured JSON
- DTOs: class-validator + class-transformer
- Swagger: @nestjs/swagger auto-gerado

## Backend — Agent Graph

### Tools do Agente
1. `generate_diet_plan` — gera plano de dieta personalizado
2. `generate_workout_plan` — gera plano de treino personalizado
3. `customize_plan` — regenera plano com alterações do usuário
4. `analyze_user_progress` — analisa histórico de tarefas cumpridas/não
5. `get_user_context` — busca perfil, planos e histórico

### Fluxo
- **Geração de planos (onboarding)**: Linear — recebe perfil → gera dieta → gera treino → retorna
- **Chat (personal coach)**: Dinâmico — Router decide qual tool usar baseado na intenção do usuário

### Graph
```
[Entrada] → [Router] → Chat Reply | Generate Plans | Customize Plan | Analyze Progress | Get Context → [Response via SSE]
```

### State
user_id, conversation_history, user_profile, active_plans, task_history, current_intent

### LLM
- Provider flexível via env var (LangGraph abstrai o modelo)
- Início com Google Gemini
- Prompts em arquivos .md separados (nunca hardcoded)

## Frontend — Páginas e Componentes

### Navegação

#### Auth (Stack separado — não autenticado)
- access-portal.tsx — tela inicial com opções de login/register
- login.tsx
- register.tsx
- forgot-password.tsx

#### Onboarding (Stack pós-registro — 1ª vez)
- step-goal.tsx (objetivo)
- step-body.tsx (peso, altura, idade, gênero)
- step-activity.tsx (nível de atividade)
- step-diet.tsx (restrições alimentares)
- step-schedule.tsx (dias disponíveis, horários, tempo por treino)
- step-generating.tsx (loading enquanto IA gera planos)

#### App Principal — Stack Navigation (telas comuns)
- home.tsx — 🏠 tela inicial, resumo do dia
- chat/index.tsx — 💬 lista de conversas com AI Agent
- chat/[id].tsx — conversa individual com streaming
- profile.tsx — 👤 dados do perfil, configurações
- subscription.tsx — 💳 gerenciar assinatura Pro
- plans/diet/[id].tsx — detalhe do plano de dieta
- plans/workout/[id].tsx — detalhe do plano de treino
- plans/customize.tsx — customização de plano (manual + IA)

#### App Principal — Tab Bar (4 tabs)
| Tab | Tela | Descrição |
|---|---|---|
| 💪 Fitness Overview | fitness-overview.tsx | Planos de dieta e treino + gráficos de métricas (Victory Native) |
| 📅 Calendar | calendar.tsx | Calendário com eventos de refeições e treinos |
| ✅ To-do List | todo-list.tsx | Tarefas diárias com checkboxes e date picker |
| ❓ Help | help.tsx | Telas de ajuda e suporte |

### Árvore de Componentes (Feature-based)
```
src/
  features/
    auth/
      components/             (LoginForm, RegisterForm, AccessPortalCard)
      hooks/                  (useAuth, useSession)
      services/               (authService)
      store/                  (authStore — Zustand)
    onboarding/
      components/             (StepCard, ProgressBar, OptionSelector)
      hooks/                  (useOnboarding)
      store/                  (onboardingStore)
    diet-plan/
      components/             (DietPlanCard, MealCard, FoodItem, MacrosBadge)
      hooks/                  (useDietPlans, useDietPlanDetail)
      services/               (dietPlanService)
    workout-plan/
      components/             (WorkoutPlanCard, ExerciseCard, MuscleGroupBadge)
      hooks/                  (useWorkoutPlans, useWorkoutPlanDetail)
      services/               (workoutPlanService)
    daily-task/
      components/             (TaskList, TaskItem, DatePicker, CompletionBadge)
      hooks/                  (useDailyTasks, useTaskCompletion)
      services/               (dailyTaskService)
    chat/
      components/             (ChatBubble, MessageInput, StreamingText, ConversationCard)
      hooks/                  (useChat, useSSE)
      services/               (chatService)
    billing/
      components/             (PlanComparisonCard, CheckoutButton, SubscriptionBadge)
      hooks/                  (useSubscription, useCheckout)
      services/               (billingService)
    calendar/
      components/             (CalendarView, EventCard)
      hooks/                  (useCalendarSync, useCalendarEvents)
      services/               (calendarService)
    progress/
      components/             (PieChart, WeeklyComplianceChart, MacroBreakdown, CategoryChart)
      hooks/                  (useProgressData)
    help/
      components/             (HelpCard, FAQItem)

  shared/
    components/               (Button, Input, Card, Modal, Toast, Skeleton, DragHandle)
    hooks/                    (useApi, useDebounce)
    services/                 (apiClient — fetch wrapper com auth)
    styles/                   (theme.ts, colors.ts, typography.ts, spacing.ts)
    types/                    (tipos globais)
    utils/                    (formatters, validators)
    constants/                (enums, config)
```

### Camada de API
- **apiClient**: Fetch wrapper com iron-session cookie automático
- **React Query**: Hooks por feature (useQuery + useMutation), staleTime configurado
- **SSE**: Hook useSSE customizado pra streaming do chat
- **Zustand**: State local por feature (auth, onboarding)

### Componentes Especiais
- **Victory Native**: Gráficos de pizza — % semanal de dieta e treino seguidos. Grupos: musculação, cardio, água, macros, micronutrientes
- **react-native-draggable-flatlist**: Drag & drop pra reordenar refeições e exercícios
- **StreamingText**: Renderiza tokens do chat conforme chegam via SSE

### Sem landing page — app logado direto

## Frontend — Design System

### Cores
- Extraídas do protótipo Figma via MCP (figma-console)

### Tipografia
- Extraída do protótipo Figma via MCP

### Spacing
- Sistema de 4px: 4, 8, 12, 16, 24, 32, 48

### Bibliotecas UI
- Victory Native (gráficos)
- react-native-draggable-flatlist (drag & drop)
- SASS (estilização)

## Security — Decisões

### Auth
- Email + senha via Supabase Auth
- OAuth social: Google + Apple (exigido pela App Store)
- Sessão via iron-session (cookie httpOnly, secure, sameSite=lax)
- SESSION_SECRET 32+ chars em env var

### Rate Limiting
- 100 req/min por user_id (geral)
- 200 req/min para SSE/chat (exceção)

### Checklist de Segurança
- [ ] iron-session configurado (httpOnly, secure, sameSite=lax)
- [ ] SESSION_SECRET 32+ chars em .env
- [ ] Supabase Auth configurado (email + Google + Apple)
- [ ] RLS habilitado em TODAS as tabelas
- [ ] Policies SELECT/INSERT/UPDATE/DELETE por user_id em cada tabela
- [ ] AuthGuard no NestJS validando cookie em rotas protegidas
- [ ] X-User-Id header enviado pro AI Service
- [ ] FastAPI validando X-User-Id via dependency injection
- [ ] CORS restritivo (apenas origens do app mobile)
- [ ] class-validator em todos os DTOs do NestJS
- [ ] Stripe webhook com validação de assinatura
- [ ] Rate limiting configurado (100 req/min geral, 200 req/min chat)
- [ ] Secrets em .env — nunca hardcoded
- [ ] .env.example com todas as variáveis (sem valores reais)
- [ ] Console.log sem dados sensíveis (tokens, emails, IDs internos)
- [ ] Erros sem stack traces ou SQL expostos ao frontend

### Auth Flow
1. **Register**: Usuário cria conta (email/senha ou Google/Apple) → Supabase Auth cria user → auto_create_subscription trigger → subscription free criada → redireciona pro onboarding
2. **Login**: Usuário autentica → iron-session grava cookie httpOnly → redireciona pro app
3. **Logout**: Destrói sessão iron-session → redireciona pro login
4. **Session expired**: Cookie expira → app detecta 401 → redireciona pro login

### .env.example
```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
SESSION_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=
STRIPE_CUSTOMIZATION_PRICE_ID=

# AI Service
AI_SERVICE_URL=
LLM_PROVIDER=
LLM_API_KEY=
LLM_MODEL=

# App
APP_URL=
NODE_ENV=
PORT=
```
