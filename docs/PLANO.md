# Plano

> Aprovado pelo dono em 2026-10-26 (validação 2). Depois disso o desenvolvimento segue sem novas aprovações até o resultado.
> Plano anterior (adoção): `docs/plano-de-acao-retomada.md`. Os itens de código não feitos viraram as etapas abaixo. Os manuais estão em "Ações do dono" no `ANDAMENTO.md`.

**Testes finais:** testes práticos de segurança sim · teste de usuário ios (simulador) · banco de teste supabase local (Docker)

**Regras gerais de todas as etapas**
- Nenhuma escrita no Supabase remoto (`asuxqjbwgetdcldjoaqm`). Migrations são testadas só no banco local (`npx supabase db reset`). Aplicar no remoto é ação do dono.
- Testes unitários sem rede: o Ollama e o Supabase entram como dublês.
- Convenções: `fitapp-padroes` (português, kebab-case nos arquivos novos) e a skill `code-design`.

## Etapa 1: fundação

- **Escopo:** só o que falta para verificar o projeto.
  - Scripts `typecheck` (`tsc --noEmit`), `lint` (ESLint com `eslint-config-expo`) e `test` (Jest + `jest-expo` + React Native Testing Library).
  - Testes de `utilidades/calculos.ts`, cobrindo RN01 a RN05.
  - `.gitignore` com `.env*` (exceto `.env.example`) e `scratch/exercicios-bd-ptbr/`.
  - `.env.example` com as variáveis reais e sem valores, incluindo `EXPO_PUBLIC_OLLAMA_URL`.
  - Scripts úteis de `scratch/` vão para `scripts/`; os experimentos são apagados.
  - Docs desatualizados (`task.md`, `implementation_plan.*`, `checklist_construcao.md`, relatórios de julho) vão para `docs/arquivo/`.
  - Atualizar a tabela de comandos do `.agents/AGENTS.md`.
- **Pronto quando:** `npm run typecheck`, `npm run lint` e `npm test` passam; os testes cobrem RN01 a RN05.
- **Dependências permitidas:** `eslint`, `eslint-config-expo`, `jest`, `jest-expo`, `@testing-library/react-native`, `@types/jest`. Todas de dev, gratuitas.
- **Premissas:** não se aplica.

## Etapa 2: reorganizar por funcionalidade

- **Escopo:** só mover arquivos (`git mv`).
  - Estrutura `funcionalidades/{autenticacao,questionario,plano,treino,dieta,inicio,perfil}/` + `compartilhado/` (ui, tema, supabase, utilidades, tipos).
  - Alias `@/` e fim dos aliases `@fitapp/*`.
  - As rotas de `app/` ficam finas (só importam a tela).
  - Ajustar os imports e renomear os arquivos fora do padrão para kebab-case.
  - Atualizar a skill `fitapp-padroes` (tirar Turborepo/Next, pôr a estrutura nova) e o `AGENTS.md`.
  - **Nenhuma mudança de lógica, de visual ou de nome de função.**
- **Pronto quando:**
  - typecheck, lint e testes passam;
  - `npx expo export --platform ios` compila;
  - nenhuma funcionalidade importa de outra (só de `compartilhado/`).
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** não se aplica.

## Etapa 3: tema, modo claro e componentes base

- **Escopo:**
  - Tokens em `compartilhado/tema`, com tema escuro e claro por `useColorScheme`:
    - texto secundário `#A1A1AA` no escuro;
    - escala tipográfica da HIG com mínimo de 13 pt;
    - raio 20;
    - cores fixas por macro: P `#F05A28`, C `#EAB308`, G `#A1A1AA`.
  - Hook `useTema()`.
  - O `CardVidro` vira superfície sólida; o vidro fica só na navegação e nas ações fixas.
  - Novos componentes base `Skeleton`, `EstadoVazio` e `EstadoErro` (com "Tentar de novo").
  - Acessibilidade nos componentes base:
    - `accessibilityRole` e `accessibilityLabel`;
    - `hitSlop` nos botões só de ícone;
    - resumo em texto para o VoiceOver em `AnelProgresso`, `GraficoDonutMacros` e `GraficoEvolucao`.
  - `app.json` com `userInterfaceStyle: automatic` (mantido).
