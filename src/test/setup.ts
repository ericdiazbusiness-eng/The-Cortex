import '@testing-library/jest-dom'

if (typeof window !== 'undefined') {
  const store = new Map<string, string>()
  const localStorageMock = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  }

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    configurable: true,
  })

  Object.defineProperty(window, 'requestAnimationFrame', {
    value: () => 0,
    configurable: true,
    writable: true,
  })

  Object.defineProperty(window, 'cancelAnimationFrame', {
    value: () => {},
    configurable: true,
    writable: true,
  })
}

if (typeof HTMLCanvasElement !== 'undefined') {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    value: () => ({
      setTransform: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      arc: () => {},
      fill: () => {},
      fillRect: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {},
      }),
      createRadialGradient: () => ({
        addColorStop: () => {},
      }),
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 1,
      lineJoin: 'round',
    }),
  })
}
