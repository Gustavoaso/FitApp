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

`cadastro → consentimento → questionário → geração (Groq pela Edge Function) → resultado → aceite → abas`

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
- **RN06 (revista em 2026-11-15, decisão do dono):** a LLM roda na **nuvem, sem custo**: Groq (plano gratuito, `llama-3.3-70b-versatile`), chamada só pela Edge Function `gerar-plano` (chave `GROQ_API_KEY` em secret do Supabase, nunca no app). O app não depende mais do Mac ligado. O prompt continua sem nome, e-mail ou ID (RN12); idade, peso, objetivo e lesões vão para a Groq. A function exige usuário autenticado e aplica o limite da RN13.
- **RN07:** a LLM só **escolhe IDs** (exercícios por grupo, alimentos por slot proteína/carboidrato/complemento) dentro de um JSON Schema com `enum`. Contagem, ordem (compostos primeiro), séries, reps, descanso, divisão semanal e gramas são feitos por código.
- **RN08:** a divisão semanal é determinística pela frequência de 2 a 7 dias. 6 e 7 dias não podem cair em 5 (bug atual).
- **RN09:** as gramas são calculadas por mínimos quadrados com limites, por refeição. O total do dia fica dentro de **±5%** das calorias e de cada macro da meta.
- **RN10:** a saída é validada (IDs existem na base, restrições e equipamento respeitados, nenhum grupo muscular em dias seguidos). Se falhar, há **1 retry** com os erros. Se falhar de novo, aparece a mensagem de erro e nada é salvo.
- **RN11:** o plano é salvo de forma **transacional** pela RPC `salvar_plano_gerado(jsonb)`. Nunca fica plano pela metade.
- **RN12:** o prompt **nunca** leva nome, e-mail nem ID do usuário.
- **RN13:** limite de **5 gerações por usuário por dia** (fuso `America/Sao_Paulo`), contado em `planos_ia_gerados` e checado na RPC.
- **RN14 (revista em 2026-10-30):** exercícios e alimentos vêm por **RAG híbrido**: busca vetorial (`mxbai-embed-large`, embeddings já gravados em `base_exercicios` e `base_alimentos`) ordena os candidatos pelo objetivo e nível, e filtros SQL tiram o que não pode entrar (equipamento que a pessoa não tem, restrição alimentar, macros inválidos). `is_curado` continua obrigatório para exercícios e deixa de ser para alimentos (substituído por `e_basico`, RN17). Diretrizes continuam por busca vetorial em `base_conhecimento`. **Atualização 2026-11-15:** os embeddings passam a ser `gte-small` (384 dimensões), gerados dentro do Supabase pela IA embutida das Edge Functions (`Supabase.ai.Session('gte-small')`), sem chave nem custo; as bases são reprocessadas uma vez.
- **RN15:** a `base_conhecimento` tem de 40 a 60 trechos curados (de 100 a 300 palavras cada), sempre com a fonte (ACSM, ISSN, Schoenfeld, Morton 2018, Helms). Eles aparecem na tela de resultado como justificativa.
- **RN16 (segurança de saúde):** não gera plano para menores de 18 anos nem para IMC < 16 ou > 45. As calorias-alvo nunca ficam abaixo de **1.200 kcal (mulher) / 1.500 kcal (homem)**. Nesses casos, mostra uma mensagem recomendando um profissional. `PREMISSA` revisável.
- **RN17 (só o básico, 2026-11-03):** o plano usa apenas **alimentos básicos** e **exercícios básicos**.
  - *Alimentos:* só entram na geração as linhas com `e_basico = true`, todas da **TACO 4ª ed. (NEPA/Unicamp, 2011)**: alimentos in natura ou de preparo simples (cozido, grelhado, assado; fruta crua), sem industrializado, marca, suplemento, diet/light, frito, embutido nem vísceras. Cada básico tem porção típica (`porcao_descricao`, `porcao_gramas`). Os gramas do plano ficam dentro de limites por slot: proteína 50–500 g, carboidrato 30–500 g, complemento (gordura concentrada) 5–40 g por refeição. `PREMISSA` revisável.
  - *Open Food Facts removido (2026-11-03):* os 23.413 itens saíram da `base_alimentos` (backup local em `FitApp-backups/2026-11-03/`). A TBCA (USP) não tem download em massa e a licença é CC BY-NC-ND 4.0: só entra com autorização do FoRC/USP.
  - *Alimentos do usuário:* a pessoa cadastra o próprio alimento (nome, macros por 100 g, porção). Fica em `base_alimentos` com `fonte = 'usuario'` e `criado_por`; só o dono vê, altera e apaga (RLS). Nunca entra no plano (`e_basico = false`); o dono do app pode promover uma linha à base oficial depois de revisar. Limites: nome de 2 a 80 caracteres, até 900 kcal e no máximo 100 g de macros por 100 g.
  - *Exercícios:* `is_curado` vale só para exercícios que existem na maioria das academias (barra, halteres, polia, máquinas guiadas, Smith e peso do corpo), sem equipamento de nicho (kettlebell, bola, faixa, landmine, correntes, strongman).
  - *Fonte de dados:* a TACO é a fonte principal (Open Food Facts saiu da base). A TacoAPI (RapidAPI) não é usada: o dado vem dos CSVs em `scripts/dados/taco/`, conferidos contra o `.xls` original da Unicamp, e entram por migration (`scripts/gerar-migration-basicos.js`).
