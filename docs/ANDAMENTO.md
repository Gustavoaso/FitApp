# Andamento

Fluxo: novo-projeto
**Modo:** adotado
**Fase:** desenvolvimento
**Branch:** agente/fitapp (base: gustavo-branch)
**Pasta:** /Users/gustavosoares/Documents/Projetos/FitApp

## Validações do dono

| Validação | Data |
|---|---|
| 1. Documentação | 2026-10-26 |
| 2. Plano | 2026-10-26 |

## Revisão de design

| Data | Modo | Observação |
|---|---|---|
| 2026-10-26 | revisao (só código) + mockups | notas 1–2 de 3; melhorias aprovadas: tema, acessibilidade, estados, NativeTabs, títulos grandes, conquistas, modo claro |

## Etapas

| Etapa | Situação | Tentativas | Commit |
|---|---|---|---|
| 1. Fundação | Concluída (testador: APROVADO) | 1 | 6bf6e92 |
| 2. Reorganizar por funcionalidade | Concluída (testador: APROVADO) | 1 | a5228ff |
| 3. Tema, modo claro e componentes base | Concluída (testador: APROVADO) | 1 | babb305 |
| 4. Navegação nativa e telas no tema novo | Concluída (testador: APROVADO) | 1 | 028b004 |
| 5. Segredos fora do app | Concluída (testador: APROVADO) | 1 | 092f1e1 |
| 6. Banco versionado (local) | Concluída (testador: APROVADO) | 1 | 5d5c02c |
| 7. Base de conhecimento | Concluída (testador: APROVADO) | 1 | b8542c5 |
| 8. Motor de geração assistida | Concluída (testador: APROVADO) | 1 | 2bfae19 |
| 9. Geração com Ollama local | Concluída (testador: APROVADO) | 1 | 1570805 |
| 10. Resultado e conquistas | Concluída (testador: APROVADO) | 1 | 56ba4d3 |
| 11. Consentimento e excluir conta | Concluída (testador: APROVADO) | 1 | d01c1eb |
| 12. Sign in with Apple | Concluída (testador: APROVADO) | 1 | f0efadc |
| 13. Avaliação dos planos | Concluída (testador: APROVADO) | 1 | 96086df |
| 13b. Qualidade da geração | Concluída (testador: APROVADO) | 1 | dcd98fe |
| 14. Preparação para os testes finais | Concluída (testador: APROVADO) | 2 | d7a89f9, 4e07e63 |
| 17. RAG híbrido para exercícios e alimentos | Pendente | | |
| 16. Atualizar para o SDK 58 | Concluída (testador: APROVADO) | 1 | b031459 |
| 15. Testes finais: correções | Concluída (testador: APROVADO) | — | 8b21358, b160b5c, e75e0c5, 1af1577, 671112d, 57f26c9, d3f4899, ab8de6d |

Situações: Pendente · Implementada, aguardando o testador · Reprovada (tentativa X) · Concluída (testador: APROVADO) · Bloqueada (<tipo>) · Feita fora do fluxo (<hash>)

## Testes finais

| Agente | Veredito | Rodadas | Observação |
|---|---|---|---|
| testador (completo) | APROVADO | 2 | rodada 1 reprovou (format:check, expo-doctor); correções 8b21358, b160b5c |
| seguranca | REPROVADO só com DECIDIR | 2 | rodada 2 (e75e0c5): CORRIGIR nenhum; DECIDIR 1 (revogar sbp_/RapidAPI/Groq, repo privado), 4 (política de senha no painel remoto); Baixas: limite só no RPC, npm audit em tooling, console.warn com objetos, CORS *, pg_trgm em public |
| testador-usuario | INCOMPLETO (rodada 3, final) | 3 | itens 1–10 da rodada anterior confirmados; CORRIGIR 1 objetivo errado no Perfil, 2 teclado numérico sem fechar no treino ao vivo, 3 cortes com texto XXL no Início; FALTOU: momento de conquista visto, erro de rede, excluir conta e cadastro no local  Correções finais em ab8de6d (testador rápido APROVADO); teclado e texto XXL não revistos no simulador. |

## Ações do dono

