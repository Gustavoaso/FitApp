# Plano de Ação — Retomada do FitApp

> Criado em 03/10/2026. Substitui `task.md` e `implementation_plan.md` como guia vigente.
> Marque `[x]` à medida que avançar. Cada fase tem um **critério de pronto**: só avance quando ele for verdadeiro.

## Visão geral

| Fase | Objetivo | Quem executa | Esforço |
|---|---|---|---|
| 0 | Segurança imediata e conexão MCP | Você (manual) | 30 min |
| 1 | Organizar o repositório | Claude | 0,5 dia |
| 2 | Auditar e versionar o banco (via MCP) | Claude + sua aprovação | 1 dia |
| 3 | Decidir a arquitetura de IA e a LLM | Você decide, Claude prototipa | 0,5 dia |
| 4 | Implementar o RAG na edge function | Claude | 2–3 dias |
| 5 | Testar as funcionalidades | Claude + você no celular | 1–2 dias |
| 6 | Auditar a segurança | Claude | 1 dia |
| 7 | Documentar e fechar | Claude | 0,5 dia |

---

## Fase 0 — Segurança imediata e conexão MCP

**Por quê:** existe um token administrativo do Supabase no histórico público do GitHub, e o Claude ainda não enxerga o banco.

- [ ] **Revogar o token `sbp_e405…`** em supabase.com/dashboard/account/tokens. Ele está no commit `8cbf222`, publicado no GitHub.
- [ ] **Rotacionar a chave da RapidAPI** que está hardcoded em `servicos/tacoSincronizacaoServico.ts:16`.
- [ ] Conferir se o repositório no GitHub é público. Se for, considerar torná-lo privado até o fim da Fase 6.
- [ ] Recarregar o VS Code (*Developer: Reload Window*) → rodar `/mcp` → **supabase** → login OAuth.
  - O `.mcp.json` já foi corrigido para o formato do Claude Code (`type: http`, sem token).
- [ ] Confirmar com o Claude que ele consegue listar as tabelas.

**Critério de pronto:** token revogado, e o Claude executa `list_tables` no projeto `asuxqjbwgetdcldjoaqm`.

---

## Fase 1 — Organizar o repositório

**Por quê:** a migração de monorepo para app único está só no working tree (98 arquivos deletados e 38 não rastreados). Qualquer erro hoje perde trabalho.

- [ ] Atualizar o `.gitignore`: `en.openfoodfacts.org.products.csv`, `scratch/exercicios-bd-ptbr/`, `.env*` (exceto `.env.example`), `__pycache__/`, `.venv/`.
- [ ] Commit 1: `refactor: migra de monorepo para app expo único na raiz`. Só a reestruturação, sem mudança de lógica.
- [ ] Commit 2: as mudanças do RAG em andamento (edge function, validador, knowledge, migration 028), marcadas como WIP.
- [ ] Mover os scripts úteis de `scratch/` para `scripts/` (ingestão e importação de exercícios). Apagar os experimentos (`rag.py`, `verify_match.js`).
- [ ] Atualizar o `.env.example` com as variáveis reais e sem valores: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, e as secrets da edge function.
- [ ] Arquivar a documentação desatualizada em `docs/arquivo/`: `task.md`, `implementation_plan.*`, `checklist_construcao.md`, relatórios de julho.
- [ ] Adicionar scripts ao `package.json`: `typecheck`, `test`.
- [ ] Abrir um PR `gustavo-branch → main` e fazer o merge, para ter uma base limpa.

**Critério de pronto:** `git status` limpo, `npm run typecheck` sem erros, app abrindo no Expo Go.

---

## Fase 2 — Auditar e versionar o banco (via MCP)

**Por quê:** parte do schema foi criada fora das migrations (`base_conhecimento`, colunas `embedding`). Também não se sabe quais migrations foram aplicadas.

### 2.1 Levantamento (somente leitura)
- [ ] Listar as tabelas, colunas e tipos reais, e comparar com `supabase/migrations/`.
- [ ] Listar as migrations aplicadas (`list_migrations`) e comparar com os 28 arquivos locais.
- [ ] Contar e checar a qualidade dos dados:
  - `base_exercicios`: total, distribuição por `grupo_primario`, `equipamento`, `nivel` e categoria; quantos têm `embedding`.
  - `base_alimentos`: total, quantos com `is_curado = true`, distribuição por `categoria`, alimentos com macros zerados ou absurdos.
  - `base_conhecimento`: existe? quantas linhas? quais fontes?
- [ ] Rodar `get_advisors` (segurança e performance): RLS faltando, índices, funções sem `search_path`.
- [ ] Ver se a edge function `gerar-plano` está publicada, e qual versão.

