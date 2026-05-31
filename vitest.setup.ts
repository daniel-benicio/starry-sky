import "@testing-library/jest-dom"

// ── Polyfills para jsdom ───────────────────────────────────────────────────────
// cmdk e Radix UI usam APIs que jsdom não implementa.

global.ResizeObserver = class ResizeObserver {
  observe()    {}
  unobserve()  {}
  disconnect() {}
}

// cmdk chama scrollIntoView nos itens do dropdown ao navegar com teclado.
Element.prototype.scrollIntoView = () => {}

// Radix UI usa PointerEvent para lógica de dropdown.
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type: string, init?: PointerEventInit) {
      super(type, init)
    }
  }
  global.PointerEvent = PointerEvent as typeof globalThis.PointerEvent
}
