import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()

export const hasSupabaseBrowserConfig = Boolean(supabaseUrl && supabasePublishableKey)

const createSupabaseBrowserClient = () => {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null
  }

  return createClient(supabaseUrl, supabasePublishableKey)
}

export const supabase = createSupabaseBrowserClient()
