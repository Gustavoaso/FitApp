# Checklist de Construção — FitApp

---

## Fase 1 — MVP (Concluído ✓)

### Setup do Projeto
- [x] Criar repositório Git no GitHub
- [x] Inicializar monorepo com Turborepo (`package.json` workspaces + `turbo.json`)
- [x] Configurar `tsconfig.base.json` compartilhado
- [x] Criar workspace `apps/mobile` com Expo (React Native)
- [x] Criar workspace `apps/web` com Next.js 15
- [x] Criar workspaces `packages/tipos`, `packages/utilidades`, `packages/constantes`
- [x] Configurar ESLint e Prettier na raiz do monorepo
- [x] Configurar `.gitignore` (node_modules, .env, builds)
- [x] Criar arquivo `.env.example` com variáveis (Supabase, Claude API)
- [x] Criar skill `fitapp-padroes/SKILL.md` inicial com convenções do projeto
- [x] Criar visualizador HTML interativo em `docs/implementation_plan.html`

### Banco de Dados (Supabase/PostgreSQL)
- [x] Configurar cliente Supabase com AsyncStorage (`apps/mobile/servicos/supabase.ts`)
- [x] Instalar Supabase CLI / Configuração (`supabase/config.toml`)
- [x] Criar migration `001_tabelas_iniciais.sql`: usuarios, perfis, questionarios
- [x] Criar migration `002_tabelas_treino.sql`: planos_treino, dias_treino, exercicios_plano, sessoes_treino
- [x] Criar migration `003_tabelas_dieta.sql`: planos_dieta, refeicoes_plano, alimentos_refeicao, registros
- [x] Criar migration `004_rls_politicas.sql`: políticas de Row Level Security (RLS) para todas as tabelas
- [x] Importar tabela TACO (`supabase/seed/002_alimentos.sql`) com 30 alimentos chave
- [x] Criar seed de exercícios (`supabase/seed/001_exercicios.sql`) com 23 exercícios fundamentais
- [x] Configurar índices para busca fuzzy (`pg_trgm`) em nomes de alimentos/exercícios

### Backend (Supabase Edge Functions)
- [x] Criar Edge Function `gerar-plano` (`supabase/functions/gerar-plano/index.ts`)
- [x] Implementar módulo de cálculo: fórmulas Harris-Benedict, Mifflin-St Jeor, TDEE, macros e água em `@fitapp/utilidades`
- [x] Integrar Claude 3.5 Sonnet API com prompt estruturado em formato JSON estrito
- [x] Implementar fallback determinístico inteligente caso a chave de API não esteja configurada

### Tipos e Utilitários Compartilhados
- [x] Definir interfaces TypeScript: `Usuario`, `Perfil`, `RespostaQuestionario` em `@fitapp/tipos`
- [x] Definir interfaces: `PlanoTreino`, `DiaTreino`, `ExercicioPlano`, `Serie`, `SessaoTreino`
- [x] Definir interfaces: `PlanoDieta`, `RefeicaoPlano`, `AlimentoRefeicao`, `RefeicaoRegistrada`
- [x] Implementar funções de cálculo: `calcularTMB()`, `calcularTDEE()`, `calcularMacros()`, `calcularMetaAgua()`
- [x] Implementar formatadores: `formatarCalorias()`, `formatarGramas()`, `formatarTempo()`, `formatarAgua()`
- [x] Implementar validadores: `validarIdade()`, `validarPeso()`, `validarAltura()`, `validarFrequenciaSemanal()`, `validarEmail()`

