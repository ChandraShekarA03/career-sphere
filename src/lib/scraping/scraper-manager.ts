import type { Scraper, ScrapedOpportunity } from './types'
import { InternshalasScraper } from './sources/internshala'
import { UnstopScraper } from './sources/unstop'
import { DevfolioScraper } from './sources/devfolio'
import { ArbeitnowScraper } from './sources/arbeitnow'
import { RemoteOKScraper } from './sources/remoteok'
import { transformOpportunities, loadOpportunities } from '@/lib/pipeline/etl'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Registry of all active scrapers.
 * Add new scrapers here to include them in searches.
 */
const SCRAPERS: Scraper[] = [
  new InternshalasScraper(),
  new UnstopScraper(),
  new DevfolioScraper(),
  new ArbeitnowScraper(),
  new RemoteOKScraper(),
]

export interface ScrapeManagerResult {
  totalScraped: number
  totalLoaded: number
  duplicatesSkipped: number
  errors: number
  sourceBreakdown: Record<string, number>
}

/**
 * Run all scrapers for a given query and load results into the DB.
 */
export async function runScrapeJob(
  scrapeJobId: string,
  query: string,
  filters?: Record<string, string>
): Promise<ScrapeManagerResult> {
  const admin = createAdminClient()

  // Mark job as running
  await admin
    .from('scrape_jobs')
    .update({ status: 'running' })
    .eq('id', scrapeJobId)

  const allRaw: ScrapedOpportunity[] = []
  const sourceBreakdown: Record<string, number> = {}
  let errors = 0

  // Run all scrapers in parallel
  const scrapePromises = SCRAPERS.map(async (scraper) => {
    try {
      console.log(`[scraper-manager] Running ${scraper.name}...`)
      const results = await scraper.scrape(query, filters)
      sourceBreakdown[scraper.sourceId] = results.length
      return results
    } catch (err) {
      console.error(`[scraper-manager] ${scraper.name} failed:`, err)
      errors++
      sourceBreakdown[scraper.sourceId] = 0
      return []
    }
  })

  const scraperResults = await Promise.allSettled(scrapePromises)
  scraperResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      allRaw.push(...result.value)
    }
  })

  // Fetch existing URL hashes to avoid duplicates across jobs
  const { data: existingHashes } = await admin
    .from('opportunities')
    .select('url_hash')
    .not('url_hash', 'is', null)

  const existingHashSet = new Set(
    (existingHashes ?? []).map((h) => h.url_hash as string)
  )

  // Transform (normalize + deduplicate)
  const { transformed, duplicatesSkipped } = await transformOpportunities(
    allRaw,
    existingHashSet
  )

  // Load into DB
  const { loaded, errors: loadErrors } = await loadOpportunities(
    scrapeJobId,
    transformed
  )

  const totalErrors = errors + loadErrors

  // Update job status
  await admin
    .from('scrape_jobs')
    .update({
      status: totalErrors > 0 && loaded === 0 ? 'failed' : 'completed',
      result_count: loaded,
      error_message: totalErrors > 0 ? `${totalErrors} errors during scraping` : null,
    })
    .eq('id', scrapeJobId)

  return {
    totalScraped: allRaw.length,
    totalLoaded: loaded,
    duplicatesSkipped,
    errors: totalErrors,
    sourceBreakdown,
  }
}

/**
 * Get all registered scrapers (for display/debugging).
 */
export function getRegisteredScrapers() {
  return SCRAPERS.map((s) => ({ name: s.name, sourceId: s.sourceId }))
}
