# Planejamento Completo — FitApp

---

## 1. Resumo do FitFolio

**Onboarding/Questionário:** Fluxo step-by-step com telas modulares (idade, peso, altura, nível de atividade, objetivo, restrições alimentares). Barra de progresso no topo e navegação "voltar/avançar". Coleta mínima de dados para gerar o plano inicial — detalhes extras são opcionais.

**Telas principais:** Dashboard centralizado com resumo diário (macros, calorias, streak de treinos). Tela de treino com biblioteca de exercícios categorizados por grupo muscular, com guias visuais. Tela de dieta com registro por refeição (café, almoço, jantar, lanches) e comparação em tempo real com metas de macros.

**Destaques visuais:** Interface limpa com cards arredondados, iconografia SF Symbols, gráficos circulares de progresso (anéis de atividade), e uso de camadas de profundidade com blur. Paleta escura com acentos vibrantes.

---

## 2. Especificação Funcional

### 2.1 Onboarding & Questionário
- Tela de boas-vindas com proposta de valor (1 tela)
- Cadastro/Login (e-mail, Google, Apple Sign-In)
- Questionário em etapas (8-10 telas):
  - Dados pessoais: nome, idade, sexo biológico
  - Corpo: peso atual, altura, % gordura (opcional)
  - Objetivo: hipertrofia / definição / força / emagrecimento / condicionamento
  - Nível de experiência: iniciante / intermediário / avançado
  - Frequência semanal disponível para treinar (2-6x)
  - Restrições alimentares: vegetariano, vegano, intolerância a lactose/glúten, alergias
  - Preferências de treino: musculação, calistenia, misto
  - Equipamentos disponíveis: academia completa / home gym / só peso corporal
- Tela de resultado: exibe TMB, calorias-alvo, macros, meta de água, e o plano gerado
- Barra de progresso no topo do questionário

### 2.2 Dashboard (Tela Inicial)
- Resumo diário: calorias consumidas vs. meta, macros (proteína/carb/gordura), água
- Card de próximo treino agendado
- Progresso semanal: dias treinados, aderência à dieta
- Atalhos rápidos: "Registrar refeição", "Iniciar treino"
- Gráfico de evolução de peso (linha temporal)

### 2.3 Módulo de Treino
- **Plano de treino semanal**: dias da semana com split (ex: Peito+Tríceps, Costas+Bíceps)
- **Lista de exercícios por dia**: nome, séries, repetições, carga sugerida, tempo de descanso
- **Modo treino ao vivo**:
  - Exibe exercício atual com séries restantes
  - Timer de descanso com contagem regressiva (com vibração/alerta ao acabar)
  - Botão "Concluir série" → avança para próxima
  - Input de carga real usada (para registro de progressão)
  - Navegação "Pular exercício" / "Exercício anterior"
- **Edição manual**: buscar e substituir exercícios por uma base de dados pesquisável
- **Histórico de treinos**: log de sessões passadas com volume total, duração

### 2.4 Módulo de Dieta
- **Plano alimentar diário**: dividido por refeições (café, lanche AM, almoço, lanche PM, jantar, ceia)
- **Cada refeição** mostra: alimentos, porção (g ou medida caseira), calorias, macros
- **Registro em tempo real**: selecionar alimento da base, digitar porção → atualiza totais do dia
- **Barra de progresso diária**: calorias consumidas/restantes, macros consumidos/restantes
- **Edição manual**: buscar e substituir alimentos por base pesquisável (TACO + base curada)
- **Meta de água**: registro de copos/ml com progresso visual

### 2.5 Módulo de Perfil & Configurações
- Dados pessoais editáveis (peso atual, medidas)
- Recalcular plano (re-executar questionário parcialmente)
- Preferências de notificação (lembrete de refeição, lembrete de treino, lembrete de água)
- Unidades: kg/lb, cm/in
- Tema: claro/escuro/automático
- Exportar dados (CSV)

