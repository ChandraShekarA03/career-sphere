import * as cheerio from 'cheerio'
import type { Scraper, ScrapedOpportunity } from '../types'

/**
 * Devfolio hackathon scraper.
 * Parses the public hackathon listings on devfolio.co/hackathons
 */
export class DevfolioScraper implements Scraper {
  name = 'Devfolio'
  sourceId = 'devfolio'

  async scrape(query: string): Promise<ScrapedOpportunity[]> {
    const opportunities: ScrapedOpportunity[] = []

    try {
      const url = `https://devfolio.co/hackathons`

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(4_000),
      })

      if (!response.ok) {
        console.warn(`[devfolio] HTTP ${response.status}`)
        return []
      }

      const html = await response.text()
      const $ = cheerio.load(html)
      const queryLower = query.toLowerCase()

      $('[class*="HackathonCard"], [class*="hackathon-card"], article, .card').each((_, el) => {
        try {
          const $el = $(el)

          const title = $el.find('[class*="title"], h2, h3, h4').first().text().trim()
          const description = $el.find('[class*="description"], p').first().text().trim()
          const deadline = $el.find('[class*="date"], time, [class*="deadline"]').first().text().trim()
          const relUrl = $el.find('a').first().attr('href') || ''
          const url = relUrl.startsWith('http') ? relUrl : relUrl ? `https://devfolio.co${relUrl}` : ''

          if (!title || !url || title.length < 3) return

          // Filter by query relevance
          const combined = (title + description).toLowerCase()
          if (queryLower && !combined.includes(queryLower.split(' ')[0])) return

          opportunities.push({
            title,
            organization: 'Devfolio',
            description: description || `${title} - hackathon on Devfolio`,
            location: 'Online',
            deadline: deadline || undefined,
            url,
            skills: [],
            opportunityType: 'Hackathon',
            source: this.sourceId,
          })
        } catch (err) {
          console.warn('[devfolio] Error parsing card:', err)
        }
      })
    } catch (error) {
      console.error('[devfolio] Scrape error:', error)
    }

    return opportunities.slice(0, 15)
  }
}
