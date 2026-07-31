# PRD Backend — Fitnesis

> "Seu nutricionista, personal trainer e coach de hábitos em um único app com IA que se adapta à sua rotina em tempo real."

## 1. Resumo do Produto

O Fitnesis é um app mobile (React Native + Expo) que unifica dieta, treino e coaching em uma experiência integrada com IA. O backend é composto por dois serviços: **NestJS** (API principal) e **AI Service** (LangGraph + FastAPI para operações de IA).

### Público-alvo
Qualquer pessoa que queira melhorar saúde e condicionamento físico, sem restrição de nível.

### Monetização
- **Free**: Onboarding + geração de planos grátis. Customização via IA custa R$ 7/plano (1x).
- **Pro** (R$ 29,90/mês): Customização ilimitada via IA e manual.

---

## 2. Stack Técnica

| Componente | Tecnologia |
|---|---|
| Monorepo | Turborepo + pnpm |
| API Principal | NestJS + TypeScript + Prisma ORM |
| AI Service | LangGraph (Python) + FastAPI |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email + Google + Apple) + iron-session |
| Pagamento | Stripe |
| Containerização | Docker |
| Hosting | Railway |
| Documentação API | Swagger (@nestjs/swagger) |

---

## 3. Requisitos Funcionais

### 3.1 Auth
| ID | Requisito |
|---|---|
| RF-01 | Registro com email + senha via Supabase Auth |
| RF-02 | Login com email + senha, sessão gerenciada por iron-session (cookie httpOnly) |
| RF-03 | OAuth social: Google + Apple Sign In |
| RF-04 | Logout com destruição da sessão |
| RF-05 | Proteção de rotas — usuário não autenticado recebe 401 |
| RF-06 | Recuperação de senha via email |

### 3.2 Onboarding & IA
| ID | Requisito |
|---|---|
| RF-07 | Fluxo de onboarding com perguntas step-by-step (objetivo, nível, restrições alimentares, horários, peso, altura, idade) |
| RF-08 | Salvar perfil do usuário com todas as respostas do onboarding |
| RF-09 | IA gera plano de dieta personalizado ao finalizar o onboarding |
| RF-10 | IA gera plano de treino personalizado ao finalizar o onboarding |
| RF-11 | Chat com AI Agent (personal coach) em tempo real via SSE |
| RF-12 | AI Agent tem acesso ao contexto do perfil, planos e histórico de tarefas do usuário |

### 3.3 Planos & Customização
| ID | Requisito |
|---|---|
| RF-13 | Visualizar plano de dieta completo (refeições por dia, alimentos, macros) |
| RF-14 | Visualizar plano de treino completo (exercícios por dia, séries, reps, descanso) |
| RF-15 | Usuário free pode pagar R$ 7 (Stripe) pra desbloquear customização de um plano específico |
| RF-16 | Customização via IA: agente regenera o plano com alterações — 1x por plano (free) |
| RF-17 | Customização manual: usuário edita campos do plano diretamente (ilimitado após pagamento) |
| RF-18 | Assinante Pro: customização via IA e manual sem cobrança extra |

### 3.4 To-do List & Feedback
| ID | Requisito |
|---|---|
| RF-19 | Gerar to-do list diária automática com refeições e treinos do plano |
| RF-20 | Checkbox pra marcar cada tarefa como cumprida ou não cumprida |
| RF-21 | Salvar histórico de cumprimento por dia |
| RF-22 | IA considera histórico de feedback nas futuras adaptações dos planos |

### 3.5 Calendário
| ID | Requisito |
|---|---|
| RF-23 | Integrar com calendário nativo do celular (iOS/Android) |
| RF-24 | Criar eventos automáticos para cada refeição e treino (título, horário, descrição) |
| RF-25 | Atualizar eventos no calendário quando o plano for alterado |

### 3.6 Billing
| ID | Requisito |
|---|---|
| RF-26 | Checkout de pagamento avulso (R$ 7 por customização) via Stripe |
| RF-27 | Checkout de assinatura mensal Pro (R$ 29,90/mês) via Stripe |
| RF-28 | Webhook do Stripe pra confirmar pagamento e ativar funcionalidades |
| RF-29 | Cancelamento de assinatura pelo usuário |
| RF-30 | Controle de acesso baseado no plano (free vs Pro) |

---

## 4. Database Schema