### 2.6 Módulo de Progresso
- Gráficos de evolução: peso, medidas, carga em exercícios-chave
- Fotos de progresso: galeria com comparação lado-a-lado por data
- Relatório semanal: aderência (% de refeições registradas, % de treinos concluídos)

---

## 3. Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTES (Frontend)                         │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Mobile iOS   │  │Mobile Android│  │      Web (PWA)           │  │
│  │ React Native  │  │ React Native │  │    Next.js + React       │  │
│  │   (Expo)      │  │   (Expo)     │  │                          │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘  │
│         │                  │                       │                │
└─────────┼──────────────────┼───────────────────────┼────────────────┘
          │                  │                       │
          ▼                  ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CAMADA DE API (Backend)                          │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     API Gateway (Supabase)                   │   │
│  │        Auth · REST API · Realtime · Storage · Edge Funcs     │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                              │                                      │
│  ┌───────────────────────────┼──────────────────────────────────┐   │
│  │           Supabase Edge Functions (Deno/TypeScript)          │   │
│  │                                                              │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │   │
│  │  │ Gerar Plano    │  │ Calcular TMB   │  │ Registrar     │  │   │
│  │  │ (Treino+Dieta) │  │ & Macros       │  │ Refeição      │  │   │
│  │  └───────┬────────┘  └────────────────┘  └───────────────┘  │   │
│  │          │                                                   │   │
│  │          ▼                                                   │   │
│  │  ┌────────────────┐                                          │   │
│  │  │  Claude API    │  ← Geração inteligente de planos         │   │
│  │  │  (Anthropic)   │    personalizados de treino e dieta      │   │
│  │  └────────────────┘                                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BANCO DE DADOS (Supabase/PostgreSQL)            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  usuarios    │  │  planos      │  │  base_exercicios         │  │
│  │  perfis      │  │  treinos     │  │  base_alimentos (TACO)   │  │
│  │  questionario│  │  dietas      │  │  refeicoes_registradas   │  │
│  │              │  │  sessoes     │  │  progresso               │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
│  Row Level Security (RLS) → cada usuário acessa só seus dados      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Fluxo de dados principal

```
Questionário (cliente)
    │
    ▼
Edge Function "gerar-plano"
    │
    ├──► Motor de regras: calcula TMB (Harris-Benedict), TDEE, macros
    │    (baseado em objetivo + nível de atividade)
    │
    ├──► Claude API: recebe dados do usuário + base de exercícios/alimentos
    │    disponíveis → gera plano de treino semanal + plano alimentar diário
    │    personalizado, respeitando restrições e preferências
    │
    ▼
Salva no PostgreSQL (plano_treino + plano_dieta)
    │
    ▼
Sincroniza com cliente via Supabase Realtime
    │
    ▼
Usuário visualiza, edita e executa o plano
    │
    ▼
Registros de refeições e sessões de treino → salvos no banco
    │
    ▼
Dashboard atualiza em tempo real com progresso do dia
```

---

## 4. Stack Técnica Recomendada

### 4.1 Frontend Mobile

| Opção | Prós | Contras |
|-------|------|---------|
| **React Native + Expo** ✅ | Código único iOS+Android, hot reload, ecossistema enorme, Expo simplifica build/deploy | Performance ~5% inferior ao nativo em animações pesadas |
| Flutter | Performance excelente, UI customizável | Dart é menos popular, ecossistema menor, mais difícil de integrar libs JS |
| Swift + Kotlin nativos | Melhor performance possível | Duas bases de código para manter, dobro do esforço |

**Escolha: React Native + Expo (SDK 52+)**
- Justificativa: código único para iOS/Android, curva de aprendizado acessível (JavaScript/TypeScript), Expo gerencia builds nativos sem precisar de Xcode/Android Studio na maioria dos casos

### 4.2 Frontend Web

