# Andamento

Fluxo: novo-projeto
**Modo:** adotado
**Fase:** concluído
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
| 17. RAG híbrido para exercícios e alimentos | Concluída (maestro: verificações e avaliação 7/8) | 2 | ver git log |
| 16. Atualizar para o SDK 58 | Concluída (testador: APROVADO) | 1 | b031459 |
| 15. Testes finais: correções | Concluída (testador: APROVADO) | — | 8b21358, b160b5c, e75e0c5, 1af1577, 671112d, 57f26c9, d3f4899, ab8de6d |
| 19. Questionário V1 (10 passos) | Implementada, aguardando o testador | 1 | ver git log |
| 20. Validação e correções de funcionamento | Implementada, aguardando o testador | 1 | ver git log |
| 21. Plano com cara de profissional (RN19) | Implementada, aguardando o testador | 1 | ver git log |
| 22. Gasto calórico do treino (RN20) | Implementada, aguardando o testador | 1 | ver git log |
| 23. Foto do treino para compartilhar (RN21) | Implementada, aguardando o testador | 1 | ver git log |
| 24. Gamificação (RN22) | Implementada, aguardando o testador | 1 | ver git log |
| 25. Grupos e competição (RN23, RN24) | Implementada, aguardando o testador | 1 | ver git log |
| 28. IA na nuvem: Groq + embedding gte-small (RN06, RN14) | Implementada, aguardando o testador | 1 | ver git log |

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
- [ ] ~~Ollama no Mac servindo na rede local~~ (substituído pela etapa 28: Groq + gte-small; o app não usa mais o Ollama).
- [ ] **Etapa 28, no remoto, nesta ordem** (o agente não toca no remoto): 1) criar a chave em console.groq.com (plano gratuito); 2) `npx supabase db push` (migration `20261118000000_embeddings_gte_small.sql`); 3) `npx supabase secrets set GROQ_API_KEY=<chave> REPROCESSAR_SEGREDO=<texto longo aleatório>`; 4) `npx supabase functions deploy gerar-plano reprocessar-embeddings`; 5) `REPROCESSAR_SEGREDO=<o mesmo> FUNCAO_URL=https://<ref>.supabase.co/functions/v1/reprocessar-embeddings ANON_KEY=<anon do app> bash scripts/reprocessar-embeddings.sh` (repete sozinho até zerar); 6) gerar um plano no app e conferir; 7) depois, `npx supabase secrets unset REPROCESSAR_SEGREDO` (e, se quiser, apagar a function). Os trechos de `base_conhecimento` do remoto já têm texto: o reprocesso só preenche `embedding_384`. As colunas antigas `embedding` ficam até a troca ser confirmada.
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
- 2026-11-03: a geração usa só alimentos e exercícios básicos (RN17). Diagnóstico do remoto: os 23.413 alimentos eram todos do Open Food Facts (19.810 com marca, ~920 suplementos, ~940 diet/light/zero), nenhum da TACO; `is_curado` marcava até whey e macarrão instantâneo. Entram 590 alimentos da TACO (77 básicos) e 92 exercícios básicos.
- 2026-11-03: Open Food Facts apagado do remoto (backup em `FitApp-backups/2026-11-03/`); `alimentos_refeicao.alimento_id` virou `on delete set null` (as 84 linhas do plano ficaram, sem vínculo); `alimentos_favoritos.alimento_id` virou bigint. Usuário cadastra alimento próprio (`fonte = 'usuario'`, RLS, fora do plano). TBCA adiada: sem download em massa e licença CC BY-NC-ND, depende de autorização do FoRC/USP.

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

