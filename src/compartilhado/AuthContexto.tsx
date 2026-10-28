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
import { supabase } from '@/compartilhado/supabase';
import {
  definirUsuarioLocal,
  limparCacheLocalUsuario,
} from '@/compartilhado/servicos/armazenamento-usuario';

interface AuthContextoTipo {
  sessao: Session | null;
  usuario: User | null;
  carregando: boolean;
  entrarComEmail: (email: string, senha: string) => Promise<{ erro: string | null }>;
  cadastrarComEmail: (
    nome: string,
    email: string,
    senha: string,
  ) => Promise<{ erro: string | null }>;
  sair: () => Promise<void>;
}

const AuthContexto = createContext<AuthContextoTipo | undefined>(undefined);

// O Supabase Auth responde em inglês; a pessoa vê sempre português.
const ERROS_AUTH: Array<[RegExp, string]> = [
  [
    /network request failed|failed to fetch|network error/i,
    'Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.',
  ],
  [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
  [/user already registered|already been registered/i, 'Já existe uma conta com este e-mail.'],
  [
    /password should be|weak password|password is too/i,
    'Senha fraca: use ao menos 8 caracteres com letras e números.',
  ],
  [/invalid email|unable to validate email|email address .* is invalid/i, 'E-mail inválido.'],
  [/rate limit|too many requests/i, 'Muitas tentativas. Aguarde um pouco e tente de novo.'],
  [/signups not allowed|signup is disabled/i, 'Cadastro desativado no momento.'],
];

export function traduzirErroAuth(erro: { message?: string } | null): string | null {
  if (!erro) return null;
  const mensagem = erro.message || '';
  const traducao = ERROS_AUTH.find(([padrao]) => padrao.test(mensagem));
  return traducao ? traducao[1] : 'Não foi possível concluir a autenticação. Tente de novo.';
}

export function AuthProvedor({ children }: { children: React.ReactNode }) {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Na renderização (e não num efeito) para valer antes de as telas filhas lerem o cache.
  definirUsuarioLocal(usuario?.id ?? null);

  useEffect(() => {
    // 1. Busca a sessão local e confirma que o usuário ainda existe no Auth.
    // Remover um usuário pelo painel não limpa o AsyncStorage do aparelho.
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        if (!session) {
          setSessao(null);
          setUsuario(null);
          setCarregando(false);
          return;
        }

        const { data: usuarioAtual, error } = await supabase.auth.getUser(session.access_token);
        const usuarioValido = !error && usuarioAtual.user;

        if (!usuarioValido) {
          await supabase.auth.signOut({ scope: 'local' });
          setSessao(null);
          setUsuario(null);
          setCarregando(false);
          return;
        }

        setSessao(session);
        setUsuario(usuarioAtual.user);
        setCarregando(false);
      })
      .catch(() => {
        setSessao(null);
        setUsuario(null);
        setCarregando(false);
      });

    // 2. Escuta mudanças na autenticação (login, logout, refresh token)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        return {
          erro: 'Confirme seu e-mail pelo link que enviamos antes de entrar.',
        };
      }
      return { erro: traduzirErroAuth(error) };
    }

    if (data.session) {
      setSessao(data.session);
      setUsuario(data.user);
    }

    return { erro: null };
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

    if (error) return { erro: traduzirErroAuth(error) };

    // Se o Supabase retornou sessão ativa (confirmação de e-mail desativada)
    if (data.user && data.session) {
      setSessao(data.session);
      setUsuario(data.user);

      // Cria o perfil inicial com a sessão ativa (passa pela política RLS)
      await supabase.from('perfis').upsert(
        [
          {
            usuario_id: data.user.id,
            nome,
            idade: 25,
            sexo: 'masculino',
            peso_kg: 70,
            altura_cm: 175,
            nivel_experiencia: 'iniciante',
            nivel_atividade: 'moderado',
          },
        ],
        { onConflict: 'usuario_id' },
      );

      return { erro: null };
    }

    // Se o Supabase requer confirmação de e-mail (session null)
    if (data.user && !data.session) {
      return {
        erro: 'CONFIRMACAO_PENDENTE',
      };
    }

    return { erro: null };
  };

  /** Realiza o logout */
  const sair = async () => {
    // Progresso e metas ficam no aparelho: não podem sobrar para a próxima conta.
    await limparCacheLocalUsuario();
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
