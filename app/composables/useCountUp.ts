/** Counts a number up from 0 to `target` over `duration`ms (easeOutCubic), starting after `delay`ms once mounted. */
export function useCountUp(target: number, duration = 900, delay = 0) {
  const value = ref(0)

  onMounted(() => {
    if (prefersReducedMotion()) {
      value.value = target
      return
    }

    let startTime: number | null = null
    function tick(now: number) {
      if (startTime === null) startTime = now + delay
      const elapsed = now - startTime
      if (elapsed < 0) {
        requestAnimationFrame(tick)
        return
      }
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - (1 - progress) ** 3
      value.value = Math.round(eased * target)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

  return value
}
