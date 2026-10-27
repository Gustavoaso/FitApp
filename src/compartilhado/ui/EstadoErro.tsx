// ============================================================
// COMPONENTE: EstadoErro
// ============================================================
// Erro ou falta de conexão: o que houve em português simples e "Tentar de novo".
// ============================================================

import React from 'react';
import { EstadoVazio } from './EstadoVazio';

interface PropsEstadoErro {
  mensagem?: string;
  aoTentarDeNovo: () => void;
}

export function EstadoErro({
  mensagem = 'Verifique sua conexão e tente de novo.',
  aoTentarDeNovo,
}: PropsEstadoErro) {
  return (
    <EstadoVazio
      simbolo="exclamationmark.triangle"
      titulo="Não foi possível carregar"
      mensagem={mensagem}
      textoAcao="Tentar de novo"
      aoAgir={aoTentarDeNovo}
    />
  );
}
