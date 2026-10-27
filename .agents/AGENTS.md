# Regras do Projeto FitApp

- **Mensagem de Commit Obrigatória**: Ao final de toda execução ou alteração de código realizada, gere sempre uma única mensagem de commit sucinta no padrão Conventional Commits com no máximo 5 linhas resumindo o conjunto de mudanças feitas.

## Ativação Contínua de Skills
As diretrizes abaixo devem ser aplicadas em TODAS as interações e tarefas de código deste projeto, de forma incondicional:
- **caveman**: Adote o estilo de comunicação conciso e sem enrolação da skill `caveman` o tempo todo (economia máxima de tokens).
- **fitapp-padroes**: Siga rigorosamente os padrões de código, nomenclatura e estrutura definidos na skill `fitapp-padroes` em qualquer arquivo modificado.
- **ponytail**: Mantenha a mentalidade minimalista de engenharia da skill `ponytail`. Escreva o mínimo de código possível e fuja de over-engineering.

## Fluxo novo-projeto

Documentação: [PROJETO.md](../docs/PROJETO.md) (regras), [VISUAL.md](../docs/VISUAL.md) (identidade), [PLANO.md](../docs/PLANO.md) (etapas), [ANDAMENTO.md](../docs/ANDAMENTO.md) (situação e decisões). Regra de negócio nova vai para o `PROJETO.md` antes do código.

| O quê | Comando |
|---|---|
| Rodar | `npx expo start` |
| Tipos | `npm run typecheck` (até a etapa 1: `npm run lint`, que roda `tsc --noEmit`) |
| Lint | `npm run lint` (ESLint, a partir da etapa 1) |
| Testes | `npm test` (Jest + jest-expo, sem rede e sem banco; a partir da etapa 1) |
| Banco local | `npx supabase start` / `npx supabase db reset` |

Regras que não podem ser quebradas:
- RLS ligada em toda tabela exposta; cada usuário só lê e altera o que é dele; `base_*` só leitura para `authenticated`.
- Nenhum segredo com prefixo `EXPO_PUBLIC_` (exceto URL/anon key do Supabase e a URL do Ollama local); `service_role` e chaves de terceiros nunca no app.
- O prompt da LLM nunca leva nome, e-mail nem ID do usuário.
- A LLM só escolhe IDs; contas, gramas e validação são código.
- Só dados fictícios no repositório, nos testes e no seed; testes nunca apontam para o Supabase de produção.
- Nada de escrita no banco remoto sem aprovação do dono.
