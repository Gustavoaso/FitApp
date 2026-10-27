# Projeto: FitApp

> Aprovado pelo dono em 2026-10-26 (validação 1 do `novo-projeto`). Toda regra nova entra aqui antes do código. O que veio do código está marcado `(levantado do código)`.
> Plano anterior: `docs/plano-de-acao-retomada.md` (03/10/2026). As decisões dele continuam valendo, salvo onde este arquivo diz diferente.

## 1. Problema e objetivo

- **Hoje:** montar treino e dieta coerentes com o objetivo exige conhecimento técnico. O app tem as telas prontas, mas a geração do plano oscilou entre 5 LLMs, tem RAG pela metade, não tem testes e tem chaves expostas.
- **Objetivo:** fechar a arquitetura de IA **local** e deixar o app redondo para uso pessoal: plano gerado com base científica, dados protegidos e testes automatizados.
- **Deu certo quando:** um usuário novo completa o questionário no iPhone (no mesmo Wi-Fi do Mac) e recebe em menos de 30 s um plano válido, com macros dentro de ±5% da meta e as fontes científicas exibidas. Todos os perfis-teste passam nas checagens automáticas.

## 2. Plataformas

iOS (Expo; Android não é foco) · Publicação na App Store: **depois**. Agora é uso pessoal via Expo/dev build.

## 3. Perfis e permissões

| Perfil | Vê | Cria | Altera | Apaga |
|---|---|---|---|---|
| Usuário | Os próprios perfil, planos, treinos, registros de dieta e histórico; as bases (`base_exercicios`, `base_alimentos`, `base_conhecimento`) | Os próprios registros | Os próprios registros | Os próprios registros e a conta |
| Sistema (`service_role`, scripts locais) | Tudo | Bases e ingestão | Bases | Bases |

Regra padrão de RLS: cada usuário só os próprios registros. As tabelas `base_*` são só de leitura para `authenticated`.

## 4. Login e conta

- Entrada: e-mail e senha (levantado do código) + **Sign in with Apple** (novo).
- Sessão: a padrão do Supabase (refresh automático, persistida no AsyncStorage) (levantado do código).
- **Exclusão de conta:** no Perfil, com confirmação. Apaga a conta e todos os dados do usuário (cascade), sem volta.
- **Consentimento de dados de saúde:** tela de aceite antes do questionário, com o aviso "o plano não substitui um profissional de educação física ou nutrição". Sem o aceite, o questionário não começa.

## 5. Fluxos e situações

`cadastro → consentimento → questionário → geração (Ollama na rede local) → resultado → aceite → abas`

| De | Para | Quem | Condição | Tem volta? |
|---|---|---|---|---|
| Sem sessão | Login/Cadastro | Usuário | — | — |
| Cadastro | Consentimento | Usuário | conta criada | não |
| Consentimento | Questionário | Usuário | aceitou | pode revogar = excluir conta |
| Questionário | Resultado | App | plano gerado e validado | sim (refazer) |
| Resultado | Abas | Usuário | aceitou o plano | sim (Perfil → recalcular) |
| Perfil | Excluir conta | Usuário | confirmou | não |

## 6. Regras de negócio

**Cálculos (levantado do código, `utilidades/calculos.ts`):**
- **RN01:** TMB por Mifflin-St Jeor: `10·peso + 6,25·altura − 5·idade` (+5 homem, −161 mulher).
- **RN02:** TDEE = TMB × fator (sedentário 1,2 · leve 1,375 · moderado 1,55 · ativo 1,725 · muito ativo 1,9).
- **RN03:** calorias-alvo = TDEE × ajuste (hipertrofia 1,10 · definição 0,85 · força 1,05 · emagrecimento 0,80 · condicionamento 1,0).
- **RN04:** macros (P/C/G) em % das calorias: hipertrofia e força 30/45/25 · definição e emagrecimento 35/35/30 · condicionamento 25/50/25.
- **RN05:** água = 35 ml × peso (kg).