- [ ] **URGENTE:** o repositório no GitHub é **público** e o token `sbp_e405…` está no histórico (commit 8cbf222). Revogar o token e tornar o repositório privado.
- [ ] No painel do Supabase remoto: senha mínima 8 com requisitos, confirmação de e-mail e checagem de senha vazada.

- [ ] Revogar o token Supabase `sbp_e405…` (commit `8cbf222`, publicado no GitHub) em supabase.com/dashboard/account/tokens.
- [ ] Rotacionar a chave da RapidAPI (está no histórico do git em `servicos/tacoSincronizacaoServico.ts`).
- [ ] Conferir se o repositório no GitHub é público. Se for, torná-lo privado até a auditoria de segurança.
- [ ] Revogar a chave Groq, se ainda existir (`EXPO_PUBLIC_GROQ_KEY` ia no bundle).
- [ ] Ollama no Mac servindo na rede local: `OLLAMA_HOST=0.0.0.0`, `OLLAMA_KEEP_ALIVE=30m`, com os modelos `llama3.2` e `mxbai-embed-large`.
- [ ] Opcional: remover os modelos não usados (`gemma4:e4b`, `qwen3.5:4b`).
- [ ] Sign in with Apple: habilitar o provedor Apple no painel do Supabase (Services ID e chave da conta Apple Developer).
- [ ] Login OAuth do MCP supabase (`/mcp`), se quiser que o Claude audite o banco remoto.

## Decisões do dono

- 2026-10-26: objetivo desta rodada = terminar o plano de retomada.
- 2026-10-26: commit `wip` do estado anterior (`0402c0c`) feito pelo maestro, com o ok do dono.
- 2026-10-26: a LLM continua local (Ollama), **sem Cloudflare**. O app chama o Ollama pela rede local.
- 2026-10-26: reorganizar as pastas por funcionalidade, logo depois da fundação.
- 2026-10-26: entram a exclusão de conta, o consentimento de saúde e o Sign in with Apple. App Store fica para depois.
- 2026-10-26: `base_conhecimento` com 40–60 trechos curados pelo Claude, com fonte.

- 2026-10-26: Resultado = variação A; água `#38BDF8`; testes finais com Supabase local, simulador iOS e testes práticos de segurança.
- 2026-10-26: plano de 15 etapas aprovado.

- 2026-10-27 (maestro, autonomia do dono): seg. item 4 — endurecer o Auth no `config.toml` local (senha mín. 8 com letras e dígitos, confirmação de e-mail); replicar no painel remoto é ação do dono.

- 2026-10-27 (maestro): DECIDIR do testador-usuario — #8 inspetor JSON só em `__DEV__`; #12 questionário começa vazio (placeholders); #15 garantir que o momento de conquista apareça antes de ir às abas; #13 (superávit × fonte) fica para revisão do dono.

- 2026-10-28: atualizar para o Expo SDK 58 para abrir no Expo Go do iPhone (etapa 16).

- 2026-10-30: RAG híbrido (vetor + filtros SQL) para exercícios e alimentos; `is_curado` deixa de ser obrigatório para alimentos (RN14 revista, etapa 17).

## Decisões do agente

- Etapa 1: versões fixadas para o SDK 54 (jest-expo ~54, eslint-config-expo ~10, jest ~29.7); `react-test-renderer@19.1.0` como dev (exigido pelo RNTL); testes de entrada inválida registram o comportamento atual (NaN/TypeError).

