# FitApp 💪

App fitness para o público brasileiro que gera dieta e treino personalizados a partir de um questionário inicial.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Mobile | React Native + Expo |
| Web | Next.js 15 |
| Backend | Supabase (BaaS) + Edge Functions |
| Banco | PostgreSQL |
| IA | Claude API (Anthropic) |

## Estrutura do Monorepo

```
fitapp/
├── apps/
│   ├── mobile/          # App React Native (Expo)
│   └── web/             # App Next.js
├── packages/
│   ├── tipos/           # Tipos TypeScript compartilhados
│   ├── utilidades/      # Funções de cálculo, formatação, validação
│   └── constantes/      # Constantes e enums
├── supabase/            # Migrations, Edge Functions, seeds
└── dados/               # Dados brutos (TACO, exercícios)
```

## Setup

```bash
# Instalar dependências
npm install

# Rodar o mobile
npm run dev --workspace=@fitapp/mobile

# Rodar o web
npm run dev --workspace=@fitapp/web
```

## Idioma do Código

Todo o código (variáveis, funções, componentes, pastas) é escrito em **português do Brasil**, exceto palavras-chave de linguagem e termos técnicos sem tradução direta.