### Decisões de modelagem
- **Restrições alimentares**: Array de strings pré-definidas (enum)
- **Soft delete**: Em `user_profiles`, `diet_plans`, `workout_plans`. Hard delete em `chat_messages`, `daily_tasks`.
- **Versionamento**: Apenas ao customizar via IA — `parent_plan_id` guarda referência ao plano original.

### 4.1 Tabelas

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

### 4.2 RLS Policies

Todas as tabelas com `user_id`: SELECT, INSERT, UPDATE, DELETE filtrado por `auth.uid() = user_id`.

Tabelas filhas (meals, exercises, messages): acesso via JOIN com tabela pai.

```sql
-- Exemplo: user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "delete_own" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

-- Aplicar o mesmo padrão em: diet_plans, workout_plans, daily_tasks, chat_conversations,
-- subscriptions, plan_customizations, calendar_events

-- Tabelas filhas (acesso via join com parent):
-- diet_plan_meals: via diet_plans.user_id
-- workout_plan_exercises: via workout_plans.user_id
-- chat_messages: via chat_conversations.user_id
```

### 4.3 Triggers

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em: user_profiles, diet_plans, workout_plans, chat_conversations, subscriptions
CREATE TRIGGER set_updated_at BEFORE UPDATE ON user_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create subscription on user creation
CREATE OR REPLACE FUNCTION auto_create_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (id, user_id, plan_type, status, created_at, updated_at)
  VALUES (gen_random_uuid(), NEW.id, 'free', 'active', NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION auto_create_subscription();
```

### 4.4 Indexes

```sql
CREATE UNIQUE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_diet_plans_user_status ON diet_plans(user_id, status);
CREATE INDEX idx_workout_plans_user_status ON workout_plans(user_id, status);
CREATE INDEX idx_daily_tasks_user_date ON daily_tasks(user_id, task_date);
CREATE INDEX idx_chat_messages_conv_created ON chat_messages(conversation_id, created_at);
CREATE UNIQUE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_customer_id);
CREATE INDEX idx_plan_customizations_user_plan ON plan_customizations(user_id, plan_id);
```

### 4.5 Seed Data

```sql
-- Produtos Stripe (criar via Stripe Dashboard ou API)
-- 1. Customização de Plano: R$ 7,00 (one_time)
-- 2. Pro Mensal: R$ 29,90/mês (recurring)
```

### 4.6 Diagrama ER

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
diet_plans 1──1 diet_plans (parent_plan_id → self-reference)
workout_plans 1──N workout_plan_exercises
workout_plans 1──1 workout_plans (parent_plan_id → self-reference)
chat_conversations 1──N chat_messages
daily_tasks 1──1 calendar_events
```

---

## 5. Endpoints

### 5.1 Estrutura de Pastas

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

### 5.2 API Endpoints

#### Auth
| Método | Path | Descrição | Auth |
|---|---|---|---|
| POST | /auth/register | Registro com email + senha ou OAuth | ❌ |
| POST | /auth/login | Login, retorna cookie iron-session | ❌ |
| POST | /auth/logout | Destrói sessão | ✅ |
| POST | /auth/forgot-password | Envia email de recuperação | ❌ |
| GET | /auth/me | Retorna usuário logado | ✅ |
| POST | /auth/oauth/google | Login via Google OAuth | ❌ |
| POST | /auth/oauth/apple | Login via Apple Sign In | ❌ |

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

---

## 6. Agent Graph (LangGraph — Python)

### 6.1 Tools
1. `generate_diet_plan` — gera plano de dieta personalizado
2. `generate_workout_plan` — gera plano de treino personalizado
3. `customize_plan` — regenera plano com alterações do usuário
4. `analyze_user_progress` — analisa histórico de tarefas cumpridas/não
5. `get_user_context` — busca perfil, planos e histórico

### 6.2 Fluxo
- **Geração de planos (onboarding)**: Linear — recebe perfil → gera dieta → gera treino → retorna
- **Chat (personal coach)**: Dinâmico — Router decide qual tool usar baseado na intenção do usuário

### 6.3 Graph

```
[Entrada: mensagem do usuário]
        │
   ┌────▼────┐
   │  Router  │ ← Decide o fluxo baseado na intenção
   └────┬────┘
        │
   ┌────┼──────────┬──────────────┬──────────────┐
   ▼    ▼          ▼              ▼              ▼
 Chat  Generate   Customize    Analyze       Get
 Reply  Plans      Plan        Progress     Context
   │    │          │              │              │
   └────┴──────────┴──────────────┴──────────────┘
        │
   ┌────▼────┐
   │ Response │ ← Formata e retorna via SSE
   └─────────┘
```

