import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const body = await req.json()
  const { user_id, email, first_name, last_name } = body

  if (!user_id || !email) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .insert({
      uuid: user_id,
      email,
      first_name,
      last_name
    })

  if (error) {
    console.error('Insert failed:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