- **Conceitos novos:** tema dinâmico, estados base, acessibilidade.
- **Pronto quando:**
  - testes dos componentes base (renderizam nos dois temas; `EstadoErro` chama a ação ao tocar);
  - o contraste do texto secundário é de pelo menos 4,5:1 nos dois temas (teste sobre os tokens);
  - typecheck, lint e testes passam.
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** pode (tons do tema claro).

## Etapa 4: navegação nativa e telas no tema novo

- **Escopo:**
  - Trocar a barra de abas feita à mão por `NativeTabs` (`expo-router/unstable-native-tabs`).
  - `headerLargeTitle` em Início, Treino, Dieta e Perfil.
  - Migrar todas as telas para `useTema()`, para o modo claro funcionar.
  - Trocar os `ActivityIndicator` soltos e os `Alert` de erro pelos estados base.
- **Pronto quando:**
  - nenhuma tela importa as cores fixas antigas (Grep);
  - `npx expo export --platform ios` compila;
  - typecheck, lint e testes passam.
- **Dependências permitidas:** nenhuma nova (API instável do SDK 54, aprovada).
- **Premissas:** pode.

## Etapa 5: segredos fora do app

- **Escopo:**
  - Remover `EXPO_PUBLIC_GROQ_KEY` e o caminho Groq.
  - Tirar do app a chave RapidAPI de `tacoSincronizacaoServico`: a sincronização das bases passa a acontecer só pela function `sincronizar-bases` (secret) ou por script local com `.env`.
  - Garantir que nenhum `EXPO_PUBLIC_` carregue segredo.
- **Pronto quando:**
  - um Grep por chaves no código do app e no bundle (`expo export`) não encontra nada;
  - typecheck, lint e testes passam.
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** **sem premissa**.

## Etapa 6: banco versionado (local)

- **Escopo:**
  - Migration de baseline consolidando 001–028.
    - A 028 está corrigida: `id bigint`.
    - Inclui `base_conhecimento` e `vector`.
  - RLS conferida em toda tabela de usuário; `base_*` só leitura para `authenticated`.
  - Funções com `search_path` fixo.
  - Coluna `is_curado` em `base_exercicios`, com uma migration de curadoria: remove olímpicos, alongamentos e itens mal classificados.
  - Tipos gerados em `compartilhado/tipos/database.ts` a partir do banco local.
  - Testes de RLS em SQL (usuário A não lê nem escreve dados de B).
- **Conceitos novos:** baseline, testes SQL.
- **Pronto quando:**
  - `npx supabase db reset` aplica sem erro;
  - os testes de RLS passam no banco local;
  - typecheck passa com os tipos novos.
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** **sem premissa** (RLS).

## Etapa 7: base de conhecimento

- **Escopo:**
  - Tabela `base_conhecimento`: `tipo`, `tema`, `titulo`, `fonte`, `conteudo`, `objetivos[]`, `niveis[]` e `embedding vector(1024)` (dimensão do `mxbai-embed-large`).
  - RPC `buscar_conhecimento_rag(embedding, objetivo, nivel, limite)`.
  - Arquivo de 40 a 60 trechos curados, todos com a fonte (RN15).
  - Script `scripts/ingestao-conhecimento.ts`, que gera os embeddings no Ollama local e faz upsert no banco local.
- **Pronto quando:**
  - cada trecho tem a fonte preenchida (teste);
  - a RPC retorna os trechos filtrados no banco local (teste SQL);
  - o script roda com o Ollama ligado e falha com uma mensagem clara se o Ollama estiver desligado.
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** pode (seleção dos trechos), sempre com a fonte.

## Etapa 8: motor de geração assistida (lógica pura)

- **Escopo:** em `funcionalidades/plano/motor/`.
  - Divisão semanal determinística de 2 a 7 dias (RN08).
  - Volume, séries e reps por objetivo e nível.
  - Montagem do JSON Schema com `enum` de IDs por grupo e por slot (RN07).
  - Prompt sem dados pessoais (RN12).
  - Gramas por mínimos quadrados com limites, ±5% (RN09).
  - Validador (RN10) e travas de saúde (RN16).
- **Conceitos novos:** schema restrito, mínimos quadrados, validador.
- **Pronto quando:** testes unitários cobrem:
  - 2, 3, 4, 5, 6 e 7 dias;
  - macros dentro de ±5% em pelo menos 5 perfis;
  - um prompt sem nome, e-mail e ID;
  - a rejeição de menor de 18 anos, de IMC fora de 16–45 e de calorias abaixo do piso;
  - nenhum grupo em dias seguidos.
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** pode, exceto RN16.

