# FitApp 💪

Aplicativo fitness mobile de alta performance para o público brasileiro, gerando planejamento inteligente de treino e dieta com IA e cálculos determinísticos.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| **Mobile** | React Native (0.81) + Expo SDK 54 (Expo Router v6) |
| **Estilização** | Liquid Glass Design (Apple iOS HIG / SF Symbols / Expo Blur) |
| **Backend & Banco** | Supabase (PostgreSQL + Auth + Edge Functions) |
| **IA / LLM** | Groq LPU (Llama 3.3 70B Versatile — inferência em ~2s) |
| **Linguagem** | TypeScript 5.7 (Modo estrito) |

---

## 📁 Estrutura do Projeto (Mobile-Only Flat)

A estrutura é 100% direta, intuitiva e sem níveis desnecessários de monorepo:

```
FitApp/
├── app/                  # 📍 TODAS AS PÁGINAS / TELAS DO APP (Expo Router)
│   ├── (auth)/           # 🔐 Telas de Login e Cadastro
│   │   ├── login.tsx
│   │   └── cadastro.tsx
│   ├── (tabs)/           # 📱 Telas Principais da Barra Inferior
│   │   ├── inicio.tsx    # 🏠 Home / Dashboard de Métricas
│   │   ├── treino.tsx    # 🏋️ Treino do Dia, Rotinas e Exercícios
│   │   ├── dieta.tsx     # 🥗 Metas, Refeições e Registro de Alimentos
│   │   └── perfil.tsx    # 👤 Perfil Físico, Ajustes e Preferências
│   ├── questionario/     # 📋 Questionário de Onboarding e IA
│   │   ├── index.tsx     # Formulário de Perguntas
│   │   └── resultado.tsx # Síntese e Aceite do Planejamento
│   ├── treino-ao-vivo/   # ⏱️ Execução de Treino em Tempo Real
│   │   └── index.tsx
│   ├── _layout.tsx       # ⚙️ Navegação Raiz, Fontes e Provedores
│   └── index.tsx         # 🚪 Entry Gate (Redirecionamento Inteligente)
│
├── componentes/          # 🧩 COMPONENTES VISUAIS REUTILIZÁVEIS
│   └── ui/               # CardVidro, BotaoPrimario, AnelProgresso, Modais, Gráficos
│
├── servicos/             # ⚡ INTEGRAÇÕES, BANCO E IA
│   ├── supabase.ts       # Cliente oficial Supabase
│   ├── iaLocalServico.ts # Geração de Planos com IA (Groq Llama 3.3)
│   ├── repositorio.ts    # Persistência e repositório de dados
│   ├── planoGestaoServico.ts # Gestão e edição de treinos ativos
│   ├── progressoServico.ts   # Métricas de adesão, cargas e evolução
│   ├── historicoServico.ts   # Registro histórico de refeições e treinos
│   └── validadorPlanoIA.ts   # Sanitização e validação de planos
│
├── contextos/            # 🌐 ESTADOS GLOBAIS (AuthContexto.tsx)
├── tipos/                # 📝 DEFINIÇÕES TYPESCRIPT (treino, dieta, usuario, questionario)
├── utilidades/           # 🧮 CÁLCULOS E FORMATADORES (Mifflin-St Jeor, macros, datas)
├── constantes/           # 🎨 CORES E TOKENS (Cores.ts, objetivos.ts, grupos-musculares.ts)
├── assets/               # 🖼️ FONTES NATIVAS (SF Compact Rounded) E IMAGENS
├── supabase/             # 🗄️ MIGRATIONS SQL E EDGE FUNCTIONS
├── package.json          # 📦 Gerenciamento de Dependências
├── app.json              # 📱 Configuração Expo Mobile
├── tsconfig.json         # 🛠️ TypeScript com path alias @/*
└── .env                  # 🔑 Variáveis de Ambiente
```

---

## 🚀 Como Executar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o app no Expo
npx expo start -c

# 3. Executar typecheck
npm run lint
```