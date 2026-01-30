import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your NEW Supabase project details
const supabaseUrl = 'https://ewpvtqejaqynnxwrzekq.supabase.co'
const supabaseAnonKey = 'sb_publishable_pD3kcP2LTapKNgpcvDAO0Q_SbuyRjJB'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