- Etapa 17: RPCs `buscar_exercicios_rag` e `buscar_alimentos_rag` (vetor + filtros), um embedding por geração; PREMISSA carboidrato ≥ 12 g/100 g; agentes indisponíveis, verificação feita pelo maestro (265 testes, typecheck, lint, format, 52 testes SQL; avaliação 7/8, vegano falha).
- Etapa 19: desvios do mockup V1 pelo `PROJETO.md` (nova RN18): sem as alergias (amendoim, frutos do mar) nem "Outra"/"Punho", porque o motor não tem regra para elas e a tela prometeria o que o plano não cumpre; dias 2 a 7 (RN08), então `validarFrequenciaSemanal` passou de máx. 6 para 7; idade 14 a 100 como no validador (menores de 18 continuam barrados na geração, RN16).
- Etapa 19: nível derivado das 4 faixas (`Nunca treinei` e `Menos de 6 meses` = iniciante; 6 meses a 2 anos = intermediário; mais de 2 anos = avançado), PREMISSA em RN18. Ao refazer, o nível salvo vira a faixa mais próxima (iniciante = "Menos de 6 meses").
- Etapa 19: tempo por sessão não é mais perguntado (Parte B): fica `1h` fixo (PREMISSA em `respostas.ts`). Divisão segue "Deixar a IA decidir". Valores guardados (`Casa`, `Peso do corpo`, `Ganho de força`, `Coluna-lombar`...) são os que `mapear-plano.ts` já entende; o rótulo da tela é separado.
- Etapa 19: padrões visíveis de roda, régua e stepper (idade 30, altura 170, peso 70, refeições 4; PREMISSA em `campos-pendentes.ts`) viram resposta ao Continuar. Réguas vão de 80 a 270 cm e 10 a 320 kg (mais largas que os limites) para o aviso de erro do mockup ser alcançável.
- Etapa 19: rascunho novo (`rascunho.ts`, AsyncStorage por usuário, chave `@fitapp_rascunho_questionario`), pois não existia. Refazer (parâmetro `dadosFormulario`) vence o rascunho; o rascunho é apagado ao gerar. "Editar" no resumo percorre só os passos do bloco (Perfil 2 e 3; Treino 5 a 7; Alimentação 8 e 10) e volta ao resumo.
- Etapa 19: `Roda` é um `ScrollView` com snap (não `@expo/ui` Picker), sem dependência nova. Haptic de seleção na régua, na roda, no stepper, nos cartões e chips.
- Etapa 20 (geração recusada): causa achada rodando o serviço fora do app contra a base remota, só leitura: os 590 `base_alimentos` do remoto estão **sem embedding**, a similaridade vem nula e a RPC ordena por id. O topo de proteína vira só peixe magro e o de complemento começa por abacate; a LLM (que não vê macros) escolhia combinações em que a gordura do dia não fechava ±5% ("gorduras 48 de 87") nas duas tentativas.
- Etapa 20: correção no motor (`motor/validador.ts`, `trocarParaFechar`): quando o dia não fecha, o código troca o mínimo de alimentos da refeição por candidatos do mesmo slot (que já respeitam as restrições) antes de recusar. A LLM continua só escolhendo IDs (RN07) e a tolerância de ±5% (RN09) não mudou. Alternativa descartada: afrouxar a tolerância. Conferido com 3 perfis contra a base remota: os 3 geram.
- Etapa 20: `MENSAGEM_FALHA` nova (PREMISSA de texto): manda tentar de novo e, se continuar, mudar dias de treino ou restrições no questionário.
- Etapa 20: `EXPO_PUBLIC_OLLAMA_URL` passa por `normalizarUrlOllama` (aceita `Meu-Mac.local:11434` sem `http://` e com barra no fim). O cliente já aceitava nome `.local` com `http://`.
- Etapa 20: detalhe do treino é rota nova na pilha da aba (`app/(tabs)/treino/[treinoId].tsx`, `TelaDetalheTreino`); o treino ao vivo recebe `treinoId` por parâmetro de rota e, sem ele, usa o treino de hoje. O botão "Iniciar este treino" fica no fim da lista (não fixo) para não ficar atrás da tab bar de vidro.
- Etapa 20: o treino ao vivo não mostra mais exercícios fictícios quando não acha treino; mostra "Treino não encontrado" ou "Hoje é dia de descanso".
- Etapa 20, falhas de integração entre abas achadas e corrigidas:
  1. Dieta → Início: o Início só somava refeições com `concluida = true`, marca que a Dieta nunca liga; calorias e macros do dia ficavam em zero. Agora soma todo alimento registrado (`inicio/consumo-do-dia.ts`).
  2. Treino ao vivo → Treino: concluir o treino não gravava o histórico do dia (`salvarHistoricoTreino` nunca era chamado); a tira da semana nunca marcava "feito". Agora grava.
  3. Treino → treino ao vivo: o botão "Iniciar" abria sempre o treino do dia da semana de hoje, mesmo com outro dia selecionado ou com "Trocar". Agora leva o id do treino mostrado.
  4. Treino → Início: o card "Hoje" ignorava a troca do dia e, em dia de descanso, mostrava o primeiro treino do plano. Agora usa a mesma regra da aba Treino (`treinoDoDia`/`obterTreinoDeHoje`); em descanso o botão vira "Ver treinos".
  5. Início → Perfil: o peso registrado no Início ficava só no histórico local e o Perfil mostrava o peso antigo do perfil. O Perfil agora mostra a última pesagem.
  6. Refazer plano → Início/Perfil: o peso informado no questionário não entrava no histórico; ao aceitar o plano ele vira uma pesagem (alternativa descartada: gravar a pesagem do Início em `perfis.peso_kg`, que mudaria a base do próximo plano sem a pessoa pedir).
