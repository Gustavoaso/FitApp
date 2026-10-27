# Benchmark de LLMs locais — 03/10/2026

**Máquina:** MacBook M2, 8 GB de RAM, Ollama 0.32.5. Durante o teste, o simulador iOS e a IDE estavam abertos e havia ~10 GB em swap, como num dia normal de desenvolvimento.

**Scripts:** `scripts/benchmark-llm/bench.py` (formato livre) e `bench2.py` (formato assistido).
**Dados brutos:** `2026-10-03-benchmark-llm-local.json`

## Tarefas
- **Treino (3):** Push academia intermediário, Legs em casa iniciante, Pull academia avançado. A pontuação considera IDs válidos, sem repetição, quantidade certa, distribuição por grupo muscular, compostos antes de isolados, séries e reps.
- **Dieta (2):** onívoro 2.400 kcal com 4 refeições; vegetariano 2.000 kcal com 5 refeições. A pontuação considera IDs válidos, número de refeições, porções realistas e o erro de kcal e de cada macro.
- 2 repetições por tarefa, temperatura 0,2, saída estruturada do Ollama (`format` = JSON Schema).

## Duas arquiteturas testadas
- **Livre:** a LLM devolve o plano inteiro (IDs, séries, reps, gramas), como o `iaLocalServico.ts` faz hoje.
- **Assistida:** a LLM **só escolhe**.
  - **Treino:** o schema tem um array por grupo muscular, com os IDs permitidos (`enum`) e `minItems`/`maxItems`.
  - **Dieta:** o modelo escolhe de 2 a 4 alimentos por refeição.
  - **O código faz o resto:** ordena (compostos primeiro), define séries e reps, e calcula as gramas por mínimos quadrados com limites (`scipy.lsq_linear`) para bater os macros.

## Resultados

| Modelo | Tamanho | Livre: treino | Livre: dieta | Livre: tempo | **Assistido: treino** | **Assistido: dieta** | **Assistido: tempo** |
|---|---|---|---|---|---|---|---|
| `llama3.2` (3B) | 2,0 GB | 57% | 47% | 40 s | **95%** | **82%** | **11 s** |
| `phi4-mini` (3.8B) | 2,5 GB | 57% | 44% | 47 s | 93% | 68% | 12 s |
| `qwen3.5:4b` | 3,4 GB | 67% | 62% | 144 s | — (timeout > 15 min) | — | — |
| `gemma4:e4b` | 6,6 GB | não testado: não cabe em 8 GB | | | | | |

## Conclusões
1. **A arquitetura importa mais que o modelo.** No formato livre, todos falham: Push sem tríceps, Pull sem bíceps, macros com erro de 20% a 380%. No assistido, os mesmos modelos chegam a 93–95% no treino, e os macros ficam com erro de 0–2% quando o cardápio é balanceado.
2. **`llama3.2` (3B) é a melhor escolha para este hardware.** Foi o mais rápido, teve a melhor nota e já está instalado. O `qwen3.5:4b` é melhor "no papel", mas com 8 GB entra em swap (1–3 tokens/s) e travou com o schema restrito.
3. **Falhas que restaram no formato assistido**, e como resolver:
   - *Refeição sem proteína* (ex.: lanche só com tomate e azeite) → usar **slots por papel** na refeição (`proteina`, `carboidrato`, `complemento`), cada um com o seu `enum`, como já é feito no treino.
   - *Porções nos limites* (350 g de ovo, 30 g de arroz) quando o cardápio é desequilibrado → resolvido pelos slots, e o solver passa a calcular por refeição.
   - *`maxItems` de refeições nem sempre respeitado* (o `phi4-mini` devolveu refeições a mais) → o código trunca e valida.
   - *Exercícios inadequados na base* ("Clean e Desenvolvimento" no Push; "Chutes Alternados" e "Elevação de Perna" como glúteo/quadríceps) → **curadoria da `base_exercicios`** (flag `is_curado`, como em alimentos).
   - *A base tem pouca variedade para treino em casa* (1 exercício de isquiotibiais e 1 de panturrilha com halteres ou peso corporal) → completar a base.

## Limitações
O teste foi pequeno (5 tarefas × 2 repetições) e em uma única máquina com memória pressionada. Antes de fechar a implementação, repetir com os perfis-teste da Fase 5.