### Frontend Mobile (React Native + Expo)
- [x] Configurar Expo Router e pilha de rotas (`apps/mobile/app/_layout.tsx`)
- [x] Implementar `AuthContexto` (login, logout, sessão persistente via AsyncStorage)
- [x] Design System base: `CardVidro` (liquid glass), `BotaoPrimario` (gradiente + haptics), `AnelProgresso` (SVG)
- [x] Constantes de tema visual (`apps/mobile/constantes/Cores.ts`)
- [x] Tela de Login (`apps/mobile/app/(auth)/login.tsx`)
- [x] Tela de Cadastro (`apps/mobile/app/(auth)/cadastro.tsx`)
- [x] Fluxo do Questionário 6 etapas (`apps/mobile/app/questionario/index.tsx`)
- [x] Tela de Resultado (`apps/mobile/app/questionario/resultado.tsx`)
- [x] Dashboard (`apps/mobile/app/(tabs)/inicio.tsx`) com anel de calorias, macros, tracker de água e atalho de treino
- [x] Módulo de Treino (`apps/mobile/app/(tabs)/treino.tsx`) com divisão semanal ABC
- [x] Modo Treino ao Vivo (`apps/mobile/app/treino-ao-vivo/index.tsx`) com timer de descanso circular e controle de séries
- [x] Módulo de Dieta (`apps/mobile/app/(tabs)/dieta.tsx`) com modal de busca de alimentos TACO
- [x] Tela de Perfil (`apps/mobile/app/(tabs)/perfil.tsx`) com dados editáveis e logout
- [x] Tab Bar customizada estilo dark glass (`apps/mobile/app/(tabs)/_layout.tsx`)

### Frontend Web (Next.js 15)
- [x] Configurar App Router e layout base (`apps/web/src/app/layout.tsx`)
- [x] Landing page pública (`apps/web/src/app/page.tsx`) com proposta de valor, recursos e objetivos de `@fitapp/constantes`
- [x] Estilos CSS do design system (`apps/web/src/app/globals.css`)

### Testes & Validação
- [x] Compilação limpa do TypeScript em todos os 3 pacotes compartilhados
- [x] Compilação limpa do App Mobile no Expo Router (`tsc --noEmit`)
- [x] Compilação limpa da Web App Next.js 15 (`tsc --noEmit`)
- [x] Validação Turborepo (`npm run lint`) com 8 de 8 tarefas executadas sem nenhum erro ou aviso (0 warnings)

---

## Fase 2 — Expansão

### Funcionalidades
- [ ] Módulo de Progresso: gráficos de evolução (peso, medidas, cargas)
- [ ] Fotos de progresso com comparação lado-a-lado
- [ ] Relatório semanal de aderência (% refeições, % treinos)
- [ ] Edição manual avançada do plano de treino (reordenar exercícios, alterar split)
- [ ] Edição manual avançada do plano de dieta (reordenar refeições, alterar porções)
- [ ] Histórico completo de treinos com filtros por data, grupo muscular
- [ ] Histórico de refeições com filtros por data
- [ ] Notificações push: lembrete de treino, lembrete de refeição
- [ ] Chat com IA (Claude API): perguntas sobre treino, dieta, substituições
- [ ] Modo offline parcial: cache do plano atual no dispositivo

### Técnico
- [ ] Implementar cache local de alta performance (MMKV) para dados do plano
- [ ] Otimizar performance de listas longas (FlashList)
- [ ] Adicionar animações de transição com Reanimated
- [ ] Monitoramento de erros (Sentry)
- [ ] Analytics (PostHog ou Mixpanel)

---

## Fase 3 — Avançado

### Funcionalidades
- [ ] Reconhecimento de alimentos por foto (Claude Vision API)
- [ ] Sugestão automática de ajuste de plano baseada em progresso (IA)
- [ ] Gamificação: streaks, badges, desafios
- [ ] Social: compartilhar progresso, seguir amigos, feed
- [ ] Múltiplos planos salvos (ex: bulk vs. cut)
- [ ] Integração com Apple Health / Google Fit (passos, frequência cardíaca)
- [ ] Integração com smartwatches (Apple Watch, WearOS)
- [ ] Paywall e assinaturas premium (RevenueCat)

### Técnico
- [ ] CI/CD completo no GitHub Actions (lint → test → build automático)
- [ ] Auditoria de segurança e LGPD (opção de exportar/deletar dados)
