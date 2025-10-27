(function() {
  const prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const hardwareThreads = typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null;
  const deviceMemory = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null;
  const lowCpu = hardwareThreads !== null && hardwareThreads <= 4;
  const lowMem = deviceMemory !== null && deviceMemory <= 4;
  const isTouchOnly = 'ontouchstart' in window && !('onmousemove' in window);

  const isLowPower = prefersReducedMotion || lowCpu || lowMem || isTouchOnly;

  window.MapAppPerf = {
    prefersReducedMotion,
    hardwareThreads,
    deviceMemory,
    isLowPower
  };
})();