- **RN18 (questionário em 10 passos, 2026-11-10):** uma pergunta por tela. O nível (iniciante, intermediário, avançado) nunca é perguntado: sai do tempo de treino sem pausa maior que 1 mês. "Nunca treinei" e "Menos de 6 meses" = iniciante; "6 meses a 2 anos" = intermediário; "Mais de 2 anos" = avançado (`PREMISSA` revisável). Limites: idade 14–100, altura 100–250 cm, peso 30–300 kg, dias 2–7, refeições 3–6. Tempo por sessão não é perguntado (padrão 1h) até a "Parte B". Só entram como opção as restrições que o motor sabe respeitar (sem lactose, sem glúten, vegetariano, vegano; joelho, ombro, coluna): alergias não aparecem para não prometer o que o plano não cumpre.

Datas: fuso `America/Sao_Paulo`.

### Regras acrescentadas em 2026-11-14 (pedido do dono; decisões tomadas pelo maestro com autonomia total)

- **RN19 (plano com cara de profissional):** a LLM continua só escolhendo IDs (RN07). Todo o resto é código, a partir das respostas do usuário:
  - treino: ordem compostos → acessórios → isolados; séries, faixa de repetições, descanso e esforço alvo (repetições na reserva) por objetivo **e** nível; aquecimento por dia; progressão de 4 semanas (dupla progressão: sobe repetição até o teto da faixa, depois carga; semana 4 mais leve para iniciante); nome de cada dia pelo foco ("Peito e tríceps"), nunca "Treino A" sozinho;
  - dieta: refeições nomeadas pelo horário e pela rotina (pré e pós-treino conforme os dias de treino), porções em medidas caseiras ao lado das gramas quando a base tiver, e 1 substituição equivalente por alimento;
  - texto "Por que este plano": 3 a 5 frases montadas por código citando as respostas da pessoa (objetivo, dias, local, lesões, restrições) e a fonte da diretriz. Proibido texto igual para perfis diferentes; teste garante que dois perfis distintos geram textos distintos.