**Geração do plano (do plano de retomada, arquitetura "assistida"):**
- **RN06:** a LLM é **local** (Ollama, `llama3.2` 3B) e o **app** a chama direto pela rede local (`EXPO_PUBLIC_OLLAMA_URL`, ex.: `http://192.168.x.x:11434`). Sem túnel e sem API de nuvem. A URL é configurável para trocar por um túnel depois.
- **RN07:** a LLM só **escolhe IDs** (exercícios por grupo, alimentos por slot proteína/carboidrato/complemento) dentro de um JSON Schema com `enum`. Contagem, ordem (compostos primeiro), séries, reps, descanso, divisão semanal e gramas são feitos por código.
- **RN08:** a divisão semanal é determinística pela frequência de 2 a 7 dias. 6 e 7 dias não podem cair em 5 (bug atual).
- **RN09:** as gramas são calculadas por mínimos quadrados com limites, por refeição. O total do dia fica dentro de **±5%** das calorias e de cada macro da meta.
- **RN10:** a saída é validada (IDs existem na base, restrições e equipamento respeitados, nenhum grupo muscular em dias seguidos). Se falhar, há **1 retry** com os erros. Se falhar de novo, aparece a mensagem de erro e nada é salvo.
- **RN11:** o plano é salvo de forma **transacional** pela RPC `salvar_plano_gerado(jsonb)`. Nunca fica plano pela metade.
- **RN12:** o prompt **nunca** leva nome, e-mail nem ID do usuário.
- **RN13:** limite de **5 gerações por usuário por dia** (fuso `America/Sao_Paulo`), contado em `planos_ia_gerados` e checado na RPC.
- **RN14:** exercícios e alimentos vêm por filtro SQL (`is_curado`, grupo, equipamento, nível, restrições). Diretrizes vêm por busca vetorial em `base_conhecimento` (embeddings `mxbai-embed-large` gerados no Ollama).
- **RN15:** a `base_conhecimento` tem de 40 a 60 trechos curados (de 100 a 300 palavras cada), sempre com a fonte (ACSM, ISSN, Schoenfeld, Morton 2018, Helms). Eles aparecem na tela de resultado como justificativa.
- **RN16 (segurança de saúde):** não gera plano para menores de 18 anos nem para IMC < 16 ou > 45. As calorias-alvo nunca ficam abaixo de **1.200 kcal (mulher) / 1.500 kcal (homem)**. Nesses casos, mostra uma mensagem recomendando um profissional. `PREMISSA` revisável.

Datas: fuso `America/Sao_Paulo`.

## 7. Telas e navegação (levantado do código)

| Tela | Onde | O que mostra |
|---|---|---|
| Login / Cadastro | pilha `(auth)` | e-mail e senha + Sign in with Apple |
| Consentimento | pilha (nova) | termos de dados de saúde e aviso |
| Questionário | pilha | dados físicos, objetivo, frequência, equipamento, restrições |
| Resultado | pilha | plano gerado, justificativas e fontes, aceite |
| Início | aba | água, próxima sessão, aderência |
| Treino | aba | plano de treino semanal |
| Treino ao vivo | pilha | registro de séries, timer, conclusão |
| Dieta | aba | planejado × registrado, busca de alimentos |
| Perfil | aba | dados, recalcular plano, logout, **excluir conta** |

Visual: skill `visual-design` + `docs/VISUAL.md`.

## 8. Textos

- **Erros e sucesso:** premissas revisáveis, em português, curtas e sem jargão técnico. Erro de rede/Ollama: "Não consegui falar com o gerador de planos. Confira se o Mac está ligado e na mesma rede."
- **Notificações:** fora desta versão.

## 9. Dados

- **Guardados:** perfil (idade, sexo, peso, altura, objetivo, frequência, restrições), planos, sessões de treino, registros de dieta e água.
- **Pessoais/saúde:** peso, medidas e restrições de saúde são **dado sensível (LGPD)**. Exigem o consentimento explícito (seção 4) e a exclusão completa.
- **Arquivos e fotos:** nenhum nesta versão.
- **Dados iniciais:** `base_exercicios` (ExerciseDB, já importada) e `base_alimentos` (TACO + OpenFoodFacts curado), ambas já no banco. A `base_conhecimento` é curada pelo Claude com fontes. Só dados fictícios no repositório e no seed.

## 10. Integrações

| Integração | Nesta versão |
|---|---|
| Ollama local (`llama3.2`, `mxbai-embed-large`) | real, pela rede local, a partir do app |
| Supabase (Auth, Postgres, RPCs) | real (projeto `asuxqjbwgetdcldjoaqm`); testes no banco local |
| Sign in with Apple | real (`expo-apple-authentication`) |
| ExerciseDB / TACO via RapidAPI | só nos scripts de sincronização. **A chave sai do app** (secret da function `sincronizar-bases` ou `.env` do script) |
| Groq (`EXPO_PUBLIC_GROQ_KEY`) | **removido** |
| HealthKit, push, pagamentos | fora |

## 11. Fora desta versão

- Publicação na App Store (EAS, ícones finais, política publicada), Android.
- Cloudflare Tunnel / uso fora da rede de casa.
- Itens futuros do `checklist_construcao.md`: fotos de progresso, push, chat com IA, offline/MMKV, gamificação, social, HealthKit, RevenueCat, CI/CD.

## 12. Premissas revisáveis

O desenvolvedor **pode** criar premissas (valor conservador, `PREMISSA:` no código, listado aqui), **exceto** em RLS, exclusão de dados e regras de saúde (RN16 já está fixada acima).

| # | Premissa | Onde | Revisar até |
|---|---|---|---|
| P1 | Pisos de RN16 (1.200/1.500 kcal, IMC 16–45) | validador do plano | antes da App Store |
| P2 | Textos de erro e de sucesso | telas | antes da App Store |