- Etapa 1: versões fixadas no SDK 54 (`jest-expo ~54`, `eslint-config-expo ~10`, `jest ~29.7`); o `npx expo install` puxava o jest-expo 58 (exige React 19.2).
- Etapa 1: `react-test-renderer@19.1.0` entrou como dev: é peer obrigatório do `@testing-library/react-native` e precisa casar com o React 19.1.0.
- Etapa 1: ESLint ignora `supabase/` (Deno), `scratch/`, `.venv/` e `.expo/`; os 43 avisos existentes ficam como avisos (só os 2 erros foram corrigidos, com aspas tipográficas em `BuscaAlimentosModal.tsx:252`).
- Etapa 1: testes de entradas inválidas registram o comportamento atual (NaN / TypeError), pois as funções de cálculo não validam; a validação mora no questionário.
- Etapa 1: de `scratch/` foram para `scripts/` `importar-exercicios.js`, `atualizar-exercicios.js` e `ingestao-embeddings.py`; apagados `rag.py` e `verify_match.js` (experimentos).
- Etapa 2: código em `src/` (alias `@/` → `src/`, mapeado também no `moduleNameMapper` do Jest); `app/` só reexporta as telas (`export { default } from ...`); os `_layout.tsx` ficaram em `app/` (são configuração de navegação).
- Etapa 2: serviços usados por 2+ funcionalidades (`repositorio`, `historico-servico`, `plano-gestao-servico`, `progresso-servico`) e o `AuthContexto` foram para `compartilhado/` (alternativa: duplicar ou dividir, que mudaria lógica). Os específicos ficaram na funcionalidade (IA local no questionário, sincronização TACO/ExerciseDB no perfil).
- Etapa 2: `constantes/Cores.ts` virou `compartilhado/tema.ts`; o resto de `constantes/` (hoje sem uso) foi para `compartilhado/constantes/`; `IconesFitApp` (sem uso) ficou em `compartilhado/ui/`. A tela de resultado do questionário ficou em `plano/`; o portão de entrada (`app/index`) em `autenticacao/TelaInicialRaiz.tsx`.
- Etapa 1: `.env.example` lista só as variáveis em uso (`SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_OLLAMA_URL`, `SUPABASE_KEY`); Groq e TACO ficaram de fora porque saem do app na etapa 5.