- **RN20 (gasto calórico do treino):** `kcal = MET × peso(kg) × horas ativas`, com MET do Compendium of Physical Activities 2024: 3,5 (musculação geral, 8 a 15 repetições), 5,0 (predomínio de agachamento/terra/compostos pesados), 6,0 (esforço vigoroso), 3,0 (peso do corpo). O MET da sessão é escolhido pela densidade: volume (carga × repetições) por minuto relativo ao peso corporal e proporção de exercícios compostos. Mostra sempre "estimativa" e nunca soma às calorias da dieta automaticamente. Sem peso no perfil, não calcula.
- **RN21 (foto do treino):** ao concluir o treino, a pessoa pode tirar ou escolher uma foto; o app aplica por cima um selo com a marca TreinaAI e os números da sessão (nome do treino, duração, volume total, kcal estimadas, sequência) e abre a folha de compartilhamento do iOS. A foto fica só no aparelho; nada é enviado ao servidor. Sem permissão de câmera, oferece a galeria e o cartão sem foto (fundo da marca).
- **RN22 (gamificação):** pontos (XP) por ação concluída: treino concluído 100; meta de água do dia 20; todas as refeições do dia registradas 40; peso registrado na semana 20; bônus de sequência semanal (cumpriu os dias planejados) 150. Níveis por XP acumulado (curva crescente, 10 níveis nomeados). Sequência conta **semanas** cumpridas (não dias), para não punir descanso. Conquistas (medalhas) por marcos: primeiro treino, 10/50/100 treinos, 4/12 semanas seguidas, recorde de carga. XP é derivado de registros reais (não se edita à mão) e é calculado no banco por função, nunca enviado pelo app.
- **RN23 (grupos, inspirado no GymRats):** qualquer usuário cria um grupo (nome, duração opcional em semanas, modo de pontuação: treinos, minutos ou XP) e convida por **código de 6 caracteres**. Limite de 30 membros e 5 grupos por pessoa. Cada treino concluído vira um **check-in** automático nos grupos da pessoa (pode desligar por grupo). Ranking por período do grupo. Membros veem dos outros apenas: apelido, check-ins (nome do treino, duração, kcal, pontos) e posição. **Nunca** peso, medidas, dieta, e-mail. Sair do grupo apaga os check-ins da pessoa naquele grupo; o criador pode remover membros e encerrar o grupo. Sem foto no servidor e sem chat nesta versão.
- **RN24 (apelido):** para aparecer em grupos a pessoa escolhe um apelido (3 a 20 caracteres, sem e-mail). É o único dado pessoal visível a outros usuários.
- **RN25 (movimento):** animações com mola no padrão Apple (interrompíveis, sem quique por padrão; quique leve só em conquista), durações curtas, haptics nos momentos de confirmação e respeito a Reduzir Movimento em tudo.

### Regras acrescentadas em 2026-11-16 (pedido do dono)

- **RN22 revogada (2026-11-16):** sem gamificação. Saem XP, níveis, conquistas e a sequência semanal (card do Início, selo da foto e tela de resultado). As tabelas/funções de XP saem por migration; os dados de treino continuam.
- **RN26 (aba Treino):** mostra só as pastas dos treinos do plano (grade) e o acesso ao histórico. Saem o card do treino do dia com o botão "Trocar" e a lista "Exercícios do dia". Os exercícios aparecem ao tocar na pasta (tela de detalhe, de onde se inicia o treino).
- **RN27 (histórico de treinos):** lista das sessões concluídas, da mais nova para a mais antiga, agrupada por mês. Cada sessão: nome, data, duração, séries feitas, volume (carga × repetições) e kcal estimadas (RN20). Detalhe da sessão: cada exercício com as séries (carga e repetições). Resumo no topo com semana e mês: treinos, minutos, volume e kcal. Evolução por exercício: maior carga por sessão em gráfico de linha.
- **RN28 (aderência semanal real):** semana de segunda a domingo (`America/Sao_Paulo`). Treinos = dias com sessão concluída ÷ dias de treino do plano. Exercícios = exercícios concluídos nas sessões da semana ÷ soma dos exercícios de todos os dias de treino do plano na semana. Dieta = refeições registradas ÷ (refeições do plano × 7). Tudo vem do banco, nunca de número fixo; teste cobre um plano de 5 dias com 7 exercícios por dia (35 na semana).
- **RN23 revista (grupos, referência GymRats):**
  - grupo = desafio: nome, descrição (até 280), **banner** (foto enviada ou uma de 8 capas da marca), data de início e de fim (opcional = contínuo), código de convite de 6 caracteres e link para compartilhar. Até 50 membros e 10 grupos por pessoa;
  - **pontuação só por check-in:** 1 ponto por dia com check-in válido, no máximo 1 por dia por pessoa;
  - **check-in válido:** automático quando a pessoa conclui um treino no app naquele dia (pode desligar por grupo), ou **manual** (tipo de atividade de uma lista: musculação, corrida, caminhada, bike, natação, esporte, outro; duração; descrição opcional; **foto opcional**). Check-in manual só para hoje ou ontem;
  - **feed do grupo:** check-ins com foto, curtidas e comentários (até 280), em ordem cronológica;
  - **ranking** do período (pontos, desempate por quem chegou primeiro), pódio dos 3 primeiros; aba de membros;
  - o criador edita o grupo, remove membros e encerra; sair do grupo apaga os check-ins da pessoa nele;
  - membros veem dos outros só o perfil público (RN24), check-ins e posição. **Nunca** peso, medidas, dieta nem e-mail.
