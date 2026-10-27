// ============================================================
// POLYFILLS GLOBAIS (executados no prelude do Metro)
// ============================================================

function CustomDOMException(message, name) {
  this.message = message || '';
  this.name = name || 'DOMException';
  this.code = 0;
}
CustomDOMException.prototype = Object.create(Error.prototype);
CustomDOMException.prototype.constructor = CustomDOMException;

if (typeof globalThis !== 'undefined' && typeof globalThis.DOMException === 'undefined') {
  globalThis.DOMException = CustomDOMException;
}

if (typeof global !== 'undefined' && typeof global.DOMException === 'undefined') {
  global.DOMException = CustomDOMException;
}

if (typeof window !== 'undefined' && typeof window.DOMException === 'undefined') {
  window.DOMException = CustomDOMException;
}

if (typeof self !== 'undefined' && typeof self.DOMException === 'undefined') {
  self.DOMException = CustomDOMException;
}
