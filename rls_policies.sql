-- Habilitar RLS em todas as tabelas (esquema public)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plan_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plan_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (para SELECT, INSERT, UPDATE, DELETE) isolando por auth.uid() = user_id
CREATE POLICY "user_profiles_policy" ON user_profiles FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "diet_plans_policy" ON diet_plans FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "diet_plan_meals_policy" ON diet_plan_meals FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "workout_plans_policy" ON workout_plans FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "workout_plan_exercises_policy" ON workout_plan_exercises FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "daily_tasks_policy" ON daily_tasks FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "chat_conversations_policy" ON chat_conversations FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "chat_messages_policy" ON chat_messages FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "subscriptions_policy" ON subscriptions FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "plan_customizations_policy" ON plan_customizations FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "calendar_events_policy" ON calendar_events FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- Função e Trigger de auto_create_subscription (quando um usuário é registrado na tabela auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert a profile
  INSERT INTO public.user_profiles (id, user_id, email, "updatedAt")
  VALUES (new.id::text, new.id::text, new.email, now());

  -- Insert a default free subscription
  INSERT INTO public.subscriptions (id, user_id, plan_type, status, "updatedAt")
  VALUES (gen_random_uuid()::text, new.id::text, 'free', 'active', now());
  
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
