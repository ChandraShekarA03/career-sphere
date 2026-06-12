import type { Skill, MatchResult } from '@/types'

/**
 * Compute a match score between a user's skill set and an opportunity's required skills.
 *
 * Formula: score = (matched / total_required) * 100
 * If the opportunity has no required skills, score defaults to 50 (neutral).
 */
export function computeMatchScore(
  userSkills: Skill[],
  opportunitySkills: Skill[]
): MatchResult {
  if (opportunitySkills.length === 0) {
    return {
      score: 50,
      matchedSkillIds: [],
      missingSkillIds: [],
      matchedSkills: [],
      missingSkills: [],
    }
  }

  const userSkillIds = new Set(userSkills.map((s) => s.id))
  const opportunitySkillIds = new Set(opportunitySkills.map((s) => s.id))

  const matchedSkills = opportunitySkills.filter((s) => userSkillIds.has(s.id))
  const missingSkills = opportunitySkills.filter((s) => !userSkillIds.has(s.id))

  const score = Math.round((matchedSkills.length / opportunitySkills.length) * 100)

  return {
    score,
    matchedSkillIds: matchedSkills.map((s) => s.id),
    missingSkillIds: missingSkills.map((s) => s.id),
    matchedSkills,
    missingSkills,
  }
}

/**
 * Get a color class for a match score.
 */
export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-400'
  if (score >= 50) return 'text-yellow-400'
  if (score >= 25) return 'text-orange-400'
  return 'text-red-400'
}

/**
 * Get a label for a match score.
 */
export function getScoreLabel(score: number): string {
  if (score >= 75) return 'Strong Match'
  if (score >= 50) return 'Good Match'
  if (score >= 25) return 'Partial Match'
  return 'Low Match'
}
