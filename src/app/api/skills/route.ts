import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: skills, error } = await supabase
    .from('skills')
    .select('id, name, category')
    .order('name')

  if (error) {
    return Response.json({ error: 'Failed to fetch skills' }, { status: 500 })
  }

  return Response.json({ data: skills ?? [] })
}
