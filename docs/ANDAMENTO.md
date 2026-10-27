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
| 1. Fundação | Implementada, aguardando o testador | 1 | |
| 2. Reorganizar por funcionalidade | Implementada, aguardando o testador | 1 | |
| 3. Tema, modo claro e componentes base | Pendente | | |
| 4. Navegação nativa e telas no tema novo | Pendente | | |
| 5. Segredos fora do app | Pendente | | |
| 6. Banco versionado (local) | Pendente | | |
| 7. Base de conhecimento | Pendente | | |
| 8. Motor de geração assistida | Pendente | | |
| 9. Geração com Ollama local | Pendente | | |
| 10. Resultado e conquistas | Pendente | | |
| 11. Consentimento e excluir conta | Pendente | | |
| 12. Sign in with Apple | Pendente | | |
| 13. Avaliação dos planos | Pendente | | |
| 14. Preparação para os testes finais | Pendente | | |
| 15. Testes finais: correções | Pendente | | |

Situações: Pendente · Implementada, aguardando o testador · Reprovada (tentativa X) · Concluída (testador: APROVADO) · Bloqueada (<tipo>) · Feita fora do fluxo (<hash>)

## Testes finais

| Agente | Veredito | Rodadas | Observação |
|---|---|---|---|
| testador (completo) | | | |
| seguranca | | | |
| testador-usuario | | | |

## Ações do dono

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

## Pendências

- `scratch/exercicios-bd-ptbr` está no índice como repositório embutido: `git rm --cached scratch/exercicios-bd-ptbr` (dono).
- `expo-doctor`: patches desatualizados (expo, expo-asset, expo-constants, react-native-worklets). Correção: `npx expo install --fix`, se o dono quiser.
- Lint: 43 avisos antigos.

- `scratch/exercicios-bd-ptbr` está no índice do git como gitlink (repositório embutido). Está no `.gitignore`, mas tirar do índice exige `git rm --cached scratch/exercicios-bd-ptbr`, comando que o desenvolvedor não pode rodar: ação do dono.
- `expo-doctor` acusa versões de patch antigas já existentes (`expo` 54.0.36→37, `expo-asset`, `expo-constants`, `react-native-worklets`): corrigir com `npx expo install --fix` numa etapa decidida pelo dono.
- Etapa 2: `compartilhado/servicos/` tem dependência circular `progresso-servico` ↔ `plano-gestao-servico` (já existia); fica para uma etapa futura, se o dono quiser.