- Etapa 20, conferido e sem falha: aceitar/refazer plano regrava o cache de treino, o mapa semanal e as metas, e as quatro abas releem no foco; água só existe no Início (lida do servidor no foco).
- Etapa 21: campos novos só no jsonb do plano (`papel`, `repeticoesReserva`, `aquecimento`, `progressao`, `inicioEm`, `momentoTreino`, `orientacao`, `medidaCaseira`, `substituicao`, `porQue`), todos opcionais; sem migration. Plano antigo mostra o que mostrava antes (testes em `orientacao-treino.test.ts`, `TelaResultadoQuestionario.test.tsx`, `alimento-planejado.test.ts`).
- Etapa 21: prescrição pelo papel do exercício (principal, acessório, isolado), não uma só por plano: até 2 compostos principais por sessão (o primeiro composto de cada grupo grande), faixa e descanso por objetivo, séries e repetições na reserva por nível (`motor/prescricao.ts`, PREMISSA; ACSM 2009/Schoenfeld 2017). Alternativa descartada: a mesma prescrição para todos os exercícios, como antes.
- Etapa 21: progressão = ciclo fixo de 4 semanas de dupla progressão (ajuste, +repetições, +carga, leve para iniciante/consolidação para os outros); peso do corpo sobe a variação em vez da carga. A semana atual conta a partir de `inicioEm` (data da geração, não do aceite: PREMISSA; o aceite não regrava o jsonb).
- Etapa 21: nome do dia pelo foco (`focoDoDia`), com A/B só quando o foco se repete na semana; dias da semana espalhados com descanso (3x = seg/qua/sex; PREMISSA em `diasDaSemana`).
- Etapa 21: refeições de 3 a 6 conforme a resposta (antes eram sempre 4); a fração de kcal de cada uma é o peso dela normalizado. Pré-treino = última refeição da tarde e pós-treino = jantar, porque o questionário não pergunta o horário do treino (PREMISSA: treino no fim da tarde). O `nome` continua o padrão ("Jantar") porque a RPC `salvar_plano_gerado` traduz o nome para o tipo; o pré/pós vai em `momentoTreino` e aparece como rótulo na aba Dieta. Rotina ativa (leve ou moderado) adianta o café em 30 min.
- Etapa 21: medida caseira pela porção típica da TACO (`porcao_descricao`/`porcao_gramas`), arredondada de meia em meia unidade; o serviço lê as porções por um `select` em `base_alimentos` (sem mudar a RPC); se falhar, o plano sai só com gramas.
- Etapa 21: substituição = outro candidato do mesmo slot (já filtrado pelas restrições) com kcal por grama do macro principal mais parecida, nas gramas que mantêm esse macro, de 5 em 5 g.
- Etapa 21: o detalhe do treino liga o dia do plano gerado pelo nome (o cache local guarda o nome como `foco`) e lê o último plano gerado (`buscarUltimoPlanoIA`); treino criado à mão ou de plano antigo não mostra aquecimento nem progressão.
- Etapa 21: a avaliação mostrou o perfil vegano com camarão e pintado: a lista de termos do vegetariano não pegava a categoria TACO "Pescados e frutos do mar". Acrescentei `pescado`, `frutos do mar` e `camarao` (vale também para a RPC, que recebe os mesmos termos). A reconferência do script usa a mesma lista, por isso não reprovou antes.
- Etapa 21: o script de avaliação passou a reprovar plano sem "Por que", sem progressão, sem aquecimento, sem reserva, com dia "Treino X" ou com número de refeições diferente do pedido, e grava um exemplo de treino e refeição por perfil.
- Etapa 21: banco local repopulado para a avaliação sem o `preparar-bases-locais.sh` (ele trunca `base_alimentos` e perderia os básicos da TACO da migration): `db reset`, importação de exercícios, curadoria da migration 20261103, ingestão de conhecimento e embeddings.
- Etapa 22: sem migration. O app não grava `sessoes_treino`; a sessão concluída vive no histórico local (`historico-servico`), que ganhou `kcalEstimadas` (opcional). Alternativa: coluna em `sessoes_treino` quando o app passar a gravar a sessão no banco.
- Etapa 22 (PREMISSA): MET pela densidade = volume (carga × reps) ÷ minutos ÷ peso. Volume 0 → 3,0; densidade ≥ 4 → 6,0; densidade ≥ 2 com ≥ 50% das séries em compostos → 5,0; senão 3,5. Duração limitada a 180 min; peso fora de 30–300 kg ou ausente → não calcula. Peso = última pesagem registrada (`obterHistoricoPeso`).
- Etapa 22 (PREMISSA): composto reconhecido pelo nome do exercício (agachamento, terra, supino, remada, desenvolvimento, leg press, puxada, barra fixa, avanço/afundo, stiff, paralela...), porque o tipo `Exercicio` não tem a marca. Alternativa: levar o `composto` do motor para o plano salvo.
- Etapa 22: duração = tempo total da sessão (com descansos), como a RN20 pede "horas ativas" sem defini-las; texto único `~N kcal (estimativa)` em `formatarKcalEstimada`. Aparece no fim do treino, no card do dia da aba Treino e no cartão "Próxima Sessão" do Início.
- Etapa 23: depois do `MomentoConquista`, o treino ao vivo abre `FimDoTreino` (modal tela cheia) com o resumo e "Registrar com foto" (câmera), "Escolher da galeria", "Usar cartão sem foto" e "Concluir". Antes o fim saía direto do treino. Câmera negada → aviso e as outras duas opções ficam na tela.
- Etapa 23: selo em `SeloTreino.tsx` (cores fixas, iguais no claro e no escuro, porque vira imagem); modelos "Coluna" (números grandes empilhados, estilo Strava) e "Faixa" (barra inferior com borda lima). Logo = `assets/images/icon.png` + "TREINA" branco/"AI" lima em Sora (sem ativo novo). Padrão: coluna, 9:16.
- Etapa 23: exportação por `react-native-view-shot` em 1080×1920 (9:16) ou 1080×1350 (4:5), JPG em arquivo temporário; salvar usa `expo-media-library` (API nova, `Asset.create`) com permissão só de escrita; galeria pelo seletor do iOS (sem permissão de leitura). Nada vai ao servidor.
- Etapa 23 (PREMISSA): números do selo = duração, volume (carga × reps, some quando 0) e kcal estimada (some quando a RN20 não calcula). A "sequência" da RN21 fica para a etapa 24 (gamificação ainda não existe).
- Etapa 23: dependências por `npx expo install ... -- --force` (o npm reclamava de `react-dom` × `react` 19.3.0, conflito antigo): expo-image-picker ~58.0.10, expo-media-library ~58.0.14, expo-sharing ~58.0.23, react-native-view-shot 6.1.1. Textos de permissão em português no `app.json`; microfone desligado.
- Etapa 24: sem tabela de XP. `public.resumo_gamificacao(p_hoje)` (security invoker, RLS vale) calcula XP, nível, sequência e medalhas a cada chamada; o app só grava a sessão em `sessoes_treino` (migration aditiva: vínculos com plano viram opcionais, novas colunas `nome_treino`, `duracao_minutos`, `kcal_estimadas`). Alternativa descartada: tabela de eventos com gatilho (mais peças, sem ganho agora).
- Etapa 24 (PREMISSA): treino vale 100 por **dia** distinto; água 20 quando total >= meta; refeições 40 no dia com >= 3 registradas e todas concluídas (o servidor não sabe quantas o plano previa); peso 20 por semana; bônus 150 por semana com dias treinados >= `dias_por_semana` do plano ativo (usa o plano de hoje para todas as semanas passadas). Semana começa na segunda. Níveis: 0, 150, 400, 800, 1400, 2200, 3300, 4800, 6800, 9500 (Iniciante a Lenda). Recorde de carga = carga máxima de um dia maior que todas as anteriores do mesmo exercício.
- Etapa 24: `calcularAderenciaSemanal` passou de somar treinos locais + servidor para o maior dos dois (agora o mesmo treino existe nos dois lugares). Comemoração: "Treino concluído", depois um `MomentoConquista` por nível novo ou medalha nova, depois o fim do treino (selo com "Sequência: N semanas").
- Etapa 28 (arquitetura): a function `gerar-plano` tem 2 ações. `buscar` (embedding gte-small + 3 RPCs com o JWT da pessoa) devolve as linhas; o app seleciona e monta como antes. `escolher` recebe só IDs e enums (grupo, slot, objetivo...), lê nomes e diretrizes do banco, monta o prompt e chama a Groq; o app valida (RN07). Alternativa descartada: app mandar o prompt (proxy aberto da Groq). Limites: 7 dias, 200 exercícios, 100 alimentos, 5 trechos, 5 erros de 200 caracteres; RN13 checada nas duas ações por `geracoes_hoje()` (429) além da RPC de gravar.
- Etapa 28: o `llama-3.3-70b-versatile` NÃO aceita `json_schema` (só gpt-oss, qwen3.8, muse-spark, segundo a doc de Structured Outputs em 2026-11-15). Usa `json_object` com o formato descrito no prompt; o validador do app + 1 retry cobrem desvio de schema. O schema com `enum` saiu do app (`montarSchemaEscolha`, `montarPrompt`); o prompt vive em `supabase/functions/gerar-plano/prompt.ts` e seus testes foram para o Deno (RN12: prompt sem nome, e-mail, ID). Apelidos e1, e2... agora são trocados dentro da function; o app só vê IDs reais.
- Etapa 28: `Supabase.ai.Session('gte-small')` é só em inglês (a doc avisa) e trunca em 512 tokens; as bases são em português, então a qualidade da ordenação vetorial pode cair. PREMISSA: seguir a decisão do dono; o filtro SQL e o código garantem a correção, o vetor só ordena. Medir com `scripts/avaliar-planos.ts`.
- Etapa 28: migration aditiva `20261118000000`: colunas `embedding_384` (vector 384) nas 3 bases; `buscar_*_rag` recriadas (a dimensão do parâmetro mudou: `drop` + `create`) lendo `embedding_384`; nova `geracoes_hoje()`. Colunas antigas ficam. Testes pgTAP ajustados a 384 e novo `geracoes-hoje.test.sql`.
- Etapa 28: `reprocessar-embeddings` (segredo `REPROCESSAR_SEGREDO` no cabeçalho `x-reprocessar-segredo`, service_role só nela) grava 5 linhas por tabela por chamada: localmente 50 estourou o limite de CPU do edge-runtime. `scripts/reprocessar-embeddings.sh` repete até zerar. Testado no banco local: 622 alimentos, 23 exercícios e 47 trechos reprocessados e a ação `buscar` respondeu com JWT real (anon key: 401).
- Etapa 28: removidos `ollama-cliente.ts`, `EXPO_PUBLIC_OLLAMA_URL` (.env.example e a linha do .env), `ingestao-embeddings-locais.ts`; `ingestao-conhecimento.ts` não gera mais vetor (a function preenche). `avaliar-planos.ts` agora entra como a conta A do seed e usa a function local (precisa de `GROQ_API_KEY` na function e `SUPABASE_ANON_KEY`).
- Etapa 28: mensagens novas da tela (sem rede, serviço ocupado, serviço fora, sessão expirada) em `gerar-plano-servico.ts`; limite diário usa a mensagem que já existia. O modelo gravado em `planos_ia_gerados.modelo_ia` passa a ser `llama-3.3-70b-versatile`.