| Opção | Justificativa |
|-------|---------------|
| **Next.js 15 + React 19** ✅ | SSR para SEO, App Router, Server Components, ótima integração com Supabase |

- O mesmo TypeScript do mobile → conhecimento reutilizável
- Vercel deploy simplificado (1 comando)

### 4.3 Backend

| Opção | Justificativa |
|-------|---------------|
| **Supabase (BaaS) + Edge Functions** ✅ | Auth, banco, realtime, storage e funções serverless num só lugar — sem precisar montar servidor próprio |

- Edge Functions rodam TypeScript/Deno → mesma linguagem do frontend
- Para um MVP, Supabase evita toda a complexidade de configurar servidor, CI/CD de backend, etc.
- *Suposição: se a escala crescer muito (100k+ usuários ativos), pode ser necessário migrar para backend dedicado (NestJS ou FastAPI). Sinalizado como decisão de fase 3+*

### 4.4 Banco de Dados

| Opção | Justificativa |
|-------|---------------|
| **PostgreSQL (via Supabase)** ✅ | Relacional, ACID, RLS nativo, extensões (pg_trgm para busca fuzzy), maduro e confiável |

- Dados de fitness são altamente relacionais (usuário → plano → treino → exercício → série)
- Row Level Security do Supabase garante isolamento por usuário sem código extra
- JSON columns para dados semi-estruturados quando necessário (ex: resposta do questionário)

### 4.5 Autenticação

| Opção | Justificativa |
|-------|---------------|
| **Supabase Auth** ✅ | Já incluso no Supabase, suporta e-mail, Google, Apple Sign-In, sem custo adicional |

- Integração nativa com RLS do banco
- SDK disponível para React Native e Next.js

### 4.6 Infraestrutura / Hospedagem

| Componente | Serviço | Justificativa |
|------------|---------|---------------|
| Backend + Banco | **Supabase Cloud** (plano free → pro) | Tudo em um: banco, auth, storage, edge functions |
| Web | **Vercel** (plano hobby → pro) | Deploy automático do Next.js, CDN global, preview deploys por PR |
| Mobile builds | **EAS (Expo Application Services)** | Build na nuvem para iOS/Android sem máquina local configurada |

### 4.7 IAs / Modelos Utilizados

| Finalidade | Solução | Justificativa |
|------------|---------|---------------|
| **Geração do plano de treino + dieta** | **Motor de regras (TypeScript) + Claude API (Anthropic)** | O motor de regras calcula TMB, TDEE e macros com fórmulas fixas (Harris-Benedict, Mifflin-St Jeor). Claude API recebe esses dados + lista de exercícios/alimentos disponíveis e monta o plano personalizado em formato JSON estruturado. Isso combina precisão matemática com inteligência para montar combinações realistas. |
| **Chat/assistente (Fase 2+)** | **Claude API** | Permitir que o usuário pergunte "posso trocar frango por atum?" ou "como fazer esse exercício?" com respostas contextualizadas ao plano dele |
| **Reconhecimento de alimentos por foto (Fase 3+)** | **Claude Vision API** | Tirar foto do prato → IA identifica alimentos e estima porções |

> **Por que Claude API e não modelo próprio?** Treinar um modelo próprio exige milhares de dados rotulados, infraestrutura de ML e manutenção contínua — totalmente fora de escopo para um MVP. Uma API de LLM resolve com prompt engineering + output estruturado (JSON mode).

> **Por que não só motor de regras sem IA?** Um motor de regras puro geraria planos genéricos (template). A LLM permite personalizar combinações de alimentos/exercícios de forma natural, considerar preferências do texto livre e adaptar linguagem.

### 4.8 Base de Dados de Exercícios e Alimentos

