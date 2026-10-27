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

## Estrutura por funcionalidade

```
app/                         só rotas (expo-router); cada arquivo reexporta a tela
src/
  funcionalidades/
    autenticacao/ questionario/ plano/ treino/ dieta/ inicio/ perfil/
                             telas (Tela*.tsx), componentes e serviços daquela funcionalidade
  compartilhado/
    ui/                      componentes base (CardVidro, BotaoPrimario, AnelProgresso)
    servicos/                acesso a dados usado por 2+ funcionalidades (repositorio, progresso...)
    tipos/ utilidades/ constantes/
    tema.ts                  cores, espaços, fontes
    supabase.ts              cliente único
    AuthContexto.tsx
```

- Alias `@/` aponta para `src/` (ex.: `@/compartilhado/ui`).
- Uma funcionalidade não importa de outra; o que 2+ usam fica em `compartilhado/`, que nunca importa de `funcionalidades/`.
- Teste ao lado do arquivo (`*.test.ts`).

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo (SDK 54) + expo-router |
| Backend | Supabase (BaaS) + Edge Functions |
| Banco | PostgreSQL (via Supabase) |
| Auth | Supabase Auth |
| IA | Claude API (Anthropic) |
| Alimentos | Tabela TACO (UNICAMP) |

## Padrões de Código

- **Prettier** para formatação (single quotes, trailing commas, 100 chars)
- **TypeScript strict mode**
- **Tipos compartilhados** em `@/compartilhado/tipos` — nunca definir o mesmo tipo em dois lugares
- **Imports absolutos** com `@/`; relativo só dentro da mesma pasta
- **Comentários**: bloco de documentação no topo de cada arquivo explicando o propósito

## Decisões Arquiteturais

- Fórmulas nutricionais: Mifflin-St Jeor para TMB (mais precisa que Harris-Benedict)
- Distribuição de macros: percentual fixo por objetivo (não IA)
- Cálculos matemáticos no motor de regras, combinações criativas na IA
- Row Level Security (RLS) do Supabase para isolamento de dados por usuário
- **Acompanhamento de tarefas**: `docs/ANDAMENTO.md`

