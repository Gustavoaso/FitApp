// ============================================================
// PÁGINA PRINCIPAL / LANDING PAGE: (apps/web/src/app/page.tsx)
// ============================================================
// Landing page do FitApp na Web com apresentação do produto,
// demonstração das funcionalidades e link para o web app.
// ============================================================

import React from 'react';
import { OBJETIVOS } from '@fitapp/constantes';

export default function PaginaInicial() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navegação Superior */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem 3rem',
          borderBottom: '1px solid var(--glass-borda)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #6C5CE7 0%, #A855F7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ⚡ FitApp
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--texto-secundario)', fontSize: '0.95rem' }}>Já tem conta?</span>
          <button className="btn-primario">Entrar no Web App</button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', padding: '0.4rem 1rem', background: 'var(--primaria-suave)', border: '1px solid rgba(108, 92, 231, 0.3)', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--primaria)', fontWeight: '600', marginBottom: '1.5rem' }}>
          ✨ Nutrição Esportiva + Treino com Inteligência Artificial
        </div>

        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '1.5rem' }}>
          Seu treino e dieta <br />
          <span style={{ background: 'linear-gradient(135deg, #6C5CE7 0%, #00D2FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            100% personalizados para você
          </span>
        </h1>

        <p style={{ fontSize: '1.25rem', color: 'var(--texto-secundario)', maxWidth: '680px', margin: '0 auto 2.5rem' }}>
          Gere um plano científico baseado na Tabela TACO brasileira e na sua rotina exata de treinos. Ajustes em tempo real pelo celular ou computador.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '4rem' }}>
          <button className="btn-primario" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
            Gerar Meu Plano Agora ➔
          </button>
        </div>

        {/* Grid de Recursos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', textAlign: 'left', marginTop: '3rem' }}>
          <div className="card-vidro">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🧬</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Cálculo Metabólico Exato</h3>
            <p style={{ color: 'var(--texto-secundario)', fontSize: '0.95rem' }}>
              Fórmulas de Mifflin-St Jeor para calcular sua TMB e gasto calórico diário (TDEE) com precisão cirúrgica.
            </p>
          </div>

          <div className="card-vidro">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏋️‍♂️</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Treino Ao Vivo & Timer</h3>
            <p style={{ color: 'var(--texto-secundario)', fontSize: '0.95rem' }}>
              Acompanhamento de séries, cargas e tempo de descanso regressivo com feedback tátil no mobile.
            </p>
          </div>

          <div className="card-vidro">
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🥗</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>Tabela TACO Integrada</h3>
            <p style={{ color: 'var(--texto-secundario)', fontSize: '0.95rem' }}>
              Alimentos da rotina brasileira com busca rápida, contagem automática de macros e água.
            </p>
          </div>
        </div>

        {/* Seção de Objetivos */}
        <div style={{ marginTop: '5rem', textAlign: 'left' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1.5rem', textAlign: 'center' }}>
            Objetivos Suportados
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {OBJETIVOS.map((obj) => (
              <div key={obj.valor} className="card-vidro" style={{ padding: '1.25rem' }}>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{obj.label}</div>
                <div style={{ color: 'var(--texto-secundario)', fontSize: '0.85rem' }}>{obj.descricao}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <footer style={{ borderTop: '1px solid var(--glass-borda)', padding: '2rem', textAlign: 'center', color: 'var(--texto-secundario)', fontSize: '0.9rem' }}>
        FitApp © 2026 — Desenvolvido com React Native, Next.js 15, Supabase e Claude 3.5 API
      </footer>
    </div>
  );
}
