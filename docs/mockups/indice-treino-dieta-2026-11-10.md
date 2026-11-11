# Treino e Dieta: 2 variações cada (2026-11-10)

Cada HTML mostra a variação em escuro e claro. Tokens de `docs/VISUAL.md`, Sora, lima, sem emojis. Inspiração só de estrutura (tira de semana, anéis, cards empilhados, grade, "+" e tab bar flutuantes).

| Arquivo | Ideia | Custo |
|---|---|---|
| `treino-v1-2026-11-10.html` | Resumo do plano com 4 segmentos + grade 2 colunas; cor por treino em tom de neon e letra grande ao fundo (sem pasta) | P/M |
| `treino-v2-2026-11-10.html` | Card lima do treino de hoje com "Iniciar treino" + lista do resto da semana | P |
| `dieta-v1-2026-11-10.html` | 4 anéis (calorias lima, macros nas cores fixas) com "Faltam" + cards de refeição com kcal por alimento | M |
| `dieta-v2-2026-11-10.html` | 1 anel grande de calorias + 3 barras de macro + refeições em linha do tempo (planejadas tracejadas) | M |

Em comum: tira dom–sáb com dia atual em cápsula lima e ponto por dia (verde feito, lima planejado), "+" lima flutuante, tab bar flutuante em vidro (só na navegação).

## Comparação
- Treino V1 dá panorama do plano; V2 dá ação imediata (retenção: primeiro valor em um toque). V1 repete o padrão de grade que o dono gostou; V2 foge mais do Fitfolio.
- Dieta V1 é a estrutura pedida (4 anéis), mas 4 cores de anel brigam entre si. Dieta V2 usa um único acento lima no anel e macros em barras finas: mais calmo, mais "TreinaAI", e o "faltam" fica numa frase só.

## Recomendação
- **Treino: V1 com o card de hoje da V2 no topo** (hoje destacado em lima, grade abaixo). Resolve panorama e ação.
- **Dieta: V2** (anel único + barras), mantendo o "Faltam X g" por macro como texto pequeno sob a barra se o dono quiser a leitura dos 4 anéis. Se preferir os 4 anéis, usar V1 mas com anéis de macro em traço fino.
- Anel duplo dieta/treino no calendário (conceito MAXXD): fica para depois; a tira já tem ponto por dia como base.

## Notas de build (SDK 58)
- Tira de semana, anéis (`react-native-svg`, já comum no Expo), barras e cards são Views; sem dependência nova se `react-native-svg` já estiver no projeto (conferir).
- Tab bar: `NativeTabs`; o "+" é botão próprio (já aprovado no VISUAL.md). Dynamic Type: cards em grade devem crescer em altura (minHeight, não height); em texto extra grande, grade passa a 1 coluna.
- Alvos: dias da tira 44x44; botões "..." 44x44.
