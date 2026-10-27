# Identidade visual: FitApp

> A base é a skill `visual-design` (padrão Apple atual). Este arquivo guarda só o que é deste projeto e vence a skill onde decidir diferente. Ponto de partida: a identidade atual (levantado do código, `constantes/Cores.ts`).

- **Tema:** escuro (fundo OLED `#000000`; superfícies `#121418` e `#1A1D24`) **e claro** (aprovado em 2026-10-26), seguindo o sistema.
- **Cor de destaque (tint):** branco `#FFFFFF` (destaque monocromático). Ações especiais: amarelo `#EAB308` e laranja `#F05A28`. Feedback: sucesso `#10B981`, erro `#EF4444`. Texto secundário `#A1A1AA` no escuro (≈ 8:1). Cores fixas de macro: proteína `#F05A28`, carboidrato `#EAB308`, gordura `#A1A1AA`, água `#38BDF8`. No claro, laranja e amarelo só em anéis e ícones, nunca em texto. Tokens claros: fundo `#F2F2F7`, card `#FFFFFF`, texto `#0A0A0A`, secundário `#52525B`, CTA preto. Tipografia: escala da HIG, mínimo de 13 pt para legendas.
- **Tom:** sóbrio e esportivo, sem gradientes decorativos, sem emojis e sem glow. Referências: Oura, WHOOP, Fitbod, Linear, Apple Fitness.
- **Fonte:** SF Compact Rounded (Regular, Medium, Semibold, Bold) em `assets/fonts`.
- **Raio dos cartões:** 20 (botões: cápsula).
- **Vidro (Liquid Glass):** só na navegação (`NativeTabs`) e nas ações fixas (barra do CTA). Cards de conteúdo são sólidos. Fallback: `expo-blur`.
- **Ícone do app:** provisório.
- **Arquivo dos tokens no código:** `constantes/Cores.ts` (`Cores`, `Espacamento`, `Raio`, `Fonte`).

## Exceções aprovadas

- (levantado do código) Destaque branco em vez de uma cor de tint, e tema só escuro.
- 2026-10-26: `NativeTabs` (API instável do SDK 54) aprovado.
- 2026-10-26: mockups aprovados: login com Apple, consentimento, excluir conta. Resultado: variação A de `resultado-unido-2026-10-26.html` (orbe sólido, sem glow).
