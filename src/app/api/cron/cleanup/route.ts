import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  // Verify CRON_SECRET
  const secret = request.headers.get('x-cron-secret')
  if (!secret || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const archiveThreshold = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const deleteThreshold = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()

  // 1. Fetch job IDs expiring within 7 days (not yet expired)
  const { data: expiringJobs } = await admin
    .from('scrape_jobs')
    .select('id')
    .lt('expires_at', archiveThreshold)
    .gt('expires_at', now.toISOString())

  const expiringJobIds = (expiringJobs ?? []).map((j) => j.id)

  let archived = 0
  if (expiringJobIds.length > 0) {
    const { data: archivedRows, error: archiveError } = await admin
      .from('opportunities')
      .update({ is_archived: true })
      .in('scrape_job_id', expiringJobIds)
      .eq('is_archived', false)
      .select('id')

    if (archiveError) {
      console.error('[cron/cleanup] Archive error:', archiveError)
    } else {
      archived = archivedRows?.length ?? 0
    }
  }

  // 2. Fetch job IDs older than 14 days (expired)
  const { data: expiredJobs } = await admin
    .from('scrape_jobs')
    .select('id')
    .lt('expires_at', deleteThreshold)

  const expiredJobIds = (expiredJobs ?? []).map((j) => j.id)

  let deleted = 0
  if (expiredJobIds.length > 0) {
    // Fetch saved opportunity IDs to protect them
    const { data: savedRows } = await admin
      .from('saved_opportunities')
      .select('opportunity_id')

    const savedIds = (savedRows ?? []).map((s) => s.opportunity_id)

    // Delete unsaved opportunities from expired jobs
    let deleteQuery = admin
      .from('opportunities')
      .delete()
      .in('scrape_job_id', expiredJobIds)

    // Only exclude saved ones if there are any
    if (savedIds.length > 0) {
      deleteQuery = deleteQuery.not('id', 'in', `(${savedIds.map((id) => `'${id}'`).join(',')})`)
    }

    const { error: deleteError, count } = await deleteQuery

    if (deleteError) {
      console.error('[cron/cleanup] Delete error:', deleteError)
    } else {
      deleted = count ?? 0
    }
  }

  return Response.json({
    data: {
      archived,
      deleted,
      timestamp: now.toISOString(),
    },
  })
}
