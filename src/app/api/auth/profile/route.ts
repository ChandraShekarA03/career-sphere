import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ProfileInsert } from '@/types/database'
import { z } from 'zod'

const ProfileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  degree: z.string().max(100).optional(),
  institution: z.string().max(200).optional(),
  graduation_year: z.number().int().min(2000).max(2035).optional(),
  interests: z.array(z.string()).max(10).optional(),
})

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') {
    return Response.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }

  return Response.json({ data: profile ?? null })
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

  const parsed = ProfileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const upsertData: ProfileInsert = {
    id: user.id,
    email: user.email!,
    full_name: parsed.data.full_name ?? null,
    bio: parsed.data.bio ?? null,
    degree: parsed.data.degree ?? null,
    institution: parsed.data.institution ?? null,
    graduation_year: parsed.data.graduation_year ?? null,
    interests: parsed.data.interests ?? null,
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .upsert(upsertData, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    return Response.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return Response.json({ data: profile })
}