## Pendências

- Etapa 22: a exibição na aba Treino e no Início não tem teste de tela (só o resumo do fim do treino e o histórico gravado).
- Etapa 23: câmera, salvar nas Fotos e a folha de compartilhar não foram vistas no simulador (o simulador não tem câmera; conferir em aparelho). Sequência no selo feita na etapa 24.
- Etapa 24: treino concluído offline fica só no histórico local (a sessão não é reenviada depois, então não conta XP); `p_hoje` vem do aparelho. Sem teste de tela do cartão de nível e da estante.
- Etapa 25: tabelas `grupos`, `grupo_membros`, `grupo_checkins` com RLS ligada e **nenhuma política** e privilégios revogados: o app só fala por RPC `security definer` (`search_path` vazio) que devolvem apelido, check-ins e pontos. `membro_id` é um id opaco do grupo (nunca o id de auth). Alternativa descartada: políticas de leitura por membro (expõem `usuario_id` de outros).
- Etapa 25 (PREMISSAS, lado restrito): só o criador vê o código e só ele convida; criador não sai (encerra); grupo encerrado ou vencido não aceita entrada e o código some; não membro recebe `nao_membro`; código inexistente/encerrado dá o mesmo erro `codigo_invalido`; limite de 5 conta só grupos ativos.
- Etapa 25: check-in vem de gatilho em `sessoes_treino` (treino finalizado, grupo ativo, data dentro do período e depois da entrada, respeita o interruptor por grupo). Pontos: 100 por **dia** distinto (igual à RN22); modo treinos = dias distintos, minutos = soma. Empate divide a posição. Período = do dia da criação até `duracao_semanas` (ou sem fim).
- Etapa 25: apelido em tabela própria `apelidos_usuario` (único sem diferenciar maiúsculas) e editado na aba Grupos, não na tela de Perfil (perfis tem campos obrigatórios que o app não sincroniza). Aba nova Grupos (5ª aba, a barra tinha 4). Compartilhar usa `Share` do RN (folha do iOS).
- Etapa 25: sem limite de tentativas no código de convite (espaço de ~1 bilhão de códigos); sem tela para trocar o apelido depois e sem pódio animado. Pendências para o dono avaliar.
- `expo-doctor`: `expo` 58.0.21 (pede ~58.0.25) e `react-native-safe-area-context` 5.10.1 (pede ~5.11.1), já antes da etapa 23.

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

