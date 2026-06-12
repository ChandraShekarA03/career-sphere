import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const SaveSchema = z.object({
  opportunityId: z.string().uuid(),
  notes: z.string().max(500).optional(),
})

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('saved_opportunities')
    .select(`
      id, notes, saved_at,
      opportunities(
        id, title, description, url, location, deadline, stipend,
        organizations(id, name),
        opportunity_types(id, name),
        opportunity_skills(skill_id, skills(id, name, category))
      )
    `)
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  if (error) {
    return Response.json({ error: 'Failed to fetch saved opportunities' }, { status: 500 })
  }

  return Response.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = SaveSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { opportunityId, notes } = parsed.data

  const { data, error } = await supabase
    .from('saved_opportunities')
    .upsert(
      { user_id: user.id, opportunity_id: opportunityId, notes: notes ?? null },
      { onConflict: 'user_id,opportunity_id' }
    )
    .select('id, saved_at')
    .single()

  if (error) {
    return Response.json({ error: 'Failed to save opportunity' }, { status: 500 })
  }

  return Response.json({ data }, { status: 201 })
}
