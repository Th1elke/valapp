/**
 * Click-and-drag-to-scroll behavior for a horizontally or vertically overflowing container.
 * Only engages (and captures the pointer) once the pointer moves past a small threshold,
 * so plain clicks on interactive children (buttons, etc.) still fire normally.
 */
export function useDragScroll(direction: 'x' | 'y' = 'x') {
  const el = ref<HTMLElement | null>(null)
  const DRAG_THRESHOLD = 4

  let pressed = false
  let captured = false
  let startPos = 0
  let startScroll = 0

  function onPointerDown(event: PointerEvent) {
    if (!el.value) return
    pressed = true
    captured = false
    startPos = direction === 'x' ? event.clientX : event.clientY
    startScroll = direction === 'x' ? el.value.scrollLeft : el.value.scrollTop
  }

  function onPointerMove(event: PointerEvent) {
    if (!pressed || !el.value) return
    const pos = direction === 'x' ? event.clientX : event.clientY
    const delta = pos - startPos

    if (!captured) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return
      captured = true
      el.value.setPointerCapture(event.pointerId)
    }

    if (direction === 'x') el.value.scrollLeft = startScroll - delta
    else el.value.scrollTop = startScroll - delta
  }

  function onPointerUp() {
    pressed = false
    captured = false
  }

  return { el, onPointerDown, onPointerMove, onPointerUp }
}