### 2.2 Consolidação
- [ ] Gerar uma migration que reflita o que existe no banco e não está versionado (`base_conhecimento`, `vector`, índices).
- [ ] Corrigir a migration 028: `buscar_alimentos_rag` declara `id uuid`, mas a coluna é `bigint` desde a migration 021.
- [ ] Decidir se as 19 migrations de "compatibilidade" (009–019) viram uma *baseline* única. Recomendo a baseline: menos risco, mais legível.
- [ ] **Curadoria da `base_exercicios`**: flag `is_curado`, remover os olímpicos, alongamentos e itens mal classificados (achados do benchmark) e completar as opções para treino em casa (isquiotibiais, panturrilha).
- [ ] Gerar os tipos TypeScript do banco (`generate_typescript_types`) em `tipos/database.ts`.

**Critério de pronto:** schema do banco = migrations locais, tipos gerados, relatório de dados salvo em `docs/estado-banco.md`.

> ⚠️ Toda alteração de escrita no banco (DDL e UPDATE) será mostrada antes para sua aprovação, com um snapshot do schema salvo antes de aplicar.

---

## Fase 3 — Arquitetura de IA e escolha da LLM ✅ decidida

**Decisão do usuário:** a LLM roda **localmente** (Ollama), para que os dados dos usuários não saiam da máquina.
Benchmark completo: `docs/avaliacoes/2026-10-03-benchmark-llm-local.md`.

### 3.1 Modelo escolhido: `llama3.2` (3B)
| Modelo | Assistido: treino | Assistido: dieta | Tempo |
|---|---|---|---|
| **`llama3.2` (3B)** ✅ | **95%** | **82%** | **11 s** |
| `phi4-mini` (3.8B) | 93% | 68% | 12 s |
| `qwen3.5:4b` | timeout (swap em 8 GB) | — | — |
| `gemma4:e4b` | não cabe em 8 GB | — | — |

Reavaliar se o hardware mudar. Com 16 GB ou mais, testar `gpt-oss-20b` e `qwen3.5:9b`; com 32 GB ou mais, testar `qwen3.6-27b`.

### 3.2 Arquitetura "assistida": a LLM escolhe, o código conta e calcula
Modelos de 3–4B **não conseguem** contar exercícios por grupo nem fazer a conta dos macros (no formato livre, erro de 20–380%). Por isso:

| Responsabilidade | Quem faz |
|---|---|
| TMB, TDEE, metas de macros, água | Código (determinístico) |
| Divisão semanal (quais dias, qual split) | Código (determinístico) |
| Quantos exercícios por grupo; séries, reps e descanso por objetivo/nível | Código + regras científicas (`knowledge/treino-knowledge.ts`) |
| **Escolher quais exercícios** em cada grupo | **LLM**, com schema de arrays por grupo e `enum` de IDs |
| **Escolher quais alimentos** em cada refeição | **LLM**, com slots `proteina` / `carboidrato` / `complemento`, cada um com o seu `enum` |
| Gramas de cada alimento | Código (mínimos quadrados com limites, por refeição) |
| Ordem (compostos primeiro), validação final | Código |
| Justificativa e dicas em texto para o usuário | LLM + trechos da `base_conhecimento` (RAG) |

### 3.3 Recuperação híbrida (RAG)
| O que recuperar | Como |
|---|---|
| Exercícios | **Filtro SQL**: grupo × equipamento × nível × categoria `forca` × `is_curado`; N por grupo |
| Alimentos | **Filtro SQL**: `is_curado`, restrições, agrupados por papel (proteína, carboidrato, complemento) |
| Diretrizes científicas | **Busca vetorial** em `base_conhecimento` (embeddings `mxbai-embed-large` locais) |

Com um modelo de 3B, despejar textos científicos longos no prompt rende pouco. As diretrizes viram **regras no código** (volume, faixas de reps, proteína por refeição), e os trechos recuperados servem para **justificar o plano** ao usuário, com a fonte.

### 3.4 Como o app alcança a LLM local
A edge function roda na nuvem do Supabase e não enxerga `localhost`. Opções:

| Opção | Como funciona | Prós | Contras |
|---|---|---|---|
| **A. Cloudflare Tunnel** ✅ recomendada | `cloudflared` expõe o Ollama do Mac numa URL HTTPS, protegida por um header secreto; a edge function chama essa URL | Gratuito; a arquitetura da edge function não muda; os dados só passam pelo seu Mac | O Mac precisa estar ligado e com o Ollama aberto para gerar planos |
| B. App → Ollama pela rede local | O celular chama `http://IP-do-Mac:11434` | Simples | Só funciona no mesmo Wi-Fi; a lógica fica no app; inviável em produção |
| C. Supabase local (Docker) | Tudo roda no Mac | Isolado | Docker + modelo não cabem bem em 8 GB |

