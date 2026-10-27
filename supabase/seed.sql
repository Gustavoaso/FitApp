-- ============================================================
-- SEED DOS TESTES (só banco local, só dados fictícios)
-- ============================================================
-- Roda no `npx supabase db reset` depois de supabase/seed/*.sql
-- (ordem em [db.seed] sql_paths do config.toml).
--   Conta A: conta-a@exemplo.com, com plano aceito e registros.
--   Conta B: conta-b@exemplo.com, nova (cai no questionário).
--   Senha das duas: senha-teste-123
-- ============================================================

-- ── Bases ──────────────────────────────────────────────────
-- Perfil vegano: proteína vegetal além das leguminosas.
-- Tofu: TACO (4ª ed.). PTS seca: USDA FDC 174275 (soy protein, textured).
insert into base_alimentos (nome, categoria, calorias_100g, proteinas_100g, carboidratos_100g, gorduras_100g, fibras_100g, porcao_descricao, porcao_gramas) values
('Tofu', 'leguminosas', 64.0, 6.6, 2.1, 4.0, 0.8, '1 fatia grossa', 100.0),
('Proteína Texturizada de Soja (seca)', 'leguminosas', 333.0, 51.5, 30.4, 1.2, 17.5, '3 colheres de sopa', 30.0);

-- Mesmo critério da migration de curadoria: os do seed (sem id_externo) são curados.
update base_exercicios set is_curado = true where id_externo is null;
-- PREMISSA: no banco local, os alimentos do seed (TACO) contam como curados.
update base_alimentos set is_curado = true;

-- ── Contas fictícias ───────────────────────────────────────
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
       extensions.crypt('senha-teste-123', extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', jsonb_build_object('nome', nome),
       now(), now(), '', '', '', ''
from (values
  ('aaaaaaaa-0000-4000-8000-00000000000a'::uuid, 'conta-a@exemplo.com', 'Ana Teste'),
  ('bbbbbbbb-0000-4000-8000-00000000000b'::uuid, 'conta-b@exemplo.com', 'Bruno Teste')
) as contas(id, email, nome);

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email',
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true), now(), now(), now()
from auth.users where email in ('conta-a@exemplo.com', 'conta-b@exemplo.com');

-- ── Conta A: perfil, consentimento e plano aceito ──────────
insert into perfis (usuario_id, nome, idade, sexo, peso_kg, altura_cm, nivel_experiencia, nivel_atividade,
                    objetivo, frequencia_semanal, consentimento_saude_em)
values ('aaaaaaaa-0000-4000-8000-00000000000a', 'Ana Teste', 30, 'feminino', 65.0, 165.0,
        'iniciante', 'moderado', 'hipertrofia', 3, now() - interval '7 days');

-- O plano passa pela mesma função que o app chama ao aceitar, como a conta A.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-00000000000a","role":"authenticated"}', true);

with ex as (select nome, id from base_exercicios),
     al as (select nome, id from base_alimentos),
     exercicio(nome, series, reps) as (values
       ('Supino Reto com Barra', 3, '8-12'), ('Puxada Frontal no Pulley', 3, '8-12'),
       ('Desenvolvimento com Halteres', 3, '10-12'), ('Agachamento Livre com Barra', 3, '8-12'),
       ('Leg Press 45°', 3, '10-12'), ('Prancha Abdominal', 3, '30s')),
     alimento(refeicao, nome, gramas) as (values
       ('Café da manhã', 'Aveia em Flocos', 40), ('Café da manhã', 'Banana Prata', 90),
       ('Café da manhã', 'Ovo de Galinha Cozido', 100),
       ('Almoço', 'Arroz Branco Cozido', 150), ('Almoço', 'Feijão Carioca Cozido', 100),
       ('Almoço', 'Peito de Frango Grelhado', 120), ('Almoço', 'Brócolis Cozido', 80),
       ('Jantar', 'Batata Doce Cozida', 150), ('Jantar', 'Filé de Tilápia Grelhado', 120)),
     itens_treino as (
       select jsonb_agg(jsonb_build_object('exercicioId', ex.id, 'nome', e.nome, 'series', e.series,
                                           'repeticoes', e.reps, 'descansoSegundos', 60)) as lista
       from exercicio e join ex using (nome)),
     refeicoes as (
       select r.refeicao, r.horario, jsonb_agg(jsonb_build_object(
                'alimentoId', al.id::text, 'nome', a.nome, 'porcao', a.gramas || 'g',
                'calorias', round(b.calorias_100g * a.gramas / 100, 1),
                'proteinas', round(b.proteinas_100g * a.gramas / 100, 1),
                'carboidratos', round(b.carboidratos_100g * a.gramas / 100, 1),
                'gorduras', round(b.gorduras_100g * a.gramas / 100, 1))) as alimentos
       from (values ('Café da manhã', '07:00', 1), ('Almoço', '12:30', 2), ('Jantar', '19:30', 3))
              as r(refeicao, horario, ordem)
       join alimento a on a.refeicao = r.refeicao
       join al on al.nome = a.nome
       join base_alimentos b on b.id = al.id
       group by r.refeicao, r.horario, r.ordem
       order by r.ordem)
select public.salvar_plano_gerado(jsonb_build_object(
  'modelo', 'seed',
  'respostas', '{}'::jsonb,
  'plano', jsonb_build_object(
    'resumo', jsonb_build_object('tmb', 1400, 'tdee', 2170, 'caloriasAlvo', 2400,
      'macros', jsonb_build_object('proteinas', 130, 'carboidratos', 300, 'gorduras', 75), 'metaAguaMl', 2300),
    'treino', jsonb_build_object('nomeDivisao', 'Full Body', 'dias', (
      select jsonb_agg(jsonb_build_object('diaSemana', d, 'nome', 'Full Body', 'tipo', 'treino', 'exercicios', lista))
      from itens_treino, unnest(array[1, 3, 5]) as d)),
    'dieta', jsonb_build_object('refeicoes', (
      select jsonb_agg(jsonb_build_object('nome', refeicao, 'horario', horario, 'alimentos', alimentos))
      from refeicoes)),
    'comentarios', jsonb_build_array('Plano de teste do seed.'))));

select set_config('request.jwt.claims', '', true);

-- ── Conta A: registros dos últimos dias ────────────────────
insert into historico_peso (usuario_id, peso_kg, data) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', 65.8, current_date - 14),
  ('aaaaaaaa-0000-4000-8000-00000000000a', 65.4, current_date - 7),
  ('aaaaaaaa-0000-4000-8000-00000000000a', 65.0, current_date);

insert into registros_agua (usuario_id, data, total_ml, meta_ml) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', current_date - 1, 2000, 2300),
  ('aaaaaaaa-0000-4000-8000-00000000000a', current_date, 750, 2300);

insert into refeicoes_registradas (usuario_id, data, tipo, alimentos, total_calorias, total_proteinas, total_carboidratos, total_gorduras) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', current_date, 'cafe_da_manha',
   '[{"nome":"Aveia em Flocos","gramas":40},{"nome":"Banana Prata","gramas":90}]', 245.8, 6.7, 50.0, 3.5);

-- Um treino feito ontem, no primeiro dia do plano ativo.
with plano as (
  select p.id as plano_id, d.id as dia_id
  from planos_treino p join dias_treino d on d.plano_treino_id = p.id
  where p.usuario_id = 'aaaaaaaa-0000-4000-8000-00000000000a' and p.ativo
  order by d.dia_semana limit 1)
insert into sessoes_treino (usuario_id, plano_treino_id, dia_treino_id, data, iniciado_em, finalizado_em)
select 'aaaaaaaa-0000-4000-8000-00000000000a', plano_id, dia_id, current_date - 1,
       now() - interval '1 day', now() - interval '1 day' + interval '50 minutes'
from plano;

insert into historico_series_executadas (usuario_id, exercicio_id, nome_exercicio, numero_serie, carga_kg, repeticoes, executado_em)
select 'aaaaaaaa-0000-4000-8000-00000000000a', id::text, nome, s, 30.0, 10, now() - interval '1 day'
from base_exercicios, generate_series(1, 3) as s
where nome = 'Supino Reto com Barra';
