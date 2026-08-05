# Relatório de Auditoria do FitApp

Data: 2026-07-31

## Resumo executivo

A falha exibida no login (`Network request failed`) ocorre antes de uma resposta do Supabase. O ambiente de execução não conseguiu resolver o DNS do projeto durante a verificação, portanto o problema é de conectividade/rede do simulador ou da máquina, não de senha inválida. O app agora apresenta uma mensagem orientativa e não expõe o erro bruto ao usuário.

Também foram corrigidos problemas de fluxo e persistência encontrados na revisão estática:

- O pós-login sempre enviava o usuário ao questionário, mesmo quando já possuía plano ativo.
- A geração da IA retornava antes de confirmar a persistência em `planos_ia_gerados`.
- A UI ainda tinha dois emojis como ícones.
- O schema remoto precisou de migrations de compatibilidade para instalações antigas do banco.

## Problemas e correções

| Categoria | Causa raiz | Correção | Status |
| --- | --- | --- | --- |
| Autenticação | Falha de rede/DNS antes da resposta do Supabase | Mensagem de erro de conectividade e validação de sessão mantida | Corrigido no código; rede depende do ambiente |
| Autenticação | Login usava `router.replace('/questionario')` sempre | Roteamento voltou para `/`, que decide entre questionário e dashboard | Corrigido |
| Persistência | Plano IA era salvo em modo fire-and-forget | Geração agora aguarda a gravação e propaga falhas | Corrigido |
| Persistência | Schema remoto legado tinha colunas ausentes | Migrations 009 a 012 adicionaram compatibilidade sem apagar dados | Aplicado no Supabase |
| UI/UX | Emojis em abas de APIs e ação de reformulação | Substituídos por SF Symbols ou texto puro | Corrigido |
| Dados | Fallbacks nativos existem para indisponibilidade de APIs | Mantidos como contingência offline; não devem ser tratados como base principal | Observação |

## Jornada validada por análise de código

| Jornada | Status | Observação |
| --- | --- | --- |
| Cadastro e login | Observação | O código está conectado ao Supabase; teste real depende de rede funcional no simulador |
| Usuário novo sem plano | Funcionando por fluxo | `/` consulta sessão e plano antes de direcionar |
| Usuário com plano ativo | Corrigido | Pós-login não força mais o questionário |
| Geração e validação IA | Funcionando por fluxo | IDs RAG, sete dias e quantidade de refeições são validados |
| Aceite e persistência do plano | Corrigido | Persistência agora é aguardada e falha de forma explícita |
| Exibição de treino e dieta | Funcionando por fluxo | Repositórios leem o planejamento persistido |
| Edição de dieta/favoritos/receitas | Implementado | Depende das tabelas e RLS aplicadas |
| Treino ao vivo | Não validado visualmente | Requer execução no simulador |
| TacoAPI e ExerciseDB | Implementado | Há cache, timeout e fallback; disponibilidade externa não foi simulada |
| Logout e sessão persistida | Funcionando por análise | `AsyncStorage` e listener do Supabase estão configurados |

## Validações executadas

- `npm run lint --workspace @fitapp/mobile`: passou.
- `npx tsc -p apps/mobile/tsconfig.json --noEmit`: passou.
- Migrations remotas sincronizadas até `012`.
- Nenhum reset, limpeza ou exclusão de dados foi executado durante esta auditoria.

## Próximo teste manual

1. Confirme que o iPhone Simulator possui internet e DNS funcionando.
2. Reinicie o bundle com `npx expo start -c`.
3. Execute login/cadastro, aceite um plano e verifique as abas Treino e Dieta.
4. Se o login continuar exibindo conectividade, teste a mesma rede no navegador do simulador; credenciais não corrigem um erro `Network request failed`.
