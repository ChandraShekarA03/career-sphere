import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeMatchScore } from '@/lib/matching/engine'
import type { Skill } from '@/types'

// Type for the raw join result to bypass Supabase's join inference
interface OppWithJoins {
  id: string
  title: string
  description: string | null
  url: string
  location: string | null
  deadline: string | null
  stipend: string | null
  duration: string | null
  is_archived: boolean
  source: string | null
  url_hash: string | null
  scrape_job_id: string
  organization_id: string | null
  opportunity_type_id: number | null
  created_at: string
  updated_at: string
  organizations: { id: string; name: string; website: string | null } | null
  opportunity_types: { id: string; name: string } | null
  // Typed as unknown[] to avoid Supabase SelectQueryError on non-registered relations
  opportunity_skills: unknown[]
}

interface UserSkillRow {
  skills: Skill | null
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch opportunity with full join — cast to bypass join type checking
  const { data: raw, error } = await supabase
    .from('opportunities')
    .select(`
      *,
      organizations(id, name, website),
      opportunity_types(id, name),
      opportunity_skills(skill_id, skills(id, name, category))
    `)
    .eq('id', id)
    .single()

  if (error || !raw) {
    return Response.json({ error: 'Opportunity not found' }, { status: 404 })
  }

  const opportunity = raw as unknown as OppWithJoins

  // Extract skills list
  const oppSkills: Skill[] = (opportunity.opportunity_skills ?? [])
    .map((os) => (os as { skills: Skill | null }).skills)
    .filter(Boolean) as Skill[]

  // Fetch user skills for match score
  const { data: userSkillRows } = await supabase
    .from('user_skills')
    .select('skill_id, skills(id, name, category)')
    .eq('user_id', user.id)

  const userSkills: Skill[] = (userSkillRows ?? [])
    .map((us) => (us as unknown as UserSkillRow).skills)
    .filter(Boolean) as Skill[]

  // Compute match score
  const matchResult = computeMatchScore(userSkills, oppSkills)

  // Check if saved
  const { data: saved } = await supabase
    .from('saved_opportunities')
    .select('id')
    .eq('opportunity_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  return Response.json({
    data: {
      ...opportunity,
      skills: oppSkills,
      match_score: matchResult.score,
      matched_skills: matchResult.matchedSkills,
      missing_skills: matchResult.missingSkills,
      is_saved: !!saved,
    },
  })
}
