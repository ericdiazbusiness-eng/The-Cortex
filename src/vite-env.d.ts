/// <reference types="vite/client" />

import type { CortexBridge } from './shared/cortex'

declare global {
  interface Window {
    cortexApi?: CortexBridge
  }
}
