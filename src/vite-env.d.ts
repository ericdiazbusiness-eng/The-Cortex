/// <reference types="vite/client" />

import type { CortexBridge } from './shared/cortex'

declare global {
  interface ImportMetaEnv {
    readonly VITE_CORTEX_REALTIME_DEBUG?: string
    readonly VITE_CORTEX_PROFILE_SET?: 'default_three_mode' | 'legacy_four_mode'
    readonly VITE_SUPABASE_URL?: string
    readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }

  interface Window {
    cortexApi?: CortexBridge
  }
}

export {}
