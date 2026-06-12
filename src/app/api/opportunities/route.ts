import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const jobId = searchParams.get('jobId')
  const q = searchParams.get('q')
  const page = parseInt(searchParams.get('page') ?? '1')
  const pageSize = Math.min(parseInt(searchParams.get('pageSize') ?? '20'), 50)
  const type = searchParams.get('type')
  const location = searchParams.get('location')

  const offset = (page - 1) * pageSize

  // Use admin client so we search the global pool of all scraped opportunities
  const admin = createAdminClient()

  let queryBuilder = admin
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

  if (jobId && q) {
    const safeQ = q.replace(/,/g, ' ')
    queryBuilder = queryBuilder.or(`scrape_job_id.eq.${jobId},title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
  } else if (jobId) {
    queryBuilder = queryBuilder.eq('scrape_job_id', jobId)
  } else if (q) {
    const safeQ = q.replace(/,/g, ' ')
    queryBuilder = queryBuilder.or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
  }

  if (type) {
    queryBuilder = queryBuilder.eq('opportunity_types.name', type)
  }

  if (location) {
    queryBuilder = queryBuilder.ilike('location', `%${location}%`)
  }

  const { data, error, count } = await queryBuilder

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