## Etapa 9: geração ponta a ponta com Ollama local

- **Escopo:**
  - Cliente Ollama em `funcionalidades/plano/`: URL `EXPO_PUBLIC_OLLAMA_URL`, `format` = schema, timeout de 60 s.
  - Recuperação de exercícios e alimentos por SQL e de conhecimento por vetor (RN14).
  - 1 retry com os erros (RN10).
  - RPC transacional `salvar_plano_gerado(jsonb)`, com rate limit de 5 por dia no fuso de São Paulo (RN11, RN13).
  - Log em `planos_ia_gerados`.
  - O questionário passa a usar esse fluxo; `iaLocalServico.ts` e a function `gerar-plano` são aposentados (apagados).
  - Mensagem de erro de rede da seção 8 do `PROJETO.md`.
- **Pronto quando:**
  - testes com o Ollama simulado cobrem: sucesso, retry, falha dupla sem gravar nada e Ollama fora do ar com a mensagem certa;
  - um teste SQL da RPC cobre a transação e a 6ª geração no dia, que é recusada.
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** pode (textos).

## Etapa 10: tela de Resultado e momentos de conquista

- **Escopo:**
  - Redesenho do Resultado segundo o mockup aprovado (`docs/mockups/resultado-unido-2026-10-26.html`, **variação A**: orbe grande com anel dos macros, 4 nós incluindo a água `#38BDF8`, linha do tempo, card "Por que estes números"; versão clara no mesmo arquivo):
    - justificativas e fontes vindas da `base_conhecimento`, com as fontes tocáveis abrindo um formSheet;
    - aviso profissional;
    - ação fixa em vidro.
  - Momento de conquista ao aceitar o plano e ao concluir o treino: mola + haptic Success, respeitando `useReducedMotion`.
- **Pronto quando:**
  - teste de componente: o Resultado mostra kcal, os 3 macros, pelo menos 1 fonte e o aviso;
  - com Reduzir Movimento ligado, não há animação (teste).
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** pode (textos).

## Etapa 11: consentimento de saúde e exclusão de conta

- **Escopo:**
  - Tela de Consentimento (mockup aprovado). O aceite é gravado com data em `perfis` e o questionário fica bloqueado sem ele.
  - Excluir conta no Perfil, com confirmação destrutiva.
  - Edge Function `excluir-conta`, que apaga o usuário do Auth (`service_role` só na function) e todos os dados por cascade.
- **Conceitos novos:** consentimento, exclusão.
- **Pronto quando:**
  - teste SQL: depois da exclusão, não sobra nenhuma linha do usuário em nenhuma tabela;
  - teste de tela: sem o aceite, o Continuar fica desabilitado;
  - a function recusa chamada sem JWT (teste Deno).
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** **sem premissa** (exclusão de dados).

## Etapa 12: Sign in with Apple

- **Escopo:**
  - Botão "Continuar com a Apple" no login (mockup aprovado), com `signInWithIdToken` do Supabase.
  - Plugin no `app.json`.
  - O e-mail vira a opção secundária.
- **Pronto quando:**
  - teste com o módulo simulado: o token vai para o Supabase e o cancelamento não mostra erro;
  - `expo export` compila.
  - O teste real depende da ação do dono (provedor Apple no Supabase).
- **Dependências permitidas:** `expo-apple-authentication` (gratuita; exige Apple Developer para o build real).
- **Premissas:** não pode.

## Etapa 13: avaliação da qualidade dos planos

- **Escopo:**
  - Script `scripts/avaliar-planos.ts` com 8 a 10 perfis-teste fixos e fictícios:
    - iniciante em casa;
    - avançado 6x;
    - mulher 50+ em emagrecimento;
    - vegano;
    - sem lactose;
    - 2x por semana;
    - restrição no joelho.
  - O script roda contra o Ollama real e o banco local, aplica as checagens do validador e salva o relatório em `docs/avaliacoes/`.
- **Pronto quando:** o script roda e gera o relatório; falha com uma mensagem clara se o Ollama estiver desligado. Não entra no `npm test`.
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** pode.

## Etapa 13b: qualidade da geração (acrescentada pelo maestro em 2026-10-27)

