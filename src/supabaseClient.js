import { createClient } from '@supabase/supabase-js'

// TODO: Replace with your NEW Supabase project details
const supabaseUrl = 'https://ewpvtqejaqynnxwrzekq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3cHZ0cWVqYXF5bm54d3J6ZWtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDY1MzksImV4cCI6MjA4NTM4MjUzOX0.GhZb-ax9jy1IRE6K6ICnbjuNmJuEOqpdWFHNnkr_vzg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
