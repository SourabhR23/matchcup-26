import { createClient } from '@supabase/supabase-js'

// Server-side client uses service role key — never exposed to the browser.
// Only import this in server components or API routes.
const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE!

export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
})