| Base | Fonte | Uso |
|------|-------|-----|
| **Alimentos** | **Tabela TACO (UNICAMP)** — importada do repositório `marcelosanto/tabela_taco` (JSON) | ~600 alimentos brasileiros com macros/micros por 100g. Complementada com base curada própria (~100 itens extras: whey, barra de proteína, suplementos comuns) |
| **Exercícios** | **Base curada própria** (JSON/seed no banco) | ~120-150 exercícios comuns em academias brasileiras, organizados por grupo muscular. Cada exercício com: nome, grupo muscular primário/secundário, equipamento necessário, nível de dificuldade, instruções breves |

- *Suposição: não usaremos APIs pagas de exercícios (como Wger ou ExerciseDB) no MVP. Uma base curada de ~150 exercícios cobre >95% do que se faz em academia no Brasil. Se precisar expandir, migramos para API na fase 2+.*

---

## 5. Design System

### 5.1 Paleta de Cores

| Token | Hex | Uso |
|-------|-----|-----|
| `--cor-fundo` | `#0A0E17` | Fundo principal (dark) |
| `--cor-superficie` | `#141A2A` | Cards, containers |
| `--cor-superficie-elevada` | `#1C2438` | Cards elevados, modais |
| `--cor-vidro` | `rgba(255, 255, 255, 0.06)` | Camada de "vidro" (liquid glass) |
| `--cor-vidro-borda` | `rgba(255, 255, 255, 0.12)` | Borda sutil dos cards glass |
| `--cor-primaria` | `#6C5CE7` | Ações principais, botões, destaques — roxo vibrante |
| `--cor-primaria-suave` | `rgba(108, 92, 231, 0.15)` | Fundo de badges, highlights |
| `--cor-secundaria` | `#00D2FF` | Acentos secundários, links, ícones info — azul cyan |
| `--cor-sucesso` | `#00E676` | Confirmações, metas atingidas |
| `--cor-alerta` | `#FFD600` | Avisos, próximo do limite |
| `--cor-erro` | `#FF5252` | Erros, acima do limite |
| `--cor-texto` | `#F0F0F5` | Texto principal |
| `--cor-texto-secundario` | `#8B92A8` | Texto auxiliar, labels |

### 5.2 Tipografia

| Papel | Fonte | Justificativa |
|-------|-------|---------------|
| **Display / Títulos** | **Inter** (700, 800) | Geométrica, altamente legível em telas pequenas, suporte completo a acentos do português |
| **Corpo** | **Inter** (400, 500) | Mesma família para coesão; pesos leve e médio para hierarquia |
| **Dados numéricos** | **Inter Tight** ou **SF Mono** (no iOS) | Algarismos tabulares para alinhar números em tabelas de macros/calorias |

**Escala tipográfica:**

| Token | Tamanho | Peso | Uso |
|-------|---------|------|-----|
| `display` | 32px | 800 | Título de seção, valor destaque (ex: calorias totais) |
| `titulo` | 24px | 700 | Título de card |
| `subtitulo` | 18px | 600 | Subtítulos |
| `corpo` | 16px | 400 | Texto de leitura |
| `label` | 14px | 500 | Labels, captions |
| `micro` | 12px | 500 | Metadados, timestamps |

### 5.3 Estilo "Liquid Glass" — Adaptação Multiplataforma

O conceito central: cards e superfícies interativas se comportam como camadas de vidro semi-transparente sobre o fundo escuro, com blur, reflexo sutil e bordas luminosas.

#### Implementação por plataforma

**iOS (React Native):**
```
- BlurView do expo-blur com intensity={20} tint="dark"
- Borda de 1px com rgba(255,255,255,0.12)
- borderRadius: 20
- Sombra sutil: shadowColor: '#6C5CE7', shadowOpacity: 0.15, shadowRadius: 20
```

**Android (React Native):**
```
- Mesmo BlurView (expo-blur suporta Android 12+)
- Fallback para fundo sólido semi-transparente em Android < 12
- elevation: 4 para sombra nativa
```

**Web (CSS):**
```css
.card-vidro {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(108, 92, 231, 0.15);
}
```

