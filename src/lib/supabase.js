import { createClient } from '@supabase/supabase-js'

const metaEnv = typeof import.meta !== 'undefined' ? import.meta.env : undefined
const nodeEnv = typeof globalThis !== 'undefined' && globalThis.process ? globalThis.process.env : undefined

const supabaseUrl = metaEnv?.VITE_SUPABASE_URL || nodeEnv?.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseAnonKey = metaEnv?.VITE_SUPABASE_ANON_KEY || nodeEnv?.VITE_SUPABASE_ANON_KEY || 'anon-key'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)