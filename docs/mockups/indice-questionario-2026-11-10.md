# Questionário inicial: 2 estilos (2026-11-10)

Cada HTML tem duas faixas (escuro e claro) com rolagem horizontal: telas 1 a 10, resumo, erro de validação (peso 24 kg), refazer pré-preenchido e geração. Tokens do `docs/VISUAL.md`, Sora, lima, sem emojis, alvos >= 44 pt, estado sempre com check ou texto além da cor. Todas as telas têm barra de progresso fina ("N de 10"), Voltar, Sair e "Rascunho salvo".

| Arquivo | Estilo | Custo |
|---|---|---|
| `questionario-v1-2026-11-10.html` | Cartões grandes (80 pt, ícone + título + 1 linha); escolha única avança ao tocar; números por roda, régua, tiles e stepper | M |
| `questionario-v2-2026-11-10.html` | Conversa: pergunta direta, chips, resumo das últimas 3 respostas no topo; sempre botão Continuar | P/M |

## Comparação
- V1: mais rápido (escolha única = 1 toque, sem botão), mais "app premium", explica cada opção (útil em Objetivo, Rotina, Onde treina). Risco: toque errado avança; mitigado por Voltar e pelo resumo final.
- V2: tom mais leve e sensação de progresso (resumo no topo), mas 1 toque a mais por tela e opções sem descrição (só aparece ao tocar). Chips quebram linha com Dynamic Type grande.

## Recomendação
**V1**, com um empréstimo da V2: o resumo de respostas no topo só no Resumo final (já existe). Telas de dias (2 a 7) e refeições (3 a 6) ficam com Continuar. Mantém ~10 toques e zero teclado.

## Notas de build (SDK 58)
- Componentes novos em `src/compartilhado/`: CartaoOpcao, ChipOpcao (com "exclusiva"), Regua (ScrollView horizontal com snapToInterval + `expo-haptics` selectionAsync), Roda (ScrollView vertical com snap, ou `@expo/ui` Picker estilo wheel, estável no SDK 58), Stepper, BarraProgresso. Sem dependência nova.
- Uma pergunta = uma tela de uma lista de passos (config), em vez de 4 etapas fixas; `campos-pendentes.ts` passa a validar por passo. Rascunho: persistir respostas a cada passo (já existe a ideia de rascunho; confirmar onde).
- Nível derivado: mapear as 4 faixas de tempo para iniciante/intermediário/avançado no código (regra nova vai antes para o `PROJETO.md`). "Rotina" mapeia o fator de atividade.
- Reduzir Movimento: anel da geração vira estático. Dynamic Type: cartões crescem em altura (minHeight); título pode ocupar 3 linhas.
- Validação: régua e roda limitam ao intervalo (14–100, 30–300, 100–250); a mensagem de erro aparece quando há elástico/valor digitado fora do limite.
- Parte B entra como passos novos na lista, antes do Resumo: meta de peso e prazo e tempo por sessão depois de "Dias por semana"; equipamentos detalhados depois de "Onde treina" (só se "casa com equipamentos"); "não como" depois de "Restrições alimentares". A barra "N de 10" passa a "N de total" pela config.

## Decisão (2026-11-10)
- Questionário: **V1** (cartões grandes).
- Tela 14 (geração do plano): **opção B, orbe de partículas** (`geracao-plano-opcoes-2026-11-10.html`): globo de pontos girando, varredura lima, partículas em órbitas inclinadas, percentual, log de etapas e Cancelar. Substitui a tela 14 do V1. Descartadas: A (reator), C (constelação), HUD completo e minimalista.
- Build: precisa de canvas (`@shopify/react-native-skia`, compatível com Expo SDK 58) ou pontos animados com Reanimated; Reduzir Movimento = globo parado, etapa em texto. Antes de codar, registrar a dependência no `PLANO.md`.
