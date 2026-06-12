import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateEmbedding } from '@/lib/ai/embeddings'

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
    
  let semanticMatches: any[] = []

  if (q) {
    try {
      const embedding = await generateEmbedding(q)
      const { data: matches, error: rpcError } = await (admin.rpc as any)('match_opportunities', {
        query_embedding: `[${embedding.join(',')}]`,
        match_threshold: 0.3,
        match_count: 50,
        filter_job_id: jobId || null
      })
      
      if (rpcError) throw rpcError
      
      semanticMatches = matches || []
      const matchIds = semanticMatches.map((m) => m.id)
      
      if (matchIds.length === 0) {
        return Response.json({ data: [], count: 0, page, pageSize, totalPages: 0 })
      }
      
      queryBuilder = queryBuilder.in('id', matchIds)
    } catch (err) {
      console.warn('[api/opportunities] Semantic search failed, falling back to keyword search:', err)
      // Fallback to keyword if embedding fails (e.g., API key missing)
      const safeQ = q.replace(/,/g, ' ')
      if (jobId) {
        queryBuilder = queryBuilder.or(`scrape_job_id.eq.${jobId},title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
      } else {
        queryBuilder = queryBuilder.or(`title.ilike.%${safeQ}%,description.ilike.%${safeQ}%`)
      }
    }
  } else if (jobId) {
    queryBuilder = queryBuilder.eq('scrape_job_id', jobId)
  }

  // Only apply pagination at DB level if we aren't sorting in memory for semantic search
  if (!q || semanticMatches.length === 0) {
    queryBuilder = queryBuilder
      .range(offset, offset + pageSize - 1)
      .order('created_at', { ascending: false })
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

  let results = data ?? []
  let totalCount = count ?? 0

  // If we used semantic search, sort the results by similarity score and paginate in memory
  if (q && semanticMatches.length > 0) {
    const similarityMap = new Map(semanticMatches.map(m => [m.id, m.similarity]))
    results = results.sort((a, b) => (similarityMap.get(b.id) || 0) - (similarityMap.get(a.id) || 0))
    // Add match_score to the response object (0-100 scale)
    results = results.map(r => ({ ...r, match_score: Math.round((similarityMap.get(r.id) || 0) * 100) }))
    
    totalCount = results.length
    results = results.slice(offset, offset + pageSize)
  }

  return Response.json({
    data: results,
    count: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  })
}