- [x] **Decidido:** LLM local, `llama3.2`, arquitetura assistida.
- [ ] **Usuário decide:** forma de acesso (A recomendada).
- [ ] Ajustar o Ollama para servir: `OLLAMA_KEEP_ALIVE=30m`, `num_ctx` 4096, e fechar o simulador iOS ao gerar planos (memória).
- [ ] Remover os modelos baixados para o teste e não usados (`gemma4:e4b` 6,6 GB, `qwen3.5:4b` 3,4 GB), se o usuário aprovar.

**Critério de pronto:** a edge function chama o Ollama local pelo túnel e recebe um JSON válido em menos de 30 s.

---

## Fase 4 — Implementar o RAG na edge function

### 4.1 Base de conhecimento
- [ ] Definir o schema de `base_conhecimento`: `id`, `tipo` (treino/nutrição), `tema`, `titulo`, `fonte` (referência bibliográfica), `conteudo` (trecho de 100–300 palavras), `objetivos[]`, `niveis[]`, `embedding vector(768)`.
- [ ] Curar ~40–60 trechos a partir de fontes reconhecidas: posicionamentos do ACSM e ISSN (proteína, timing, creatina), Schoenfeld (volume e frequência), Morton 2018, Helms (recomposição) e orientações para iniciantes.
  - O Claude cura e revisa, citando a fonte de cada trecho. Antes do lançamento público, recomenda-se uma revisão por um profissional CREF/CRN.
- [ ] Script `scripts/ingestao_conhecimento.ts`: gera os embeddings com o `mxbai-embed-large` local e faz upsert.
- [ ] RPC `buscar_conhecimento_rag(query_embedding, objetivo, nivel, limite)` com filtro por metadados + similaridade.

### 4.2 Edge function `gerar-plano` (reescrita organizada)
```
supabase/functions/gerar-plano/
├── index.ts           # HTTP: auth → validação → orquestração
├── calculos.ts        # TMB/TDEE/macros (reaproveitar utilidades/calculos.ts)
├── divisao.ts         # escolha determinística da divisão por frequência
├── recuperacao.ts     # exercícios/alimentos (SQL) + conhecimento (vetor)
├── prompt.ts          # montagem do prompt
├── provedores/        # ollama.ts (via túnel), interface ProvedorLLM
├── schema.ts          # JSON Schema da resposta
├── enriquecimento.ts  # macros recalculados a partir da base (não da IA)
├── validador.ts       # regras de negócio
└── persistencia.ts    # gravação transacional (via RPC)
```
- [ ] **Autenticar antes de tudo.** Hoje a function chama a LLM e só depois verifica o usuário, então qualquer pessoa pode gastar sua cota.
- [ ] Validar a entrada com schema (faixas de idade, peso, altura, enums).
- [ ] Definir a divisão de treino de forma determinística, aproveitando a lógica do `iaLocalServico.ts` e corrigindo 6–7 dias, que hoje caem em 5.
- [ ] Usar IDs reais e compactos no prompt. A IA devolve só `{id, series, reps, descanso}` e `{id, gramas}`.
- [ ] Recalcular macros no servidor; ajustar porções automaticamente se o total sair de ±5% da meta.
- [ ] Validação com 1 retry, que inclui os erros encontrados; depois, fallback de provedor.
- [ ] Persistir de forma transacional numa RPC `salvar_plano_gerado(jsonb)`, para não deixar planos pela metade.
- [ ] Gravar o log em `planos_ia_gerados` com as respostas do questionário, o provedor, a latência e os IDs dos trechos de conhecimento usados.
- [ ] Rate limit por usuário (ex.: 5 gerações/dia).

### 4.3 Ligar o app
- [ ] `app/questionario/index.tsx` passa a chamar `supabase.functions.invoke('gerar-plano')`.
- [ ] Remover `EXPO_PUBLIC_GROQ_KEY` e aposentar o `iaLocalServico.ts`.
- [ ] Mostrar na tela de resultado as justificativas e as fontes científicas usadas.
- [ ] Deploy da function e das secrets (`OLLAMA_URL` do túnel, `OLLAMA_TUNNEL_SECRET`, `OLLAMA_MODEL`).

**Critério de pronto:** um usuário novo completa o questionário no celular e recebe um plano válido em menos de 20 s, com fontes exibidas.

---

## Fase 5 — Testes das funcionalidades

