-- ============================================================
-- MIGRATION 004: POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================
-- RLS é o sistema de segurança do PostgreSQL/Supabase que
-- controla QUEM pode ver/editar QUAIS linhas de uma tabela.
--
-- CONCEITO IMPORTANTE:
-- Sem RLS, qualquer pessoa com a chave anon poderia ler
-- todos os dados de todos os usuários. Com RLS ativado,
-- cada query é automaticamente filtrada: o usuário só vê
-- seus próprios dados.
--
-- auth.uid() = função do Supabase que retorna o ID do
-- usuário atualmente logado. Se ninguém está logado,
-- retorna NULL e nenhuma linha é acessível.
--
-- USING: filtro para leitura (SELECT)
-- WITH CHECK: filtro para escrita (INSERT, UPDATE)
-- ============================================================

-- ────────────────────────────────────
-- Ativar RLS em TODAS as tabelas
-- ────────────────────────────────────

ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios_plano ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_alimentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_dieta ENABLE ROW LEVEL SECURITY;
ALTER TABLE refeicoes_plano ENABLE ROW LEVEL SECURITY;
ALTER TABLE alimentos_refeicao ENABLE ROW LEVEL SECURITY;
ALTER TABLE refeicoes_registradas ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_agua ENABLE ROW LEVEL SECURITY;

-- ────────────────────────────────────
-- PERFIS: usuário vê/edita só o seu
-- ────────────────────────────────────

CREATE POLICY "Usuarios podem ver seu perfil"
  ON perfis FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem inserir seu perfil"
  ON perfis FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar seu perfil"
  ON perfis FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- ────────────────────────────────────
-- QUESTIONÁRIOS: usuário vê/cria só os seus
-- ────────────────────────────────────

CREATE POLICY "Usuarios podem ver seus questionarios"
  ON questionarios FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem inserir questionarios"
  ON questionarios FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- ────────────────────────────────────
-- PLANOS DE TREINO: CRUD próprio
-- ────────────────────────────────────

CREATE POLICY "Usuarios podem ver seus planos de treino"
  ON planos_treino FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar planos de treino"
  ON planos_treino FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar seus planos"
  ON planos_treino FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar seus planos"
  ON planos_treino FOR DELETE
  USING (auth.uid() = usuario_id);

-- DIAS DE TREINO: acesso via plano do usuário
CREATE POLICY "Usuarios podem ver dias de seus planos"
  ON dias_treino FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM planos_treino
      WHERE planos_treino.id = dias_treino.plano_treino_id
      AND planos_treino.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios podem gerenciar dias de seus planos"
  ON dias_treino FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM planos_treino
      WHERE planos_treino.id = dias_treino.plano_treino_id
      AND planos_treino.usuario_id = auth.uid()
    )
  );

-- EXERCÍCIOS DO PLANO: acesso via dia → plano do usuário
CREATE POLICY "Usuarios podem ver exercicios de seus planos"
  ON exercicios_plano FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dias_treino
      JOIN planos_treino ON planos_treino.id = dias_treino.plano_treino_id
      WHERE dias_treino.id = exercicios_plano.dia_treino_id
      AND planos_treino.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios podem gerenciar exercicios de seus planos"
  ON exercicios_plano FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM dias_treino
      JOIN planos_treino ON planos_treino.id = dias_treino.plano_treino_id
      WHERE dias_treino.id = exercicios_plano.dia_treino_id
      AND planos_treino.usuario_id = auth.uid()
    )
  );

-- ────────────────────────────────────
-- SESSÕES DE TREINO: CRUD próprio
-- ────────────────────────────────────

CREATE POLICY "Usuarios podem ver suas sessoes"
  ON sessoes_treino FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem registrar sessoes"
  ON sessoes_treino FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar suas sessoes"
  ON sessoes_treino FOR UPDATE
  USING (auth.uid() = usuario_id);

-- ────────────────────────────────────
-- BASE DE EXERCÍCIOS E ALIMENTOS: leitura pública
-- ────────────────────────────────────
-- Todos os usuários logados podem ler a base de exercícios
-- e alimentos (são dados de referência, não pessoais).

CREATE POLICY "Usuarios logados podem ver exercicios"
  ON base_exercicios FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Usuarios logados podem ver alimentos"
  ON base_alimentos FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ────────────────────────────────────
-- PLANOS DE DIETA: CRUD próprio
-- ────────────────────────────────────

CREATE POLICY "Usuarios podem ver seus planos de dieta"
  ON planos_dieta FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem criar planos de dieta"
  ON planos_dieta FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar seus planos de dieta"
  ON planos_dieta FOR UPDATE
  USING (auth.uid() = usuario_id);

-- REFEIÇÕES DO PLANO: acesso via plano do usuário
CREATE POLICY "Usuarios podem ver refeicoes de seus planos"
  ON refeicoes_plano FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM planos_dieta
      WHERE planos_dieta.id = refeicoes_plano.plano_dieta_id
      AND planos_dieta.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios podem gerenciar refeicoes de seus planos"
  ON refeicoes_plano FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM planos_dieta
      WHERE planos_dieta.id = refeicoes_plano.plano_dieta_id
      AND planos_dieta.usuario_id = auth.uid()
    )
  );

-- ALIMENTOS DA REFEIÇÃO: acesso via refeição → plano
CREATE POLICY "Usuarios podem ver alimentos de suas refeicoes"
  ON alimentos_refeicao FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM refeicoes_plano
      JOIN planos_dieta ON planos_dieta.id = refeicoes_plano.plano_dieta_id
      WHERE refeicoes_plano.id = alimentos_refeicao.refeicao_plano_id
      AND planos_dieta.usuario_id = auth.uid()
    )
  );

CREATE POLICY "Usuarios podem gerenciar alimentos de suas refeicoes"
  ON alimentos_refeicao FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM refeicoes_plano
      JOIN planos_dieta ON planos_dieta.id = refeicoes_plano.plano_dieta_id
      WHERE refeicoes_plano.id = alimentos_refeicao.refeicao_plano_id
      AND planos_dieta.usuario_id = auth.uid()
    )
  );

-- ────────────────────────────────────
-- REFEIÇÕES REGISTRADAS E ÁGUA: CRUD próprio
-- ────────────────────────────────────

CREATE POLICY "Usuarios podem ver suas refeicoes registradas"
  ON refeicoes_registradas FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem registrar refeicoes"
  ON refeicoes_registradas FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar suas refeicoes"
  ON refeicoes_registradas FOR UPDATE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem deletar suas refeicoes"
  ON refeicoes_registradas FOR DELETE
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem ver seus registros de agua"
  ON registros_agua FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem registrar agua"
  ON registros_agua FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuarios podem atualizar registro de agua"
  ON registros_agua FOR UPDATE
  USING (auth.uid() = usuario_id);