- **RN29 (fotos de evolução):** a pessoa escolhe a frequência (semanal ou mensal) e registra fotos (frente, lado, costas; pelo menos 1) com data e peso opcional. **Privada por padrão.** Em cada registro ela escolhe: "só eu" ou os grupos (dos dela) que podem ver. Pode mudar ou apagar depois. Comparação lado a lado de duas datas. O peso só aparece para outros se ela marcar. Lembrete no app no dia combinado (sem push nesta versão).
- **RN24 revista (perfil público):** apelido (3 a 20), **@usuario** único (3 a 15, letras minúsculas, números e `_`), foto de avatar opcional e bio até 160. É o que outros usuários veem em grupos e na Comunidade.
- **RN30 (Comunidade, estilo Twitter):**
  - post de 1 a 280 caracteres com até 1 foto; apagar o próprio post (sem editar);
  - curtir, **responder** (a resposta é um post ligado ao pai, em sequência), **repostar** e **repostar com comentário**;
  - seguir e deixar de seguir; contadores de seguidores, seguindo e posts no perfil público;
  - feed com duas abas: **Seguindo** (cronológico, de quem sigo e meus) e **Para você** (posts das últimas 72 h de todos, ordenados por curtidas + respostas + reposts, com penalidade por idade);
  - **moderação (exigência da App Store):** denunciar post ou usuário (motivo de uma lista), **bloquear** (some dos dois lados: feed, respostas, perfil, grupos não), filtro de palavras ofensivas no envio; post com 3 denúncias de pessoas diferentes fica oculto até o dono do app revisar; termos de uso aceitos antes do primeiro post;
  - limites: 30 posts e 300 curtidas por dia por pessoa;
  - sem mensagem direta, sem perfil privado e sem notificações push nesta versão (contador de novidades dentro do app).
- **RN31 (fotos no servidor):** fotos de check-in, de post, de avatar, de banner e de evolução vão para o Supabase Storage em buckets privados, lidas por URL assinada, redimensionadas no app para até 1080 px e JPEG ~0,7 antes do envio, até 5 MB. As políticas do Storage seguem a mesma regra de quem pode ver o registro. Excluir a conta apaga todas as fotos da pessoa. Foto de evolução é dado sensível (LGPD).
- **RN32 (navegação):** abas **Início, Treino, Dieta, Grupos, Comunidade**. O Perfil abre pelo avatar no canto superior direito das telas das abas.
- **RN33 (visual mais suave):** títulos em peso semibold (nada de heavy/black), corpo regular, tamanhos uma escala abaixo do atual, ícones finos (peso light/regular), contornos de 1 px, menos texto em maiúsculas, mais respiro. Detalhes em `VISUAL.md`.

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

- **Erros e sucesso:** premissas revisáveis, em português, curtas e sem jargão técnico. Erro na geração (etapa 28): sem rede ("Sem conexão com a internet..."), serviço ocupado, serviço fora do ar, sessão expirada e limite diário, cada um com o seu texto em `gerar-plano-servico.ts`.
- **Notificações:** fora desta versão.

## 9. Dados

- **Guardados:** perfil (idade, sexo, peso, altura, objetivo, frequência, restrições), planos, sessões de treino, registros de dieta e água.
- **Pessoais/saúde:** peso, medidas e restrições de saúde são **dado sensível (LGPD)**. Exigem o consentimento explícito (seção 4) e a exclusão completa.
- **Arquivos e fotos:** no Supabase Storage, buckets privados (RN31).
- **Dados iniciais:** `base_exercicios` (ExerciseDB, já importada) e `base_alimentos` (TACO 4ª ed. e os alimentos cadastrados pelos usuários, RN17), ambas já no banco. A `base_conhecimento` é curada pelo Claude com fontes. Só dados fictícios no repositório e no seed.

## 10. Integrações

| Integração | Nesta versão |
|---|---|
| Groq (`llama-3.3-70b-versatile`) e `gte-small` do Supabase | pela Edge Function `gerar-plano` (chave só no secret; sem chave no ambiente de desenvolvimento, só testado com simulação) |
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
