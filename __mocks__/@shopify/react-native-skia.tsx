// Skia é ESM nativo e não roda no Jest: componentes vazios bastam para os testes de tela.
const vazio = () => null;
export const Canvas = vazio;
export const Circle = vazio;
export const Points = vazio;
export const RadialGradient = vazio;
export const useClock = () => ({ value: 0 });
export const vec = (x: number, y: number) => ({ x, y });