> Decisão do maestro com a autonomia dada pelo dono, a partir da avaliação `docs/avaliacoes/2026-10-27-avaliacao-planos.md` (0 de 8 aprovados).

- **Escopo:**
  - **Tempo:** a meta é chegar a no máximo 60 s na avaliação. Para isso:
    - reduzir o prompt e o número de candidatos por grupo/slot;
    - testar `num_ctx` menor e `keep_alive`;
    - subir o timeout do app de 60 s para **180 s** (PREMISSA), com um texto de progresso na tela de Resultado ("Montando seu treino…", "Escolhendo alimentos…").
  - **Restrição física:** o motor passa a usar `restricao_fisica`. Com joelho, ficam fora os exercícios de impacto, salto e flexão profunda de joelho; com ombro e coluna, a mesma lógica para os grupos de risco.
  - **Falta de candidatos:** quando um grupo ou slot fica sem candidato:
    - primeiro, amplia o filtro em degraus (equipamento → nível → grupo secundário);
    - depois, se um grupo ainda ficar vazio, ele sai do dia com um aviso no plano, sem falhar o plano inteiro;
    - para o vegano, as proteínas vegetais (leguminosas, tofu, soja) passam a contar como `proteina`.
  - Rodar `scripts/avaliar-planos.ts` de novo e salvar um relatório novo.
- **Pronto quando:**
  - testes unitários: o joelho exclui exercícios de impacto; o plano vegano e o de peso do corpo são montados com os candidatos simulados; um grupo vazio sai do dia com aviso;
  - o novo relatório mostra pelo menos 6 de 8 perfis aprovados e o tempo médio abaixo de 90 s (meta de 60 s registrada se não for atingida).
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** pode, exceto as travas de saúde (RN16).

## Etapa 14: preparação para os testes finais

- **Escopo:**
  - `supabase/seed.sql` com 2 contas fictícias (A e B), um plano aceito e alguns registros, além de amostras das bases.
  - `scripts/instancia-teste.sh subir|derrubar`:
    - confere que aponta para o banco local, nunca para a URL do `.env` de produção;
    - roda `supabase start` e `db reset`;
    - sobe o app (Expo web numa porta livre e/ou simulador iOS) com as variáveis do banco local;
    - grava os PIDs em `$TMPDIR/fitapp-instancia-teste.pid`.
- **Pronto quando:** `subir` deixa o app acessível com o banco local e o login das contas fictícias funciona; `derrubar` libera portas e processos.

## Etapa 15: Testes finais: correções

- Reservada. Só os CORRIGIR dos testes finais, sem dependência nova e sem premissa nova.

## Etapa 16: atualizar para o Expo SDK 58 (pedido do dono em 2026-10-28)

- **Por quê:** o Expo Go do iPhone do dono só abre projetos do SDK 58.
- **Escopo:**
  - `npx expo install expo@^58` e `npx expo install --fix`.
  - Seguir os guias de atualização 55, 56, 57 e 58: React, React Native, expo-router e NativeTabs (a API pode ter saído de `unstable-`), reanimated/worklets, jest-expo e eslint-config-expo.
  - Ajustar o código ao que quebrar, sem mudar comportamento.
  - Atualizar o `AGENTS.md` com a versão nova.
- **Pronto quando:**
  - typecheck, lint, jest e format:check passam;
  - `expo-doctor` passa;
  - `npx expo export --platform ios` compila;
  - o app abre no simulador pelo Expo Go do SDK 58.
- **Dependências permitidas:** as versões do SDK 58 e o que o `expo install --fix` pedir.
- **Premissas:** não se aplica.

## Etapa 17: RAG híbrido para exercícios e alimentos (decisão do dono em 2026-10-30)

- **Escopo:**
  - RPCs `buscar_exercicios_rag` e `buscar_alimentos_rag` (migration nova), com:
    - similaridade vetorial ordenando os candidatos;
    - filtros duros: exercício `is_curado`, grupo e equipamento; alimento com macros válidos e kcal > 0, e restrições;
    - limite por grupo ou slot;
    - `security invoker`, `search_path` fixo e execute só para `authenticated`.
  - O serviço de geração passa a buscar por essas RPCs, com o embedding da consulta (objetivo, nível, restrições) gerado no Ollama, um só por geração.
  - Se a busca vetorial vier vazia, amplia como a etapa 13b.
  - Remover a obrigatoriedade de `is_curado` para alimentos.
  - Atualizar `scripts/ingestao-embeddings.py` se o formato do texto mudar (sem obrigação).
