import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://178.104.19.120:8000'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4MjU5NjI4LCJleHAiOjIwOTM2MTk2Mjh9.qWf_1115L5q1nmCwEYOOvty5NSvrWuOEq8MsTQVBGME'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
