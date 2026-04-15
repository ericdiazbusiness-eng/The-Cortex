import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

if (typeof window !== 'undefined') {
  const store = new Map<string, string>()
  const requestAnimationFrameMock = () => 0
  const cancelAnimationFrameMock = () => {}
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
    value: requestAnimationFrameMock,
    configurable: true,
    writable: true,
  })

  Object.defineProperty(window, 'cancelAnimationFrame', {
    value: cancelAnimationFrameMock,
    configurable: true,
    writable: true,
  })

  Object.defineProperty(globalThis, 'requestAnimationFrame', {
    value: requestAnimationFrameMock,
    configurable: true,
    writable: true,
  })

  Object.defineProperty(globalThis, 'cancelAnimationFrame', {
    value: cancelAnimationFrameMock,
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
