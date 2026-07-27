// ============================================================
// PONTO DE ENTRADA MOBILE: index.js
// ============================================================
// Polyfills globais executados ANTES do Expo Router carregar os módulos.
// ============================================================

if (typeof globalThis.DOMException === 'undefined') {
  class CustomDOMException extends Error {
    constructor(message, name) {
      super(message);
      this.name = name || 'DOMException';
    }
  }
  Object.defineProperty(globalThis, 'DOMException', {
    value: CustomDOMException,
    writable: true,
    configurable: true,
  });
}

// Inicializa o Expo Router
import 'expo-router/entry';
