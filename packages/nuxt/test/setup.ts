/**
 * jsdom does not implement `ResizeObserver`, but `reka-ui` (the headless layer
 * under Nuxt UI) touches it in a post-flush callback. Without a stub that
 * throws inside the renderer's error boundary, which shows up as a
 * "[openui] Component render error" line in the test output and hides real
 * errors behind noise.
 *
 * The stub reports a zero-sized box, which is what jsdom's
 * `getBoundingClientRect()` returns anyway.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    constructor(private readonly callback: ResizeObserverCallback) {}

    observe(target: Element) {
      const rect = target.getBoundingClientRect()
      const box = [{ blockSize: rect.height, inlineSize: rect.width }]
      this.callback(
        [
          {
            target,
            contentRect: rect,
            borderBoxSize: box,
            contentBoxSize: box,
            devicePixelContentBoxSize: box
          } as unknown as ResizeObserverEntry
        ],
        this as unknown as ResizeObserver
      )
    }

    unobserve() {}

    disconnect() {}
  }

  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

/**
 * jsdom does not implement `scrollIntoView`. reka-ui's Listbox calls it on the
 * highlighted option when a CommandPalette item is selected, which otherwise
 * becomes an unhandled rejection in tests.
 */
if (typeof Element !== 'undefined' && typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => {}
}