- **Pronto quando:**
  - teste SQL das RPCs (ordem por similaridade, filtros de equipamento e restrição, `anon` sem acesso);
  - testes do serviço com as RPCs simuladas;
  - avaliação com o script `avaliar-planos.ts` no banco local com pelo menos 6 de 8 perfis aprovados;
  - typecheck, lint, jest e format:check passam.
- **Dependências permitidas:** nenhuma nova.
- **Premissas:** pode, exceto RN16.

## Etapa 18: tela de geração com orbe de partículas (decisão do dono em 2026-11-10)

- **Escopo:**
  - Trocar o indicador atual da geração do plano (`TelaResultadoQuestionario`, fases por tempo) pelo orbe do mockup `docs/mockups/geracao-plano-opcoes-2026-11-10.html` (opção B): globo de pontos girando, varredura lima, partículas em órbitas inclinadas, título "Montando seu plano", log de fases com check e Cancelar.
  - Componente próprio em `src/compartilhado/ui/` (orbe isolado, sem lógica de plano), com tokens do `docs/VISUAL.md`, claro e escuro.
  - Desenho: `@shopify/react-native-skia` (conferir a versão compatível com o SDK 58 via `npx expo install`); se não for compatível, `react-native-svg` com Reanimated e ~150 pontos.
  - Orbe sempre em movimento (parado só com Reduzir Movimento). Percentual e barra de progresso ESTIMADOS (o serviço não informa o real): `1 - exp(-t/25 s)`, teto de 95% enquanto gera, piso por fase concluída, sem retroceder (função pura `progresso-geracao.ts`; `BarraProgresso` com `accessibilityValue`). Fases (`FASES_GERACAO`) com check nas concluídas.
  - Reduzir Movimento: orbe parado, fases em texto. `accessibilityLabel` e `accessibilityLiveRegion` na fase atual.
  - Cancelar continua voltando ao resumo, como hoje.
- **Pronto quando:** typecheck, lint, jest e format:check passam; o teste cobre fases (check nas concluídas) e Reduzir Movimento; `npx expo export --platform ios` compila; o orbe aparece no simulador pelo Expo Go do SDK 58.
- **Dependências permitidas:** `@shopify/react-native-skia` (versão do `expo install`).
- **Premissas:** o questionário V1 (10 telas) fica para a etapa 19; esta etapa só troca a tela de geração.

## Etapa 19: questionário V1, uma pergunta por tela (decisão do dono em 2026-11-10)

- **Escopo:**
  - Reescrever `src/funcionalidades/questionario/TelaQuestionario.tsx` conforme `docs/mockups/questionario-v1-2026-11-10.html` e as notas de build em `docs/mockups/indice-questionario-2026-11-10.md`: 10 perguntas, uma por tela, em lista de passos (config), com barra de progresso "N de 10", Voltar, Sair e "Rascunho salvo".
  - Escolha única avança ao tocar; dias (2 a 7) e refeições (3 a 6) com Continuar; números por roda, régua e stepper; tela de resumo; erro de validação; "refazer" pré-preenchido.
  - As mesmas respostas de hoje (`RespostasEmEdicao`), sem pergunta nova (a "Parte B" fica fora). `campos-pendentes.ts` passa a validar por passo.
  - Componentes novos em `src/compartilhado/ui/` (CartaoOpcao, ChipOpcao, Regua, Roda, Stepper), com tokens do `docs/VISUAL.md`, claro e escuro, alvos >= 44 pt, haptics na régua.
  - Rascunho: persistir as respostas a cada passo (reusar o que já existe).
  - Ao confirmar o resumo, segue para a geração (etapa 18).
- **Pronto quando:** typecheck, lint, jest e format:check passam; testes por passo (validação, avançar/voltar, rascunho, resumo); `npx expo export --platform ios` compila.
- **Dependências permitidas:** nenhuma nova (`expo-haptics` já vem no SDK).
- **Premissas:** layout e textos seguem o mockup V1; onde o mockup divergir das regras do `PROJETO.md`, vale o `PROJETO.md` e o desvio vai para o `ANDAMENTO.md`.