### 6.4 State
`user_id`, `conversation_history`, `user_profile`, `active_plans`, `task_history`, `current_intent`

### 6.5 LLM
- Provider flexível via env var (LangGraph abstrai o modelo)
- Início com **Google Gemini**
- Prompts em arquivos `.md` separados (nunca hardcoded)

---

## 7. Auth Middleware

```
Mobile App → NestJS API (iron-session cookie)
  → AuthGuard decripta cookie → extrai user_id
  → Injeta user_id via @UserId() decorator
  → Service usa user_id pra filtrar dados

NestJS → AI Service (Python)
  → NestJS envia X-User-Id header
  → FastAPI valida header via dependency injection
```

### Auth Flow
1. **Register**: Usuário cria conta (email/senha ou Google/Apple) → Supabase Auth cria user → trigger auto_create_subscription → subscription free criada → redireciona pro onboarding
2. **Login**: Usuário autentica → iron-session grava cookie httpOnly → redireciona pro app
3. **Logout**: Destrói sessão iron-session → redireciona pro login
4. **Session expired**: Cookie expira → app detecta 401 → redireciona pro login

---

## 8. Requisitos Não-Funcionais (Backend)

### Segurança
| ID | Requisito |
|---|---|
| RNF-01 | RLS habilitado em todas as tabelas com políticas por user_id |
| RNF-02 | iron-session (httpOnly, secure, sameSite=lax) |
| RNF-03 | X-User-Id header validado em todas as rotas protegidas |
| RNF-04 | CORS restritivo |
| RNF-05 | class-validator em todos os DTOs |
| RNF-06 | Stripe webhook com validação de assinatura |
| RNF-07 | Rate limiting: 100 req/min geral, 200 req/min chat |
| RNF-08 | Secrets em .env — nunca hardcoded |

### Performance
| ID | Requisito |
|---|---|
| RNF-09 | API < 500ms (exceto IA) |
| RNF-10 | Streaming via SSE |
| RNF-11 | Paginação em listas |
| RNF-12 | Timeout em chamadas externas |

### Código
| ID | Requisito |
|---|---|
| RNF-13 | TypeScript strict mode (sem any) |
| RNF-14 | Swagger auto-gerado |
| RNF-15 | Zero comentários — clean code |
| RNF-16 | Funções com máx 20 linhas |
| RNF-17 | Docker para containerização |
| RNF-18 | .env.example completo |

---

## 9. Security Checklist

- [ ] iron-session configurado (httpOnly, secure, sameSite=lax)
- [ ] SESSION_SECRET 32+ chars em .env
- [ ] Supabase Auth configurado (email + Google + Apple)
- [ ] RLS habilitado em TODAS as tabelas
- [ ] Policies SELECT/INSERT/UPDATE/DELETE por user_id
- [ ] AuthGuard no NestJS validando cookie
- [ ] X-User-Id header enviado pro AI Service
- [ ] FastAPI validando X-User-Id
- [ ] CORS restritivo
- [ ] class-validator em todos os DTOs
- [ ] Stripe webhook com validação de assinatura
- [ ] Rate limiting configurado
- [ ] Secrets em .env
- [ ] .env.example completo
- [ ] Erros sem stack traces no frontend

---

## 10. Dependências

### Backend (NestJS) — package.json
```json
{
  "dependencies": {
    "@nestjs/core": "^11",
    "@nestjs/common": "^11",
    "@nestjs/platform-express": "^11",
    "@nestjs/swagger": "^8",
    "@prisma/client": "^6",
    "iron-session": "^8",
    "stripe": "^17",
    "class-validator": "^0.14",
    "class-transformer": "^0.5",
    "@supabase/supabase-js": "^2",
    "helmet": "^8",
    "express-rate-limit": "^7"
  },
  "devDependencies": {
    "prisma": "^6",
    "typescript": "^5",
    "@types/node": "^22",
    "@nestjs/cli": "^11"
  }
}
```

### AI Service (Python) — requirements.txt
```
langgraph>=0.3
langchain-google-genai>=2.0
fastapi>=0.115
uvicorn>=0.34
pydantic>=2.10
httpx>=0.28
python-dotenv>=1.0
```

---

## 11. .env.example

```env
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
