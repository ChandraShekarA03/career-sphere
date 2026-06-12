import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const jobId = searchParams.get('jobId')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '20'), 50)
  const type = searchParams.get('type')
  const location = searchParams.get('location')

  const offset = (page - 1) * pageSize

  let query = supabase
    .from('opportunities')
    .select(`
      *,
      organizations(id, name, website),
      opportunity_types(id, name),
      opportunity_skills(skill_id, skills(id, name, category))
    `, { count: 'exact' })
    .eq('is_archived', false)
    .range(offset, offset + pageSize - 1)
    .order('created_at', { ascending: false })

  // Filter by scrape job (user's own data enforced by RLS)
  if (jobId) {
    query = query.eq('scrape_job_id', jobId)
  } else {
    // Show opportunities from user's recent scrape jobs (last 30 days)
    const { data: jobs } = await supabase
      .from('scrape_jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10)

    if (!jobs?.length) {
      return Response.json({ data: [], count: 0, page, pageSize, totalPages: 0 })
    }

    query = query.in('scrape_job_id', jobs.map((j) => j.id))
  }

  if (type) {
    query = query.eq('opportunity_types.name', type)
  }

  if (location) {
    query = query.ilike('location', `%${location}%`)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[api/opportunities] Query error:', error)
    return Response.json({ error: 'Failed to fetch opportunities' }, { status: 500 })
  }

  return Response.json({
    data: data ?? [],
    count: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  })
}
