import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: job, error } = await supabase
    .from('scrape_jobs')
    .select('id, query, status, result_count, error_message, created_at, expires_at')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single()

  if (error || !job) {
    return Response.json({ error: 'Scrape job not found' }, { status: 404 })
  }

  return Response.json({ data: job })
}
