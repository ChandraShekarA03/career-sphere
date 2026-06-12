import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, rateLimitKeys } from '@/lib/rate-limit'
import { runScrapeJob } from '@/lib/scraping/scraper-manager'
import { z } from 'zod'

const ScrapeRequestSchema = z.object({
  query: z.string().min(2).max(200),
  filters: z.object({
    type: z.string().optional(),
    location: z.string().optional(),
    deadline: z.string().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting: 5 scrapes per hour per user
  const rl = rateLimit(rateLimitKeys.scrape(user.id))
  if (!rl.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded. Try again later.', resetAt: rl.resetAt },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = ScrapeRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { query, filters } = parsed.data

  // Create scrape job record
  const { data: scrapeJob, error: jobError } = await supabase
    .from('scrape_jobs')
    .insert({
      user_id: user.id,
      query,
      filters: filters ?? null,
      status: 'pending',
    })
    .select('id, status, created_at, expires_at')
    .single()

  if (jobError || !scrapeJob) {
    return Response.json({ error: 'Failed to create scrape job' }, { status: 500 })
  }

  // Run scraping in background (fire and forget)
  // In production, use a queue (e.g. Inngest, Trigger.dev)
  runScrapeJob(scrapeJob.id, query, filters as Record<string, string>).catch((err) => {
    console.error('[api/scrape] Background scrape error:', err)
  })

  return Response.json({
    data: {
      jobId: scrapeJob.id,
      status: 'pending',
      query,
      message: 'Scrape job started. Poll /api/scrape/[jobId] for status.',
    },
  }, { status: 202 })
}
