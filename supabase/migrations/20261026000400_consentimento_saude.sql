-- Etapa 11: aceite do uso de dados de saúde (LGPD, PROJETO.md seção 4).
-- Nulo = não aceitou; o questionário só começa com a data preenchida.
-- A exclusão de conta não precisa de schema: toda tabela do usuário já
-- referencia auth.users com on delete cascade (baseline).
alter table public.perfis add column consentimento_saude_em timestamptz;