### 5.1 Testes automatizados
- [ ] Unitários (Deno test) para cálculos, divisão, enriquecimento e validador.
- [ ] **Avaliação da qualidade dos planos**: 8–10 perfis-teste fixos.
  - Exemplos: iniciante em casa só com peso corporal; avançado em hipertrofia 6x; mulher 50+ em emagrecimento; vegano; sem lactose; 2x por semana; restrição física no joelho.
  - Para cada perfil, checar automaticamente: macros dentro de ±5%, todos os IDs válidos, restrições respeitadas, equipamento compatível, volume semanal por grupo dentro das diretrizes, nenhum grupo muscular repetido em dias seguidos.
  - Salvar os resultados para comparar versões (`docs/avaliacoes/`).
- [ ] Testes das RPCs e das políticas RLS em SQL.

### 5.2 Jornada manual (no celular)
- [ ] Cadastro → questionário → plano → aceite.
- [ ] Dashboard: água, próxima sessão, aderência.
- [ ] Treino ao vivo: registrar séries, timer, conclusão, histórico.
- [ ] Dieta: planejado vs registrado, busca de alimentos, edição.
- [ ] Perfil: recalcular o plano, logout e login.
- [ ] Casos de borda: sem internet, cota da LLM estourada, questionário incompleto.

**Critério de pronto:** todos os perfis-teste passam nas checagens; a jornada manual não tem bloqueios.

---

## Fase 6 — Auditoria de segurança

- [ ] **RLS:** toda tabela de usuário com RLS ativa e testada. O usuário A não lê nem escreve dados do usuário B; testar com 2 contas reais.
- [ ] **Tabelas base:** `base_*` só de leitura para `authenticated`; escrita apenas via `service_role`.
- [ ] **Funções SQL:** `SECURITY INVOKER` ou `search_path` fixo; RPCs de RAG sem exposição indevida.
- [ ] **Advisors do Supabase** sem alertas críticos.
- [ ] **Edge function:** JWT obrigatório, CORS restrito, validação de entrada, rate limit, erros sem vazar detalhes internos.
- [ ] **Prompt injection:** campos livres (nome, restrições) são limpos e delimitados no prompt; a saída é validada contra a base (IDs).
- [ ] **Segredos:** nenhuma chave no bundle do app (busca por `EXPO_PUBLIC_` e strings de chave); varredura do histórico git com `gitleaks`.
- [ ] **Dependências:** `npm audit`, atualizar o que for crítico.
- [ ] **Privacidade/LGPD:** confirmar que o prompt não leva nome, e-mail nem ID; túnel protegido por segredo e sem logs de conteúdo; tela de consentimento para dados de saúde; política de privacidade; exclusão de conta e dados.
- [ ] **Saúde e responsabilidade:** aviso no app de que o plano não substitui um profissional; travas para perfis de risco (menores de idade, IMC extremo, déficit calórico abaixo de um piso seguro).

**Critério de pronto:** relatório `docs/auditoria-seguranca-2026-10.md` sem itens críticos em aberto.

---

## Fase 7 — Documentação e fechamento

- [ ] Atualizar o `README.md`: arquitetura atual, setup, variáveis de ambiente, deploy da function.
- [ ] Reescrever `docs/arquitetura-planejamento-ia.md` com o fluxo final (diagrama).
- [ ] Criar `CLAUDE.md` com as convenções do projeto (nomes em português, estrutura, comandos).
- [ ] Commit, PR e merge em `main`.

---

## Decisões tomadas (03/10/2026)

1. **LLM local (Ollama) com `llama3.2` (3B)**, por decisão do usuário: os dados não saem da máquina.
   - Escolhido por benchmark real (ver Fase 3).
   - Arquitetura "assistida": a LLM só escolhe exercícios e alimentos dentro de schemas restritos; o código faz contagem, ordem, séries e gramas.
   - Acesso via Cloudflare Tunnel (recomendado; aguarda confirmação).
   - **Minimização:** o prompt não leva nome, e-mail nem ID do usuário, como boa prática mesmo rodando local.
   - **LGPD:** peso e restrições de saúde são dados sensíveis. Antes do lançamento: tela de consentimento + política de privacidade.
   - *Histórico:* Groq e Gemini foram avaliados e descartados (o Gemini gratuito treina com os dados; a Groq foi preterida pela preferência por rodar local).
2. **Migrations consolidadas** numa baseline.
3. **Sem branch do Supabase** (recurso pago). Antes de cada escrita: snapshot do schema e SQL aprovado pelo usuário.
4. **O Claude cura e revisa a `base_conhecimento`**, só com fontes oficiais/consolidadas (ACSM, ISSN, meta-análises) e a citação em cada trecho. Antes do lançamento público, recomenda-se uma revisão por um profissional CREF/CRN.
