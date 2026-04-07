import type { CortexBridge } from '@/shared/cortex'
import { createBrowserFallbackApi } from './browserFallbackApi'

let fallbackApi: CortexBridge | null = null

export const getCortexApi = (): CortexBridge => {
  if (typeof window !== 'undefined' && window.cortexApi) {
    return window.cortexApi
  }

  fallbackApi ??= createBrowserFallbackApi()
  return fallbackApi
}
