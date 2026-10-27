# Tarefas — FitApp

## Fase 1 — MVP (Concluída ✓)

### Setup do Projeto
- [x] Criar repositório Git no GitHub
- [x] Inicializar monorepo com Turborepo (manual, workspaces + turbo.json)
- [x] Configurar `tsconfig.base.json` compartilhado
- [x] Criar workspace `apps/mobile` com Expo
- [x] Criar workspace `apps/web` com Next.js 15
- [x] Criar workspaces `packages/tipos`, `packages/utilidades`, `packages/constantes`
- [x] Configurar Prettier e ESLint
- [x] Configurar `.gitignore` e `.env.example`
- [x] Criar skill `fitapp-padroes/SKILL.md` inicial
- [x] Criar visualizador HTML interativo em `docs/implementation_plan.html`

### Banco de Dados
- [x] Configurar cliente Supabase com AsyncStorage
- [x] Criar migrations SQL (001_tabelas_iniciais, 002_tabelas_treino, 003_tabelas_dieta, 004_rls_politicas)
- [x] Criar seed de exercícios (`supabase/seed/001_exercicios.sql`)
- [x] Criar seed de alimentos TACO (`supabase/seed/002_alimentos.sql`)
- [x] Configurar RLS em todas as tabelas (004_rls_politicas)

### Backend (Edge Functions)
- [x] Criar função `gerar-plano` (`supabase/functions/gerar-plano/index.ts`)
- [x] Implementar cálculos (TMB, TDEE, macros, água) em `@fitapp/utilidades`
- [x] Integração Claude 3.5 Sonnet API com formato JSON estrito + fallback seguro

### Tipos e Utilitários
- [x] Definir interfaces TypeScript (`@fitapp/tipos`)
- [x] Implementar funções de cálculo (`@fitapp/utilidades`)
- [x] Implementar formatadores e validadores (`@fitapp/utilidades`)
- [x] Constantes e enums (`@fitapp/constantes`)
- [x] Compilação limpa em 100% dos pacotes ✓

### Frontend Mobile (React Native + Expo)
- [x] Configurar Expo Router e pilha de rotas
- [x] Contexto de Autenticação (`contextos/AuthContexto.tsx`)
- [x] Design System base: `CardVidro`, `BotaoPrimario`, `AnelProgresso`, `Cores`
- [x] Tela de Login (`(auth)/login.tsx`)
- [x] Tela de Cadastro (`(auth)/cadastro.tsx`)
- [x] Questionário Onboarding 6 etapas (`questionario/index.tsx`)
- [x] Tela de Resultado (`questionario/resultado.tsx`)
- [x] Dashboard (`(tabs)/inicio.tsx`)
- [x] Módulo de Treino (`(tabs)/treino.tsx`)
- [x] Modo Treino ao Vivo (`treino-ao-vivo/index.tsx`) com timer de descanso
- [x] Módulo de Dieta (`(tabs)/dieta.tsx`) com busca modal de alimentos
- [x] Perfil e Configurações (`(tabs)/perfil.tsx`)

### Frontend Web (Next.js 15)
- [x] Configurar Next.js App Router com estilos Liquid Glass
- [x] Landing Page (`apps/web/src/app/page.tsx`) com apresentação do produto, benefícios e objetivos
- [x] Estilos globais e tokens CSS (`globals.css`)