#### Princípios de aplicação

| Princípio | Descrição |
|-----------|-----------|
| **3 camadas visuais** | Fundo (cor sólida escura) → Vidro (cards com blur) → Ação (botões, FABs) |
| **Blur seletivo** | Aplicar glass apenas em cards interativos e barras de navegação, nunca em tudo |
| **Bordas luminosas** | Borda fina com opacidade baixa simula reflexo de luz na borda do vidro |
| **Sombra com cor** | Sombra com matiz da cor primária (roxo) em vez de preto puro → mais profundidade |
| **Micro-animações** | Hover/press: escala 0.98 + aumento de opacidade da borda. Timer: pulso sutil do anel de progresso |
| **Acessibilidade** | Texto sempre com contraste ≥ 4.5:1 sobre o glass. Fallback opaco para `prefers-reduced-transparency` |

### 5.4 Componentes-chave do Design System

| Componente | Descrição |
|------------|-----------|
| `CardVidro` | Container glass com blur + borda + sombra. Base de todos os cards |
| `BotaoPrimario` | Botão com gradiente da cor primária, border-radius alto, press animation |
| `BotaoVidro` | Botão glass para ações secundárias |
| `AnelProgresso` | Anel circular SVG para mostrar progresso (calorias, macros, água) |
| `BarraProgresso` | Barra horizontal com preenchimento gradiente |
| `InputBusca` | Campo de busca glass com ícone de lupa |
| `ChipFiltro` | Tag selecionável para filtros (grupos musculares, categorias de alimento) |
| `CardExercicio` | Card com nome, séries/reps, ícone do grupo muscular |
| `CardRefeicao` | Card com alimentos, porções, macros |
| `TimerDescanso` | Timer circular com contagem regressiva e vibração |

---

## 6. Mockups das Telas Principais

````carousel
### Dashboard — Tela Inicial
Resumo diário com anel de calorias, macros, água e card de próximo treino. Tab bar com 4 abas.

![Dashboard do FitApp](/Users/gustavosoares/.gemini/antigravity-ide/brain/8449e36f-b4db-4229-a541-564155ca0a96/mockup_dashboard_1785170835487.png)
<!-- slide -->
### Treino ao Vivo
Exercício atual com nome, série/rep/carga, timer de descanso circular e botões de ação.

![Treino ao Vivo do FitApp](/Users/gustavosoares/.gemini/antigravity-ide/brain/8449e36f-b4db-4229-a541-564155ca0a96/mockup_treino_ao_vivo_1785170843614.png)
<!-- slide -->
### Dieta — Registro de Refeições
Plano alimentar do dia com barra de progresso de calorias/macros e cards de refeições glass.

![Tela de Dieta do FitApp](/Users/gustavosoares/.gemini/antigravity-ide/brain/8449e36f-b4db-4229-a541-564155ca0a96/mockup_dieta_1785170852915.png)
<!-- slide -->
### Resultado do Questionário
Métricas geradas (TMB, meta calórica, macros), preview dos planos e CTA "Começar Agora".

![Resultado do Questionário do FitApp](/Users/gustavosoares/.gemini/antigravity-ide/brain/8449e36f-b4db-4229-a541-564155ca0a96/mockup_resultado_1785170883770.png)
````

---

## 7. Checklist de Construção

