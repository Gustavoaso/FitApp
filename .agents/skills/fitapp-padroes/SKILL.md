---
name: fitapp-padroes
description: Convenções, padrões de nomenclatura, estrutura de pastas e decisões arquiteturais do projeto FitApp. Reaproveite em projetos futuros.
---

# Padrões do Projeto FitApp

## Idioma do Código

- **Todo o código em português do Brasil**: variáveis, funções, componentes, pastas, comentários
- **Exceções**: palavras-chave da linguagem (`import`, `export`, `const`, `function`, etc.), nomes de bibliotecas (`React`, `Supabase`, etc.), termos técnicos sem tradução direta (`middleware`, `hook`, `callback`, `render`, `props`, `state`, etc.)
- Exemplo: `calcularTMB()`, não `calculateBMR()`; `formatarCalorias()`, não `formatCalories()`

> **Nota**: O padrão de mercado internacional é nomear tudo em inglês. Se for trabalhar em equipes internacionais ou projetos open source, adapte para inglês.

## Nomenclatura

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| Variáveis e funções | camelCase em português | `pesoKg`, `calcularMacros()` |
| Tipos e interfaces | PascalCase em português | `PlanoTreino`, `RespostaQuestionario` |
| Constantes | UPPER_SNAKE_CASE | `FATORES_ATIVIDADE`, `OBJETIVOS` |
| Arquivos | kebab-case em português | `grupos-musculares.ts`, `treino-ao-vivo.tsx` |
| Pastas | português sem acento | `utilidades/`, `componentes/`, `servicos/` |
| Componentes React | PascalCase em português | `CardVidro`, `BotaoPrimario`, `AnelProgresso` |

## Estrutura de Pacotes

- **Monorepo Turborepo** com 3 workspaces: `apps/*`, `packages/*`
- **Pacotes compartilhados**: `@fitapp/tipos`, `@fitapp/utilidades`, `@fitapp/constantes`
- Cada pacote exporta via barrel (`index.ts`) para imports limpos

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo (SDK 52+) |
| Web | Next.js 15 + React 19 |
| Backend | Supabase (BaaS) + Edge Functions |
| Banco | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| IA | Claude API (Anthropic) |
| Alimentos | Tabela TACO (UNICAMP) |

## Padrões de Código

- **Prettier** para formatação (single quotes, trailing commas, 100 chars)
- **TypeScript strict mode** em todos os pacotes
- **Tipos compartilhados** via `@fitapp/tipos` — nunca definir o mesmo tipo em dois lugares
- **Imports absolutos** usando `@fitapp/` prefix
- **Comentários**: bloco de documentação no topo de cada arquivo explicando o propósito

## Decisões Arquiteturais

- Fórmulas nutricionais: Mifflin-St Jeor para TMB (mais precisa que Harris-Benedict)
- Distribuição de macros: percentual fixo por objetivo (não IA)
- Cálculos matemáticos no motor de regras, combinações criativas na IA
- Row Level Security (RLS) do Supabase para isolamento de dados por usuário
- **Acompanhamento de tarefas**: mantido atualizado no arquivo `docs/checklist_construcao.md` ao longo das fases do projeto

