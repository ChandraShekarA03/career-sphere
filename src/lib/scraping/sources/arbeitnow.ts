import type { Scraper, ScrapedOpportunity } from '../types'

/**
 * Arbeitnow API scraper.
 * A reliable JSON API that provides remote and European job postings.
 * It's free and does not require an API key.
 */
export class ArbeitnowScraper implements Scraper {
  name = 'Arbeitnow'
  sourceId = 'arbeitnow'

  async scrape(query: string): Promise<ScrapedOpportunity[]> {
    const opportunities: ScrapedOpportunity[] = []
    const q = query.toLowerCase()

    try {
      const response = await fetch('https://www.arbeitnow.com/api/job-board-api', {
        headers: {
          'User-Agent': 'CareerSphere-App/1.0',
        },
        signal: AbortSignal.timeout(4_000),
      })

      if (!response.ok) return []

      const json = await response.json()
      if (!json.data || !Array.isArray(json.data)) return []

      for (const job of json.data) {
        const title = (job.title || '').toLowerCase()
        const desc = (job.description || '').toLowerCase()
        
        // Filter by query since Arbeitnow API doesn't support a search parameter natively
        if (q && !title.includes(q) && !desc.includes(q)) continue

        opportunities.push({
          title: job.title,
          organization: job.company_name || 'Unknown',
          description: job.description?.replace(/<[^>]+>/g, '').slice(0, 300) + '...',
          location: job.location || (job.remote ? 'Remote' : 'Unspecified'),
          url: job.url,
          opportunityType: 'Job',
          source: this.sourceId,
          skills: job.tags || [],
        })

        if (opportunities.length >= 15) break // Cap results
      }
    } catch (error) {
      console.error('[arbeitnow] Scrape error:', error)
    }

    return opportunities
  }
}