> **Entregue como arquivo separado:** [checklist_construcao.md](file:///Users/gustavosoares/.gemini/antigravity-ide/brain/8449e36f-b4db-4229-a541-564155ca0a96/checklist_construcao.md)

---

## 8. Estrutura de Pastas e Arquivos

> **Monorepo com Turborepo** — justificativa: compartilhar tipos TypeScript, constantes e utilitários entre mobile, web e funções de backend sem duplicação. Turborepo gerencia builds paralelos e cache.

```
fitapp/
├── package.json                    # Raiz do monorepo (workspaces)
├── turbo.json                      # Configuração do Turborepo
├── tsconfig.base.json              # Config base de TypeScript compartilhada
│
├── apps/
│   ├── mobile/                     # App React Native + Expo
│   │   ├── app/                    # Telas (Expo Router - file-based routing)
│   │   │   ├── (auth)/             # Grupo de rotas de autenticação
│   │   │   │   ├── login.tsx
│   │   │   │   └── cadastro.tsx
│   │   │   ├── (tabs)/             # Grupo de rotas com tab bar
│   │   │   │   ├── _layout.tsx     # Layout da tab bar
│   │   │   │   ├── inicio.tsx      # Dashboard
│   │   │   │   ├── treino.tsx      # Módulo de treino
│   │   │   │   ├── dieta.tsx       # Módulo de dieta
│   │   │   │   └── perfil.tsx      # Perfil e configurações
│   │   │   ├── questionario/       # Fluxo do questionário (step-by-step)
│   │   │   ├── treino-ao-vivo/     # Tela de execução de treino
│   │   │   └── _layout.tsx         # Layout raiz
│   │   ├── componentes/            # Componentes reutilizáveis do mobile
│   │   │   ├── ui/                 # Componentes do design system (CardVidro, BotaoPrimario, etc.)
│   │   │   └── treino/             # Componentes específicos de treino (CardExercicio, TimerDescanso)
│   │   ├── hooks/                  # Custom hooks (useAuth, usePlano, etc.)
│   │   ├── servicos/               # Chamadas ao Supabase (API layer)
│   │   ├── contextos/              # React Contexts (AuthContexto, PlanoContexto)
│   │   ├── constantes/             # Cores, tamanhos, configurações
│   │   ├── assets/                 # Imagens, ícones, fontes
│   │   ├── app.json                # Config do Expo
│   │   ├── babel.config.js
│   │   └── package.json
│   │
│   └── web/                        # App Next.js
│       ├── app/                    # App Router (Next.js 15)
│       │   ├── (auth)/             # Rotas de autenticação
│       │   ├── (dashboard)/        # Rotas autenticadas
│       │   │   ├── page.tsx        # Dashboard
│       │   │   ├── treino/
│       │   │   ├── dieta/
│       │   │   └── perfil/
│       │   ├── questionario/
│       │   ├── layout.tsx
│       │   └── page.tsx            # Landing page pública
│       ├── componentes/            # Componentes React do web
│       ├── estilos/                # CSS modules ou globals
│       ├── lib/                    # Utilitários, cliente Supabase
│       ├── next.config.js
│       └── package.json
│
├── packages/
│   ├── tipos/                      # Tipos TypeScript compartilhados
│   │   ├── src/
│   │   │   ├── usuario.ts          # Interfaces de usuário, perfil
│   │   │   ├── treino.ts           # Interfaces de treino, exercício, série
│   │   │   ├── dieta.ts            # Interfaces de dieta, alimento, refeição
│   │   │   ├── questionario.ts     # Interface das respostas do questionário
│   │   │   └── index.ts            # Re-exports
│   │   └── package.json
│   │
│   ├── utilidades/                 # Funções utilitárias compartilhadas
│   │   ├── src/
│   │   │   ├── calculos.ts         # TMB, TDEE, macros, meta de água
│   │   │   ├── formatadores.ts     # Formatar calorias, gramas, tempo
│   │   │   └── validadores.ts      # Validações de input do questionário
│   │   └── package.json
│   │
│   └── constantes/                 # Constantes compartilhadas
│       ├── src/
│       │   ├── objetivos.ts        # Enum de objetivos (hipertrofia, definição, etc.)
│       │   ├── grupos-musculares.ts
│       │   └── unidades.ts         # Conversão kg/lb, cm/in
│       └── package.json
│
├── supabase/                       # Configuração e funções Supabase
│   ├── config.toml                 # Config local do Supabase CLI
│   ├── migrations/                 # Migrações SQL do banco de dados
│   │   ├── 001_tabelas_iniciais.sql
│   │   ├── 002_rls_politicas.sql
│   │   └── 003_seed_alimentos.sql  # Importação da tabela TACO
│   ├── functions/                  # Edge Functions (Deno/TypeScript)
│   │   ├── gerar-plano/            # Gera plano de treino + dieta via Claude API
│   │   │   └── index.ts
│   │   ├── recalcular-macros/      # Recalcula macros ao atualizar peso/objetivo
│   │   │   └── index.ts
│   │   └── _shared/                # Código compartilhado entre functions
│   │       ├── cliente-claude.ts   # Wrapper da Claude API
│   │       └── formulas.ts         # Fórmulas de TMB, TDEE
│   └── seed/                       # Dados iniciais
│       ├── exercicios.json         # Base curada de exercícios
│       └── alimentos-extras.json   # Suplementos e itens fora da TACO
│
├── dados/                          # Dados brutos para importação
│   └── taco/                       # Tabela TACO em JSON
│       └── alimentos.json
│
└── .agents/                        # Skills e configurações do agente
    └── skills/
        └── fitapp-padroes/         # Skill incremental do projeto
            └── SKILL.md            # Convenções, padrões, decisões
```

### Justificativas das pastas menos óbvias

| Pasta | Função |
|-------|--------|
| `packages/tipos/` | Tipos TypeScript importados por mobile, web e funções — garante que todos usam a mesma interface para "Exercício", "Refeição", etc. |
| `packages/utilidades/` | Funções de cálculo (TMB, macros) compartilhadas — evita duplicar a mesma fórmula em 3 lugares |
| `supabase/functions/_shared/` | Código reutilizado entre diferentes Edge Functions (ex: wrapper da API do Claude) |
| `supabase/migrations/` | Versionamento do schema do banco — cada arquivo SQL é uma mudança incremental, aplicada em ordem |
| `supabase/seed/` | Dados iniciais que populam o banco na primeira vez (exercícios, alimentos extras) |
| `dados/taco/` | Arquivo JSON bruto da tabela TACO — usado uma vez para gerar a migration de seed |
| `.agents/skills/fitapp-padroes/` | Skill incremental que documenta convenções deste projeto para reutilização futura |

---

## Decisões Abertas / Revisão do Usuário

> [!IMPORTANT]
> **Idioma de código em português**: O plano segue sua diretriz de nomear tudo em português (pastas, variáveis, funções). Isso está refletido na estrutura de pastas (`componentes/`, `servicos/`, `contextos/`, `utilidades/`). Confirma essa decisão? O padrão de mercado internacional é inglês — sinalizarei isso na primeira entrega de código.

> [!IMPORTANT]
> **Supabase como backend completo**: A arquitetura propõe usar Supabase como BaaS (banco + auth + funções + storage) sem um servidor backend dedicado. Isso simplifica enormemente o MVP, mas limita customização avançada no futuro. Concorda com essa abordagem?

> [!IMPORTANT]
> **Claude API para geração de planos**: A IA escolhida para gerar treinos/dietas personalizados é a Claude API (Anthropic). Alternativas seriam GPT API (OpenAI) ou um motor de regras puro (sem IA). A Claude foi escolhida pela qualidade de output estruturado e menor tendência a alucinações. Confirma?

> [!WARNING]
> **Base de exercícios curada manualmente**: Optamos por uma base própria de ~150 exercícios em vez de API externa. Isso dá controle total mas exige curadoria manual inicial. Os nomes e instruções serão em português. Está ok?

> [!NOTE]
> **Fase 2+ não detalhada**: Features como chat com IA, reconhecimento de alimentos por foto, gamificação e funcionalidades sociais foram mencionadas mas não detalhadas neste plano. Serão especificadas quando a Fase 1 (MVP) estiver completa.
