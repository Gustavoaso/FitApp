// Deixa o Node (24+, que já roda .ts) importar o código do app sem bundler:
// resolve o alias `@/` e imports sem extensão, e troca o cliente do Supabase
// do app (AsyncStorage, URL de produção) pelo cliente local da avaliação.
// Uso: node --import ./scripts/avaliacao/carregador.mjs scripts/avaliar-planos.ts
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ_SRC = new URL('../../src/', import.meta.url);
const CLIENTE_LOCAL = new URL('./supabase-local.ts', import.meta.url).href;

function comExtensao(url) {
  const caminho = fileURLToPath(url);
  for (const sufixo of ['', '.ts', '.tsx', '/index.ts']) {
    if (existsSync(caminho + sufixo) && !existsSync(caminho + sufixo + '/')) {
      return pathToFileURL(caminho + sufixo).href;
    }
  }
  return null;
}

registerHooks({
  resolve(especificador, contexto, proximo) {
    if (especificador === '@/compartilhado/supabase') return { url: CLIENTE_LOCAL, shortCircuit: true };
    let alvo = null;
    if (especificador.startsWith('@/')) alvo = new URL(especificador.slice(2), RAIZ_SRC);
    else if (especificador.startsWith('.') && contexto.parentURL?.startsWith('file:')) {
      alvo = new URL(especificador, contexto.parentURL);
    }
    const url = alvo && comExtensao(alvo);
    return url ? { url, shortCircuit: true } : proximo(especificador, contexto);
  },
});
