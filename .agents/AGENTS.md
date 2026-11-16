# Regras do Projeto FitApp

- **Mensagem de Commit Obrigatória**: Ao final de toda execução ou alteração de código realizada, gere sempre uma única mensagem de commit sucinta no padrão Conventional Commits com no máximo 5 linhas resumindo o conjunto de mudanças feitas.

## Ativação Contínua de Skills
As diretrizes abaixo devem ser aplicadas em TODAS as interações e tarefas de código deste projeto, de forma incondicional:
- **caveman**: Adote o estilo de comunicação conciso e sem enrolação da skill `caveman` o tempo todo (economia máxima de tokens).
- **fitapp-padroes**: Siga rigorosamente os padrões de código, nomenclatura e estrutura definidos na skill `fitapp-padroes` em qualquer arquivo modificado.
- **ponytail**: Mantenha a mentalidade minimalista de engenharia da skill `ponytail`. Escreva o mínimo de código possível e fuja de over-engineering.

## Fluxo novo-projeto

Documentação: [PROJETO.md](../docs/PROJETO.md) (regras), [VISUAL.md](../docs/VISUAL.md) (identidade), [PLANO.md](../docs/PLANO.md) (etapas), [ANDAMENTO.md](../docs/ANDAMENTO.md) (situação e decisões). Regra de negócio nova vai para o `PROJETO.md` antes do código.

Stack: Expo SDK 58 (React Native 0.88, React 19.3, expo-router 58 com `NativeTabs` em `expo-router/native-tabs`, Reanimated 4.7, TypeScript 6, Jest 30 com React Native Testing Library 14, em que `render`, `renderHook`, `fireEvent` e `act` são assíncronos e levam `await`). O Expo Go precisa ser o do SDK 58.

Estrutura: `app/` só rotas finas; código em `src/funcionalidades/<nome>/` e `src/compartilhado/` (alias `@/` → `src/`). Uma funcionalidade não importa de outra.

| O quê | Comando |
|---|---|
| Rodar | `npx expo start` |
| Tipos | `npm run typecheck` (`tsc --noEmit`) |
| Lint | `npm run lint` (ESLint com `eslint-config-expo`) |
| Testes | `npm test` (Jest + jest-expo, sem rede e sem banco; teste ao lado do arquivo, `*.test.ts`) |
| Importar exercícios | `node scripts/importar-exercicios.js` (lê `SUPABASE_URL`/`SUPABASE_KEY`; escreve no banco apontado) |
| Banco local | `npx supabase start` / `npx supabase db reset` (o reset carrega `supabase/seed/*.sql` e `supabase/seed.sql`; migrations em `supabase/migrations/`, a partir da baseline; as antigas ficam em `supabase/migracoes-antigas/`, só consulta) |
| Ingerir base de conhecimento | `SUPABASE_SERVICE_ROLE_KEY=<do npx supabase status> node scripts/ingestao-conhecimento.ts` (só texto, sem vetor; recusa URL que não seja localhost/127.0.0.1; trechos em `scripts/conhecimento/trechos.json`) |
| Embeddings gte-small | `npx supabase functions serve --env-file <arquivo com REPROCESSAR_SEGREDO e GROQ_API_KEY>` e `REPROCESSAR_SEGREDO=<o mesmo> ANON_KEY=<do status> bash scripts/reprocessar-embeddings.sh` (chama a Edge Function `reprocessar-embeddings`, 5 linhas por tabela por chamada, repete até zerar; no remoto só o dono, com `FUNCAO_URL`) |
| Instância de teste | `bash scripts/instancia-teste.sh subir` / `derrubar` (Supabase local + `db reset` com seed + ingestão do texto da base de conhecimento + Metro numa porta livre aberto no simulador iOS pelo Expo Go; `COM_EDGE=1` sobe o edge-runtime; PIDs em `$TMPDIR/fitapp-instancia-teste.pid`; Expo Go 58 no simulador: baixar o `iosClientUrl` do SDK 58 em `https://api.expo.dev/v2/versions/latest`, extrair numa pasta `ExpoGo58.app` e `xcrun simctl install booted <pasta>`) |
| Contas de teste (seed) | `conta-a@exemplo.com` (plano aceito e registros) e `conta-b@exemplo.com` (nova), senha `senha-teste-123` (atende ao mínimo de 8 com letras e números do `config.toml`; seed já confirmado); só banco local |
| Popular bases locais | `bash scripts/preparar-bases-locais.sh` (exercícios do JSON em `scratch/`, seeds de `supabase/seed/`, curadoria e ingestão; só no container local) |
| Avaliar planos | `SUPABASE_ANON_KEY=<do npx supabase status> node --import ./scripts/avaliacao/carregador.mjs scripts/avaliar-planos.ts` (8 perfis fictícios em sequência pela function `gerar-plano` local com `GROQ_API_KEY`, conta A do seed, Supabase local, não grava; relatório em `docs/avaliacoes/`; fora do `npm test`) |
| Testes de RLS | `npx supabase test db` (pgTAP em `supabase/tests/`, só banco local) |
| Testes das Edge Functions | `deno test supabase/functions/` (handlers isolados, sem rede nem segredo) |
| Disparar sincronizar-bases | `POST` com cabeçalho `x-sincronizar-segredo` igual ao secret `SINCRONIZAR_SEGREDO` da function (sem ele: 401; GET: 405) |
| Tipos do banco | `npx supabase gen types typescript --local --schema public > src/compartilhado/tipos/database.ts` e `npx prettier --write` no arquivo |

Regras que não podem ser quebradas:
- RLS ligada em toda tabela exposta; cada usuário só lê e altera o que é dele; `base_*` só leitura para `authenticated`.
- Nenhum segredo com prefixo `EXPO_PUBLIC_` (exceto URL/anon key do Supabase); `service_role` e chaves de terceiros nunca no app.
- O prompt da LLM nunca leva nome, e-mail nem ID do usuário.
- A LLM só escolhe IDs; contas, gramas e validação são código.
- Só dados fictícios no repositório, nos testes e no seed; testes nunca apontam para o Supabase de produção.
- Nada de escrita no banco remoto sem aprovação do dono.