- 2026-10-31 (testes finais): testador reprovou só pelo expo-doctor (`react-native` 0.88.0, SDK espera 0.88.1); a troca reescreve o lockfile e exige `--legacy-peer-deps` (conflito `react-dom` 19.3.1 × `react` 19.3.0): decidir com o dono. Segurança sem falha alta; `validar_compatibilidade_planejamento` revogada do `anon` (migration 20261031000100). Ficam: deep link `plano` sem validação, CORS `*` em `excluir-conta`, `npm audit` e Edge Functions rodando não verificados.
- Etapa 19: régua, roda e stepper só testados em jest (eventos de rolagem simulados); falta ver no simulador (snap, haptic, texto XXL, claro e escuro) e conferir o ícone de cada cartão (`figure.walk`, `desktopcomputer` etc.).
- Etapa 19: alergias alimentares e "Outra" só voltam se o motor ganhar regra para elas; "Parte B" (meta de peso, tempo por sessão, equipamentos, "não como") segue fora.
- Etapa 20 (dono/maestro): os 590 alimentos de `base_alimentos` no remoto estão sem embedding. A geração já funciona sem eles, mas o cardápio fica pouco variado (os primeiros por id: peixes, arroz). Gerar os embeddings no remoto é escrita e precisa de aprovação (etapa 27).
- Etapa 20: nada foi visto no simulador (detalhe do treino, card tocável, título da pilha, botão no fim da lista com a tab bar de vidro): papel do testador de usuário.
- Etapa 20, fora do escopo e não corrigido: o campo "Carga usada" do treino ao vivo não limpa ao mudar de exercício; concluir o mesmo treino duas vezes no dia conta dois treinos na semana; "hoje" é a data UTC em todas as telas (depois das 21h de Brasília vira o dia seguinte); a meta de água editada vale só para o dia; o peso padrão do modal do Início é fixo em 85,0; meta semanal manual continua valendo depois de refazer o plano; `salvarPlanoComoAtivo` grava uma chave de dieta do dia que ninguém lê.
- Etapa 21: avaliação 7 de 8 (`docs/avaliacoes/2026-11-15-avaliacao-planos.md`). O vegano falha de forma honesta: sem peixe e camarão, os básicos veganos da TACO (leguminosas, tofu) não chegam a 154 g de proteína dentro de ±5%. Opções para o dono: 1) meta de proteína menor para vegano; 2) incluir mais proteína vegetal concentrada na base; 3) manter a recusa.
- Etapa 21: `preparar-bases-locais.sh` trunca `base_alimentos` e recarrega o seed antigo; depois da migration da TACO (20261103) ele deixa o banco local sem os básicos. Ajustar o script numa etapa futura.
- Etapa 21: a referência da diretriz entra inteira no "Por que este plano" (ex.: "Kerksick CM, Arent S, Schoenfeld BJ, et al. ... 2017;14:33"); um campo de citação curta na `base_conhecimento` deixaria o texto mais limpo.
- Etapa 21: no perfil "peso do corpo", bíceps, tríceps, glúteos e panturrilha ficam fora do treino por falta de exercício curado sem equipamento (já avisado no plano); curadoria da base é do dono.
- Etapa 21: nada visto no simulador (cards de aquecimento e semana no detalhe, "Por que este plano", rótulos pré/pós e trocas na Dieta): papel do testador de usuário.
- Etapa 21: mais de 3 conceitos novos para o dono ler (papel do exercício, repetições na reserva, dupla progressão, medida caseira por porção da TACO).
- Etapa 20: mais de 3 conceitos novos para o dono ler (rota dinâmica `[treinoId]`, parâmetro de rota, `useFocusEffect`, busca exaustiva de combinações no motor).
- Etapa 26: Implementada, aguardando o testador. Utilitário único `src/compartilhado/movimento.tsx` (molas `suave`/`rapida` com quique 0 e `celebracao` com quique 0,65; `usePressao`, `useQuique`, `Entrada` em cascata, `useValorMola`, `NumeroContado`, `PreenchimentoMola`); Reduzir Movimento = valor final direto (`molaOuFinal`).
- Etapa 26: aplicado em BotaoPrimario, CartaoOpcao, CardVidro (prop `entrada`), AnelProgresso, BarraProgresso, CartaoNivel (XP), MomentoConquista, GradeTreinos, Início (kcal, macros, card de calorias), Dieta (refeições), Grupos (lista e pódio), treino ao vivo (haptic Medium + quique 1,06 no card da série).
- Etapa 26 (decisões): sem `Animated` antigo do RN no código (só Reanimated); "transição compartilhada" do plano ficou de fora (sem tela de detalhe com origem comum, só rota); valores de mola são premissa de design (Apple WWDC23), ajustáveis em `MOLAS`; cascata limitada a 8 itens (320 ms); `.set()` nos valores compartilhados por causa do React Compiler no lint.
- Etapa 26: nada visto no simulador (papel do testador). Mais de 3 conceitos novos (spring por duração/quique, shared value, worklet, `scheduleOnRN`).
- Etapa 27 (correção, rodada 1): migration `20261117000000_endurece_grupos_e_sessoes.sql`. `entrar_grupo` bloqueia após 5 falhas em 15 min (`muitas_tentativas`, tabela `tentativas_entrar_grupo`, sem acesso do cliente). Código errado agora devolve `null` em vez de exceção, porque a exceção desfaria o registro da falha; o app (`entrarNoGrupo`) converte `null` em "código não encontrado". Alternativa descartada: dblink/transação autônoma.
- Etapa 27: `sessoes_treino` ganhou trigger de validação (data hoje ou ontem em America/Sao_Paulo, duração 1 a 240, kcal 0 a 3000 ou null) só para os papéis `authenticated`/`anon` (seed, testes e manutenção seguem livres). O padrão de `data` passou a ser a data de São Paulo (em UTC passaria um dia à frente à noite). O app limita duração e kcal antes de gravar (`gamificacao-servico.ts`).
- Etapa 27: removido pelo criador não reentra (`grupo_removidos`, erro `removido_do_grupo`). Testes: `supabase/tests/endurecimento.test.sql`; `grupos.test.sql` ajustado ao retorno `null`.
- Etapa 27: `expo install --fix -- --force` deixou o expo-doctor em 20/20. O comando acrescentou o plugin `expo-status-bar` ao `app.json`; revertido (não era da etapa).
- Etapa 27 (RN25): "quique 0,65" lido como amortecimento da mola `celebracao`; subi para `dampingRatio: 0.7` (quique ~0,3). Se a intenção era outro valor, ajustar em `MOLAS`.
- Etapa 27 (npm audit --omit=dev): depois do `expo install --fix` as 2 altas sumiram; restam 23 (22 moderadas, 1 baixa), todas transitivas das ferramentas do Expo/Jest: `expo`/`@expo/fingerprint`/`minimatch`/`glob` (moderada, vem do Expo), `jest` e filhos (`@jest/*`, `babel-jest`, `babel-plugin-istanbul`, `test-exclude`, `jest-*`; moderadas, só de desenvolvimento), `deepmerge` (baixa, via jest-config). `npm audit fix` sem `--force` falha com ERESOLVE; a correção exige `--force` (quebraria o SDK): fica à espera de nova versão do SDK.
- Etapa 28: ponta a ponta com a Groq NÃO foi feito (sem chave no ambiente): a ação `escolher` só tem teste com fetch simulado. Fica para o dono depois do deploy (passo 6 em Ações do dono). Local: `buscar` testado de verdade.
- Etapa 28: `ingestao-embeddings.py` e `scripts/benchmark-llm/` ainda falam de Ollama/mxbai (consulta histórica); `index.ts` das functions não roda no `deno test` (só os handlers). Mais de 3 conceitos novos (IA embutida do edge-runtime, `json_object` x `json_schema`, RPC com JWT dentro da function, reprocesso em lotes por limite de CPU).
