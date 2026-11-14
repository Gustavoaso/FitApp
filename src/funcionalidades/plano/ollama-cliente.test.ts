import { normalizarUrlOllama } from './ollama-cliente';

describe('normalizarUrlOllama', () => {
  it('aceita nome .local e IP como vieram', () => {
    expect(normalizarUrlOllama('http://Meu-Mac.local:11434')).toBe('http://Meu-Mac.local:11434');
    expect(normalizarUrlOllama('http://192.168.0.10:11434')).toBe('http://192.168.0.10:11434');
  });

  it('completa o http:// e tira espaço e barra do fim', () => {
    expect(normalizarUrlOllama(' Meu-Mac.local:11434/ ')).toBe('http://Meu-Mac.local:11434');
    expect(normalizarUrlOllama('https://tunel.exemplo.com//')).toBe('https://tunel.exemplo.com');
  });

  it.each([undefined, null, '', '   '])('sem valor (%p) usa o localhost', (valor) => {
    expect(normalizarUrlOllama(valor)).toBe('http://localhost:11434');
  });

  it('tipo errado também cai no localhost', () => {
    expect(normalizarUrlOllama(123 as unknown as string)).toBe('http://localhost:11434');
  });
});
