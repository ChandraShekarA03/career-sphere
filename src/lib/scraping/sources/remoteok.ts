import type { Scraper, ScrapedOpportunity } from '../types'

/**
 * RemoteOK API scraper.
 * A reliable JSON API for remote jobs.
 */
export class RemoteOKScraper implements Scraper {
  name = 'RemoteOK'
  sourceId = 'remoteok'

  async scrape(query: string): Promise<ScrapedOpportunity[]> {
    const opportunities: ScrapedOpportunity[] = []

    try {
      const encodedQuery = encodeURIComponent(query)
      const url = `https://remoteok.com/api?q=${encodedQuery}`

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(4_000),
      })

      if (!response.ok) return []

      const json = await response.json()
      if (!Array.isArray(json)) return []

      // The first object is usually legal info, real jobs start from index 1
      for (const job of json) {
        if (job.legal) continue
        
        if (!job.position || !job.url) continue

        opportunities.push({
          title: job.position,
          organization: job.company || 'Unknown',
          description: job.description?.replace(/<[^>]+>/g, '').slice(0, 300) + '...',
          location: job.location || 'Remote',
          url: job.url,
          opportunityType: 'Job',
          source: this.sourceId,
          skills: job.tags || [],
        })

        if (opportunities.length >= 15) break
      }
    } catch (error) {
      console.error('[remoteok] Scrape error:', error)
    }

    return opportunities
  }
}
