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
| 1. Fundação | Pendente | | |
| 2. Reorganizar por funcionalidade | Pendente | | |
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

## Pendências
