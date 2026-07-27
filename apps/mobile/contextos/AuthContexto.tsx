// ============================================================
// CONTEXTO: Autenticação (AuthContexto)
// ============================================================
// Gerencia o estado global de autenticação do usuário no app.
// Integra diretamente com o Supabase Auth.
//
// CONCEITOS IMPORTANTES:
// - React Context: permite compartilhar dados (como o usuário logado)
//   com toda a árvore de componentes sem ter que passar props manualmente.
// - Supabase Auth: gerencia tokens JWT, login, cadastro e sessão.
// - onAuthStateChange: listener do Supabase que dispara sempre que
//   o estado de login muda (ex: usuário entra, sai ou renova token).
// ============================================================

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../servicos/supabase';

interface AuthContextoTipo {
  sessao: Session | null;
  usuario: User | null;
  carregando: boolean;
  entrarComEmail: (email: string, senha: string) => Promise<{ erro: string | null }>;
  cadastrarComEmail: (nome: string, email: string, senha: string) => Promise<{ erro: string | null }>;
  sair: () => Promise<void>;
}

const AuthContexto = createContext<AuthContextoTipo | undefined>(undefined);

export function AuthProvedor({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // 1. Busca a sessão salva no armazenamento local
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessao(session);
      setUsuario(session?.user ?? null);
      setCarregando(false);
    });

    // 2. Escuta mudanças na autenticação (login, logout, refresh token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessao(session);
      setUsuario(session?.user ?? null);
      setCarregando(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /** Realiza o login com e-mail e senha */
  const entrarComEmail = async (email: string, senha: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    return { erro: error ? error.message : null };
  };

  /** Cadastra um novo usuário */
  const cadastrarComEmail = async (nome: string, email: string, senha: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
      },
    });

    if (error) return { erro: error.message };

    // Cria o perfil inicial na tabela `perfis` se o cadastro deu certo
    if (data.user) {
      await supabase.from('perfis').insert({
        usuario_id: data.user.id,
        nome,
        idade: 25,          // Valores padrão (serão atualizados no questionário)
        sexo: 'masculino',
        peso_kg: 70,
        altura_cm: 175,
        nivel_experiencia: 'iniciante',
        nivel_atividade: 'moderado',
      });
    }

    return { erro: null };
  };

  /** Realiza o logout */
  const sair = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContexto.Provider
      value={{
        sessao,
        usuario,
        carregando,
        entrarComEmail,
        cadastrarComEmail,
        sair,
      }}
    >
      {children}
    </AuthContexto.Provider>
  );
}

/** Hook personalizado para consumir o AuthContexto */
export function useAuth() {
  const contexto = useContext(AuthContexto);
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvedor');
  }
  return contexto;
}
