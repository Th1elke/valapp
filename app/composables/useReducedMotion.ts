/** SSR-safe one-shot check — used to skip JS-driven delays/animations (setTimeout stagger, count-up rAF) that a CSS media query alone can't cancel. */
export function prefersReducedMotion(): boolean {
  if (!import.meta.client) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
