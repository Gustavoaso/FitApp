# Arquitetura do Planejamento com IA

## Fonte de verdade

O planejamento ativo é criado uma vez no aceite da resposta da IA. O app separa:

- `Planejado`: o guia atual, editável, salvo nas tabelas de plano.
- `Registrado`: o que o usuário realmente executou ou consumiu.
- `Histórico`: versões aceitas e registros realizados, sem sobrescrever semanas antigas.

O JSON bruto de `planos_ia_gerados` serve para auditoria e reprocessamento. As telas não devem depender dele diretamente quando existe um plano ativo normalizado.

## Fluxo de aceite

1. O questionário gera o perfil e as preferências.
2. O serviço consulta alimentos e exercícios reais no Supabase.
3. O prompt envia essas listas com IDs.
4. A IA retorna sete dias de treino, descansos explícitos e a quantidade exata de refeições.
5. O validador confirma estrutura, quantidade, dias e IDs RAG.
6. O aceite desativa a versão anterior.
7. O treino é gravado em `planos_treino`, `dias_treino` e `exercicios_plano`.
8. A dieta é gravada em `planos_dieta`, `refeicoes_plano` e `alimentos_refeicao` para os sete dias.
9. O snapshot editável é salvo em `planos_dieta_editaveis`.
10. O cache local é atualizado apenas como aceleração da primeira leitura, nunca como fonte exclusiva.

## Experiência de treino

Inspirada no Hevy:

- Semana com dias de treino e descanso.
- Cada dia exibe divisão, exercícios, ordem, séries, repetições e descanso.
- O usuário inicia uma sessão a partir do planejado.
- Cada série registrada pode divergir da sugestão sem alterar o planejado.
- A sessão concluída entra no histórico e no progresso semanal.

## Experiência de dieta

Inspirada no MyFitnessPal:

- O Planejado mostra domingo a sábado.
- Cada dia mostra as refeições, horários, alimentos, porções e macros.
- O Registrado é independente e representa o consumo real.
- Adicionar alimento altera somente o registro do dia, salvo quando o usuário escolhe editar o planejamento.
- A meta semanal mede quantidade realizada, inclusive acima da meta.

## Regras de consistência

- Nenhum alimento ou exercício pode ser salvo no plano sem ID da base.
- Uma refeição extra registrada não altera retroativamente a meta planejada.
- Alterar o Planejado recalcula somente a semana vigente.
- Dias de descanso não geram penalidade.
- Toda escrita de aceite deve verificar o erro retornado pelo Supabase.
- A migration `007_planejamento_semanal_ia.sql` precisa estar aplicada antes do aceite da dieta normalizada.
