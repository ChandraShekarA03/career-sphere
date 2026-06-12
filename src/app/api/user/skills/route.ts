import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const UpdateSkillsSchema = z.object({
  skillIds: z.array(z.number().int().positive()),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
})

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('user_skills')
    .select('skill_id, level, added_at, skills(id, name, category)')
    .eq('user_id', user.id)
    .order('added_at', { ascending: false })

  if (error) {
    return Response.json({ error: 'Failed to fetch user skills' }, { status: 500 })
  }

  return Response.json({ data: data ?? [] })
}

export async function PUT(request: NextRequest) {
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

  const parsed = UpdateSkillsSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { skillIds, level } = parsed.data

  // Upsert all provided skills
  const rows = skillIds.map((skillId) => ({
    user_id: user.id,
    skill_id: skillId,
    level: level ?? null,
  }))

  const { error } = await supabase
    .from('user_skills')
    .upsert(rows, { onConflict: 'user_id,skill_id' })

  if (error) {
    return Response.json({ error: 'Failed to update skills' }, { status: 500 })
  }

  return Response.json({ data: { updated: skillIds.length } })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const skillId = searchParams.get('skillId')

  if (!skillId) {
    return Response.json({ error: 'skillId is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_skills')
    .delete()
    .eq('user_id', user.id)
    .eq('skill_id', parseInt(skillId))

  if (error) {
    return Response.json({ error: 'Failed to remove skill' }, { status: 500 })
  }

  return Response.json({ data: { removed: true } })
}
