# Identidade visual: TreinaAI

> A base é a skill `visual-design` (padrão Apple atual). Este arquivo guarda só o que é deste projeto e vence a skill onde decidir diferente. Revitalização aprovada em 2026-11-04 (antes: FitApp, destaque branco). Mockups: `docs/mockups/telas-v3-2026-11-04.html`; referências: `docs/mockups/referencias.md`.

- **Nome:** TreinaAI (exibido). Bundle id, `scheme` e `slug` ficam como estão (afetam login Apple e Supabase).
- **Logo (do dono, fixa, sem alterar):** `docs/mockups/logo/logo-oficial-dono.png`. Ícone = tile de vidro com T-barra e faísca em lima, "TREINA" branco + "AI" lima. Ativos do app em `assets/images/` derivados dela (icon, splash, adaptive, monocromático).
- **Tema:** escuro (fundo `#0B0B0D`) e claro (`#F2F2F4`), seguindo o sistema. Tom: energético, confiante, limpo, moderno.
- **Neutros:** escuro: fundo `#0B0B0D`, card `#151518`, card2 `#1E1E22`, linha/trilha `#2A2A2E`, texto `#FFFFFF`, secundário `#A8A8B0`. Claro: fundo `#F2F2F4`, card `#FFFFFF`, linha/trilha `#E3E3E7`, texto `#0B0B0D`, secundário `#55555C`.
- **Destaque (lima elétrico `#D6FF00`):** fundo de CTA, anel e gráfico; sempre com texto `#0B0B0D` em cima (≥ 14:1). **No claro o lima nunca é texto nem ícone fino:** usar `limaTexto` `#5C6600` (6,3:1 sobre branco). Lima suave `#A3B300` só no escuro.
- **Neons com papel fixo** (valor escuro / claro, o claro é escurecido para AA): proteína laranja `#FF8A1F` / `#B84A00`; carboidrato amarelo `#FFD60A` / `#7A5C00`; gordura roxo `#B57BFF` / `#7A3FD0`; água azul `#3DA5FF` / `#0A66C2`; sucesso verde `#30D158` / `#1B7F37`; erro e recorde vermelho `#FF453A` / `#C9261B`. Estado nunca só por cor.
- **Fonte:** Sora (OFL), arquivos em `assets/fonts` (sem pacote novo), Regular/Medium/Semibold/Bold. Números `tabular-nums`. Escala da HIG com Dynamic Type ligado.
- **Raios:** cartão 24, botão cápsula, input 14. Grade de 4/8.
- **Brilho:** só no CTA principal (sombra lima suave) e no ícone. Cards sólidos sem borda grossa.
- **Vidro (Liquid Glass):** só na navegação (`NativeTabs`) e na barra do CTA. Fallback `expo-blur`.
- **Símbolos:** SF Symbols via `expo-symbols`, **zero emoji** em UI, texto, logs e docs de produto. O "+" central do mockup é botão flutuante próprio sobre a tab bar.
- **Fotos:** sem foto de comida/academia no app por ora; estado vazio usa símbolo + frase + ação.
- **Arquivo dos tokens no código:** `src/compartilhado/tema.ts` (`CoresEscuro`, `CoresClaro`, `Tipografia`, `Espacamento`, `Raio`).

## Exceções aprovadas

- 2026-10-26: `NativeTabs` aprovado.
- 2026-11-04: identidade nova (lima + neutros + neons), fonte Sora no lugar da SF Compact Rounded, logo do dono, "+" central como botão flutuante.
