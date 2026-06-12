import { createHash } from 'crypto'
import type { ScrapedOpportunity } from '@/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractSkillsFromText } from '@/lib/ai/skill-extractor'
import { generateEmbedding } from '@/lib/ai/embeddings'

// ============================================================
// ETL Pipeline – Extract, Transform, Load
// ============================================================

/**
 * Normalize a URL for deduplication.
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    // Remove tracking params, utm_, etc.
    const ignoredParams = ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source']
    ignoredParams.forEach((p) => parsed.searchParams.delete(p))
    return parsed.href.toLowerCase().replace(/\/$/, '')
  } catch {
    return url.toLowerCase().trim()
  }
}

/**
 * Compute a SHA-256 hash for URL-based deduplication.
 */
function hashUrl(url: string): string {
  return createHash('sha256').update(normalizeUrl(url)).digest('hex').substring(0, 32)
}

/**
 * Normalize an organization name for deduplication.
 */
function normalizeOrgName(name: string): string {
  return name.trim().toLowerCase()
    .replace(/\s+(ltd|inc|llc|pvt|private|limited|corp|corporation|co)\.?$/i, '')
    .trim()
}

/**
 * Parse a human-readable deadline string into a YYYY-MM-DD date.
 */
function parseDeadline(raw?: string): string | null {
  if (!raw) return null
  const cleaned = raw.trim()

  // Try direct Date parse
  const parsed = new Date(cleaned)
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  // Match patterns like "15 Jan 2025" or "Jan 15, 2025"
  const match = cleaned.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/) ||
                cleaned.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/)
  if (match) {
    const attempt = new Date(cleaned)
    if (!isNaN(attempt.getTime())) {
      return attempt.toISOString().split('T')[0]
    }
  }

  return null
}

/**
 * Transform raw scraped data into DB-ready records.
 * - Deduplicates by URL hash
 * - Normalizes dates and organization names
 * - Extracts skills from description if none provided
 */
export async function transformOpportunities(
  raw: ScrapedOpportunity[],
  existingUrlHashes: Set<string>
): Promise<{
  transformed: TransformedOpportunity[]
  duplicatesSkipped: number
}> {
  let duplicatesSkipped = 0
  const transformed: TransformedOpportunity[] = []
  const seenHashes = new Set<string>(existingUrlHashes)

  for (const item of raw) {
    const urlHash = hashUrl(item.url)

    // Skip duplicates
    if (seenHashes.has(urlHash)) {
      duplicatesSkipped++
      continue
    }
    seenHashes.add(urlHash)

    // Extract skills from description if not provided
    let skills = item.skills ?? []
    if (skills.length === 0 && item.description && item.description.length > 30) {
      try {
        const extracted = await extractSkillsFromText(item.description, 'opportunity')
        skills = extracted.filter((e) => e.confidence > 0.5).map((e) => e.skill)
      } catch {
        // Non-blocking – proceed without skills
      }
    }

    transformed.push({
      title: item.title.trim().substring(0, 255),
      organizationName: item.organization.trim(),
      organizationNameNormalized: normalizeOrgName(item.organization),
      organizationWebsite: item.organizationWebsite,
      description: item.description?.trim(),
      url: item.url,
      urlHash,
      location: item.location?.trim() || 'Not specified',
      deadline: parseDeadline(item.deadline),
      stipend: item.stipend,
      duration: item.duration,
      skills,
      opportunityTypeName: item.opportunityType || 'Internship',
      source: item.source,
    })
  }

  return { transformed, duplicatesSkipped }
}

export interface TransformedOpportunity {
  title: string
  organizationName: string
  organizationNameNormalized: string
  organizationWebsite?: string
  description?: string
  url: string
  urlHash: string
  location: string
  deadline: string | null
  stipend?: string
  duration?: string
  skills: string[]
  opportunityTypeName: string
  source: string
}

/**
 * Load transformed opportunities into the database.
 * Handles org upsert, opportunity type lookup, skill upsert,
 * opportunity insert, and opportunity_skills linking.
 */
export async function loadOpportunities(
  scrapeJobId: string,
  opportunities: TransformedOpportunity[]
): Promise<{ loaded: number; errors: number }> {
  const admin = createAdminClient()
  let loaded = 0
  let errors = 0

  for (const item of opportunities) {
    try {
      // 1. Upsert organization
      const { data: org } = await admin
        .from('organizations')
        .upsert({ name: item.organizationName, website: item.organizationWebsite ?? null }, {
          onConflict: 'name',
        })
        .select('id')
        .single()

      // 2. Get opportunity type ID
      const { data: oppType } = await admin
        .from('opportunity_types')
        .select('id')
        .eq('name', item.opportunityTypeName)
        .single()

      // 3. Generate Semantic Search Embedding
      let embedding = null
      try {
        const textToEmbed = `${item.title} at ${item.organizationName}. ${item.description ?? ''} Skills: ${item.skills.join(', ')}`
        embedding = await generateEmbedding(textToEmbed)
      } catch (err) {
        console.warn('[etl] Failed to generate embedding for:', item.title, err)
      }

      // 4. Insert opportunity (skip if url_hash conflict)
      const { data: opportunity, error: oppError } = await admin
        .from('opportunities')
        .insert({
          scrape_job_id: scrapeJobId,
          organization_id: org?.id ?? null,
          opportunity_type_id: oppType?.id ?? null,
          title: item.title,
          description: item.description ?? null,
          url: item.url,
          url_hash: item.urlHash,
          location: item.location,
          deadline: item.deadline,
          stipend: item.stipend ?? null,
          duration: item.duration ?? null,
          source: item.source,
          embedding,
        })
        .select('id')
        .single()

      if (oppError) {
        // Likely a duplicate url_hash — skip
        if (oppError.code !== '23505') {
          console.error('[etl] Opportunity insert error:', oppError.message)
          errors++
        }
        continue
      }

      // 5. Upsert skills and link to opportunity
      if (opportunity && item.skills.length > 0) {
        for (const skillName of item.skills) {
          if (!skillName.trim()) continue

          const { data: skill } = await admin
            .from('skills')
            .upsert({ name: skillName.trim() }, { onConflict: 'name' })
            .select('id')
            .single()

          if (skill) {
            await admin.from('opportunity_skills').upsert(
              { opportunity_id: opportunity.id, skill_id: skill.id },
              { onConflict: 'opportunity_id,skill_id' }
            )
          }
        }
      }

      loaded++
    } catch (err) {
      console.error('[etl] Unexpected error:', err)
      errors++
    }
  }

  return { loaded, errors }
}