- Etapa 2: estrutura em `src/` (alias `@/` → `src/`); serviços usados por 2+ funcionalidades e `AuthContexto` em `src/compartilhado/`; `constantes/Cores.ts` virou `src/compartilhado/tema.ts`; `_layout.tsx` ficam em `app/`.
- Etapa 3: tokens novos em `compartilhado/tema.ts` (`CoresEscuro`, `CoresClaro`, `Tipografia`, `CoresMacros`, `RAIO_CARTAO`, `razaoContraste`) e hook em `compartilhado/useTema.ts`; os exports antigos (`Cores`, `Fonte`, `Glass`...) ficam até a etapa 4 migrar as telas.
- Etapa 3: PREMISSA (claro): separador `rgba(0,0,0,.10)`, esqueleto `#E4E4E7`, erro `#DC2626`, sucesso `#059669`; sem preferência do sistema, o tema é o escuro.
- Etapa 3: `CardVidro` manteve o nome (evita mexer nas telas) e virou superfície sólida com borda fina; `BotaoPrimario` virou cápsula de altura 50 com Headline (17 Semibold).
- Etapa 3: `EstadoErro` reutiliza `EstadoVazio` (símbolo SF + frase + botão); `Skeleton` pulsa com Reanimated e para com Reduzir Movimento.
- Etapa 3: nenhum componente base é botão só de ícone, então não houve onde pôr `hitSlop`; vale para os que a etapa 4 criar.
- Etapa 4: cada aba virou pasta com uma `Stack` (`app/(tabs)/<aba>/_layout.tsx` + `index.tsx`) para ter `headerLargeTitle`; as opções comuns ficam em `compartilhado/navegacao.ts`. Tab bar = `NativeTabs` com `minimizeBehavior="onScrollDown"`; Dieta usa o símbolo `fork.knife` (antes `apple.logo`).
- Etapa 4: telas migradas para `useTema()` com `criarEstilos(cores)` + `useMemo`. Mapeamento: `accent`→`destaque`, `accentBorda`/`borda.*`/`vidro.borda`→`separador`, `texto.desabilitado`→`textoSecundario`. A troca foi feita por script Node/Python fora do projeto (16 arquivos, mecânica); a revisão está no diff.
- Etapa 4: macros por significado em gráfico, legenda e barras: carbo `#10B981`→`CoresMacros.carboidrato`, gordura `#A855F7`→`gordura`, proteína `#EAB308`→`proteina`.
- Etapa 4: erro de carregamento → `EstadoErro` (gerar plano no questionário, com "Revisar respostas"; inspetor JSON do perfil). Erro de envio (login, cadastro, aceitar plano) → texto inline em `cores.erro` com `accessibilityRole="alert"` (alternativa: `EstadoErro` de tela cheia, que apagaria o formulário). `ActivityIndicator` → `Skeleton`. Alertas de validação, confirmação e sucesso ficaram.
- Etapa 4: `BlurView` dos modais segue o tema (`tint` claro/escuro).
- Etapa 5: caminho Groq removido; `chamarIA` em `questionario/ia-local-servico.ts` lança "geração indisponível" até a etapa 9 (Ollama). Gerar plano fica fora do ar entre as etapas 5 e 9.
- Etapa 5: `taco-sincronizacao-servico.ts` não fala mais com a RapidAPI nem sincroniza; o inspetor de dev lê `base_alimentos` do banco. `sincronizarAlimentosTaco` (sem uso) saiu.
- Etapa 5: chave RapidAPI escrita no código removida também da function `sincronizar-bases` (só `Deno.env`) e de `scripts/test-sync.ts` (lê `RAPIDAPI_KEY` do `.env`); `.env.example` ganhou `RAPIDAPI_KEY`.
- Etapa 5: o cliente do app não lê mais `SUPABASE_KEY` (é dos scripts e pode ser `service_role`); só `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Etapa 5: grep no bundle (`expo export --platform ios`) por groq/rapidapi/chave antiga/service_role: só um falso positivo em bytes de uma fonte OpenType.
- Etapa 8: motor em `plano/motor/` com tipos locais (`tipos.ts`: `ExercicioCandidato`, `AlimentoCandidato`), sem tipos gerados do banco; a etapa 9 mapeia as linhas do SQL para eles.
- Etapa 8: divisões fixas: 2 Superior/Inferior · 3 Empurrar/Puxar/Pernas · 4 Sup/Inf ×2 · 5 PPL+Sup+Inf · 6 PPL ×2 · 7 PPL ×2 + Condicionamento (`corpo_inteiro`). "Dias seguidos" inclui o último com o primeiro (a semana se repete).
- Etapa 8: PREMISSA volume: reps/descanso por objetivo (força 3-6/180 s, hipertrofia 8-12/90 s, definição 10-15/60 s, emagrecimento 12-15/60 s, condicionamento 15-20/45 s); séries 3/3/4 e exercícios por sessão 4/5/6 (iniciante/intermediário/avançado), repartidos em rodízio pelos grupos do dia.
- Etapa 8: PREMISSA dieta: 4 refeições (café 25%, almoço 35%, lanche 15%, jantar 25%), 1 alimento por slot; porção de 5 a 500 g (com 400 g o perfil de ~3.700 kcal não fechava o carboidrato só com arroz).
- Etapa 8: gramas por descida por coordenadas com corte nos limites, erro relativo em kcal e nos 3 macros (alternativa: NNLS/active-set, mais código para 3 variáveis). Se não fecha ±5%, `montarPlano` devolve erros (entram no retry da etapa 9).
- Etapa 8: calorias abaixo do piso da RN16 bloqueiam (não sobem para o piso), como pede o critério de pronto; dado de saúde inválido também bloqueia.
- Etapa 8: `validador.ts:116` usa `as unknown as EscolhaLLM` depois de conferir cada campo (estreitar o objeto inteiro por type guard exigiria repetir a validação).
- Etapa 8: o validador antigo `questionario/validador-plano-ia.ts` ficou; sai com o fluxo antigo na etapa 9.
- Etapa 6: baseline `20261026000000_baseline.sql` gerada do banco local após 001–027 (`db dump`), reescrita limpa; as antigas foram para `supabase/migracoes-antigas/` (só consulta, o CLI não lê). Alternativa: manter 001–028 e só corrigir com migrations novas (o reset continuaria quebrando na 028).
- Etapa 6: `historico_peso`, `historico_series_executadas`, `planos_ia_gerados` e `registro_refeicoes` estavam **sem RLS**; agora toda tabela com `usuario_id` tem ler/criar/alterar/apagar só do dono (PROJETO §3), e as filhas (dias, exercícios, refeições, alimentos) seguem o dono do plano por `e_dono_plano_treino/dieta`. Políticas duplicadas antigas sumiram; bases só `select` para `authenticated` (antes valia para qualquer papel com `auth.uid()`).
- Etapa 6: `base_conhecimento` mínima (id bigint, tipo, titulo, fonte not null, conteudo, embedding vector(1024)); a etapa 7 acrescenta tema/objetivos/níveis. RPCs com `security invoker`, `search_path = public, extensions` e sem execução para `anon`.
- Etapa 6: curadoria por `id_externo` (lista tirada do JSON do free-exercise-db em `scratch/`): fora levantamento olímpico, alongamento, strongman e rolo de espuma (179 ids). `is_curado` começa false (como em alimentos); sem `id_externo` (seed manual) entra. Alternativa: default true.
- Etapa 6: índices duplicados da 019 (`*_compat`, `idx_*_usuario` cobertos por compostos) não entraram na baseline.
- Etapa 6: tipos gerados em `src/compartilhado/tipos/database.ts` (`supabase gen types --local`, formatado com prettier); ainda sem uso no código.

- Etapa 9: a tela de Resultado dispara a geração; o plano fica ativo ao ser gerado (o anterior fica inativo, não apagado); `planos_ia_gerados` sem políticas de UPDATE/DELETE (protege o limite); o limite só é checado ao salvar. PREMISSAs: mapeamento de grupos e equipamentos, papel do alimento pelo macro dominante, restrições por palavras do nome, treinos a partir de segunda.
- Etapa 10: campo opcional `fundamentos` no plano; fonte em rota `app/questionario/fonte.tsx` (formSheet); sem botões Voltar/Compartilhar do mockup; PREMISSA nos textos do aviso e da conquista.
- Etapa 11: aceite sem perfil cria o perfil com os valores iniciais do cadastro; barra do Continuar sólida (sem vidro); handler da `excluir-conta` separado com exclusão injetada.
- Etapa 12: botão só onde `isAvailableAsync()` confirma (iOS); sem nonce (exigiria `expo-crypto`); nome da Apple não é salvo (perfil padrão "Atleta").
- Etapa 13: correção no motor (`items: false` quebrava o Ollama 0.32.5); `montarPlanoGerado` separado; `scripts/preparar-bases-locais.sh` popula as bases locais. Avaliação: 0/8 (tempo 82–128 s, vegano e peso do corpo sem candidatos, joelho ignorado).
- Maestro (2026-10-27): etapa 13b acrescentada ao plano para corrigir a qualidade da geração, com a autonomia dada pelo dono.
- Etapa 13b: nunca amplia equipamento (degraus: nível → qualquer nível → grupo secundário); apelidos curtos de ID no prompt; timeout 180 s; PREMISSAs nas palavras de risco por articulação e nos textos de fase. Avaliação: 7/8, média 51 s (vegano reprova por falta de proteína vegetal na base).
- Maestro (2026-10-27): o seed da etapa 14 inclui tofu e proteína de soja (dados nutricionais de referência, sem dado pessoal) para o perfil vegano.
- Etapa 14: Expo web não sobe (exigiria `react-native-web`, fora do plano); o script abre o Expo Go no simulador; `COM_EDGE=1` sobe o edge-runtime; tofu pela TACO e PTS pelo USDA FDC 174275; senha fictícia `senha-teste-123` só no banco local. Tentativa 2: `rls.test.sql` independente do seed; `.env.example` com `EXPO_PUBLIC_SUPABASE_URL`.

## Pendências

- 2026-10-28: app conferido com o `.env` real (`npx expo start --port 8083`), bundle iOS compila (1692 módulos) e aponta para o Supabase de produção.
- Não verificado: excluir conta e cadastro novo ponta a ponta (Edge Functions e e-mail não rodam no local); momento de conquista visto no simulador; teclado da carga e texto XXL depois de ab8de6d; erro de rede; VoiceOver real.
- 2026-10-29: produção recriada a partir das migrations (tabelas de usuário estavam vazias), preservando 23.413 alimentos e 873 exercícios; 47 trechos de conhecimento carregados; `vector` movida para `extensions`; histórico de migrations reparado (7 locais = remoto). Backup e scripts em `~/Documents/Projetos/FitApp-backups/2026-10-29/`. Schema `legado_20261029` ainda em produção, para apagar após o dono confirmar.
- `alimentos_favoritos.alimento_id` é `uuid` nas migrations, mas `base_alimentos.id` é `bigint`: corrigir numa migration nova.
- Tofu e proteína de soja estão só no seed local, não na base de produção.
- Revisar: plano gerado já fica ativo sem o aceite; superávit indicado × fonte (#13); 47 referências escritas de memória.

- `excluir-conta` não foi chamada de verdade (edge-runtime desligado): conferir no teste de ponta a ponta.

- Decidir: plano gerado e não aceito também fica ativo (etapa 9).
- Lint do banco: `v_dia_semana` sem uso em `salvar_plano_gerado`; troca de dia no fuso de São Paulo sem teste.

- Etapa 7: as 47 referências da `base_conhecimento` foram escritas de memória pelo agente; conferir as citações antes de exibi-las publicamente.

- `scratch/exercicios-bd-ptbr` está no índice como repositório embutido: `git rm --cached scratch/exercicios-bd-ptbr` (dono).
- `expo-doctor`: patches desatualizados (expo, expo-asset, expo-constants, react-native-worklets). Correção: `npx expo install --fix`, se o dono quiser.
- Lint: 43 avisos antigos.

- `scratch/exercicios-bd-ptbr` está no índice do git como gitlink (repositório embutido). Está no `.gitignore`, mas tirar do índice exige `git rm --cached scratch/exercicios-bd-ptbr`, comando que o desenvolvedor não pode rodar: ação do dono.
- `expo-doctor` acusa versões de patch antigas já existentes (`expo` 54.0.36→37, `expo-asset`, `expo-constants`, `react-native-worklets`): corrigir com `npx expo install --fix` numa etapa decidida pelo dono.
- Etapa 3 → 4: as cores de macro do `GraficoDonutMacros`, das legendas do `CardRefeicao` e das barras da `TelaDieta` ainda são as antigas; trocar as três juntas por `CoresMacros` na etapa 4 (trocar só o gráfico desencontraria a legenda).
- Etapa 2: `compartilhado/servicos/` tem dependência circular `progresso-servico` ↔ `plano-gestao-servico` (já existia); fica para uma etapa futura, se o dono quiser.
- Etapa 4: o título grande não encolhe ao rolar, porque o `ScrollView` está dentro de um `View` (os modais são irmãos dele); resolver junto com a troca dos modais por sheets nativas.
- Etapa 4: sobraram cores soltas sem par no tema (amarelo do raio/IA `#EAB308`, azul `#3B82F6`, botão amarelo do treino ao vivo, cores do inspetor JSON, overlays `rgba(0,0,0,…)`); e `Cores`/`Fonte`/`Glass` antigos ainda exportados em `tema.ts`, usados só pelo `IconesFitApp` (sem uso).
- Etapa 4: `Alert` de sucesso (copiar refeição, plano salvo, treino concluído) deveria virar confirmação discreta com haptic (VISUAL); fica para a etapa 10 ou outra.
- Etapa 6 (dono): o remoto tem as migrations 001–028 registradas; antes de aplicar a baseline lá, marcar o histórico com `npx supabase migration repair` (reverted 001–028, applied 20261026000000) e aplicar só a de curadoria, depois de conferir as políticas novas. Nada foi feito no remoto.
- Etapa 6: `alimentos_favoritos.alimento_id` é uuid, mas `base_alimentos.id` virou bigint (antiga 021): favoritos não conseguem referenciar alimentos; corrigir numa etapa futura.
- Etapa 6: o seed (`supabase/seed/*.sql`) não é carregado pelo `db reset` (o config procura `supabase/seed.sql`); o banco local sobe sem bases. Ligar em `config.toml` na etapa 14.
- A chave RapidAPI `b7ad…` e a do Groq estiveram no histórico do git: revogar/trocar no painel da RapidAPI e do Groq (dono).
