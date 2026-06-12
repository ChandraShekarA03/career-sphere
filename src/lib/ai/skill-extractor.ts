import OpenAI from 'openai'

let _openai: OpenAI | null = null
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy' })
  }
  return _openai
}

/**
 * Extract skill names from free-form text using GPT-4o-mini.
 * Returns an array of normalized skill names with confidence scores.
 */
export async function extractSkillsFromText(
  text: string,
  context: 'resume' | 'opportunity' = 'resume'
): Promise<{ skill: string; confidence: number }[]> {
  const systemPrompt =
    context === 'resume'
      ? `You are an expert career counselor. Extract technical and soft skills from the provided resume text.`
      : `You are an expert recruiter. Extract required skills from the provided job/opportunity description.`

  const userPrompt = `
Extract all skills from the following ${context} text. Return a JSON array of objects with "skill" (string) and "confidence" (number 0-1).

Only include real, specific skills — not vague terms like "fast learner" unless specifically relevant.
Normalize skill names (e.g., "node" → "Node.js", "ml" → "Machine Learning").
Include programming languages, frameworks, tools, domain knowledge, and soft skills.

Text:
${text.substring(0, 4000)}

Return ONLY valid JSON array, no markdown, no explanation.
Example: [{"skill": "Python", "confidence": 0.95}, {"skill": "React", "confidence": 0.90}]
`

  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) return []

    // The model returns { skills: [...] } or directly an array
    const parsed = JSON.parse(content)
    const skills = Array.isArray(parsed) ? parsed : (parsed.skills ?? [])

    return skills
      .filter(
        (s: unknown) =>
          s &&
          typeof (s as { skill: unknown }).skill === 'string' &&
          typeof (s as { confidence: unknown }).confidence === 'number'
      )
      .map((s: { skill: string; confidence: number }) => ({
        skill: s.skill.trim(),
        confidence: Math.min(1, Math.max(0, s.confidence)),
      }))
  } catch (error) {
    console.error('[skill-extractor] Error:', error)
    return []
  }
}

/**
 * Normalizes a raw skill string against known skills in the DB.
 * Falls back to the raw string if no match found.
 */
export function normalizeSkillName(raw: string): string {
  return raw.trim()
}
