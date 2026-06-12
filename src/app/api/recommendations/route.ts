import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { computeMatchScore } from '@/lib/matching/engine'
import type { Skill } from '@/types'

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch cached recommendations first
  const { data: cached } = await supabase
    .from('recommendations')
    .select(`
      score, matched_skills, missing_skills, generated_at,
      opportunities(
        id, title, description, url, location, deadline,
        organizations(id, name),
        opportunity_types(id, name)
      )
    `)
    .eq('user_id', user.id)
    .order('score', { ascending: false })
    .limit(20)

  if (cached && cached.length > 0) {
    return Response.json({ data: cached })
  }

  // No cache – compute fresh recommendations
  const admin = createAdminClient()

  // Get user skills
  const { data: userSkillRows } = await supabase
    .from('user_skills')
    .select('skills(id, name, category)')
    .eq('user_id', user.id)

  const userSkills: Skill[] = ((userSkillRows as unknown as unknown[]) ?? [])
    .map((r) => (r as { skills: Skill | null }).skills)
    .filter(Boolean) as Skill[]

  if (userSkills.length === 0) {
    return Response.json({ data: [], message: 'Add skills to your profile to get recommendations.' })
  }

  // Get recent unarchived opportunities from user's jobs
  const { data: jobs } = await supabase
    .from('scrape_jobs')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!jobs?.length) {
    return Response.json({ data: [], message: 'Run a search first to get recommendations.' })
  }

  const { data: opportunities } = await supabase
    .from('opportunities')
    .select(`
      id,
      opportunity_skills(skill_id, skills(id, name, category))
    `)
    .in('scrape_job_id', jobs.map((j) => j.id))
    .eq('is_archived', false)
    .limit(100)

  if (!opportunities?.length) {
    return Response.json({ data: [] })
  }

  // Compute match scores and upsert into recommendations
  const recommendationRows = opportunities
    .map((opp) => {
      const oppSkills: Skill[] = ((opp.opportunity_skills as unknown as unknown[]) ?? [])
        .map((os) => (os as { skills: Skill | null }).skills)
        .filter(Boolean) as Skill[]

      const result = computeMatchScore(userSkills, oppSkills)
      return {
        user_id: user.id,
        opportunity_id: opp.id,
        score: result.score,
        matched_skills: result.matchedSkillIds,
        missing_skills: result.missingSkillIds,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  // Cache in recommendations table
  await admin.from('recommendations').upsert(recommendationRows, {
    onConflict: 'user_id,opportunity_id',
  })

  // Return with full opportunity details
  const { data: finalRecs } = await supabase
    .from('recommendations')
    .select(`
      score, matched_skills, missing_skills, generated_at,
      opportunities(
        id, title, description, url, location, deadline,
        organizations(id, name),
        opportunity_types(id, name)
      )
    `)
    .eq('user_id', user.id)
    .order('score', { ascending: false })
    .limit(20)

  return Response.json({ data: finalRecs ?? [] })
}

export async function POST(_request: NextRequest) {
  // Force regenerate recommendations
  const supabase = await createClient()
  const admin = createAdminClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Clear cache
  await admin.from('recommendations').delete().eq('user_id', user.id)

  return Response.json({ data: { cleared: true, message: 'Recommendations cleared. Refresh to regenerate.' } })
}
