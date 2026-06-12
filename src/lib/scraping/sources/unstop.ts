import * as cheerio from 'cheerio'
import type { Scraper, ScrapedOpportunity } from '../types'

/**
 * Unstop (formerly Dare2Compete) scraper.
 * Scrapes hackathons, competitions, and fellowships from Unstop's public pages.
 */
export class UnstopScraper implements Scraper {
  name = 'Unstop'
  sourceId = 'unstop'

  async scrape(query: string): Promise<ScrapedOpportunity[]> {
    const opportunities: ScrapedOpportunity[] = []

    try {
      const encodedQuery = encodeURIComponent(query)
      const url = `https://unstop.com/opportunities?search=${encodedQuery}`

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(15_000),
      })

      if (!response.ok) {
        console.warn(`[unstop] HTTP ${response.status}`)
        return []
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Unstop renders cards with various selectors
      $('[class*="card"], [class*="opportunity"], article').each((_, el) => {
        try {
          const $el = $(el)

          const title = $el.find('[class*="title"], h2, h3').first().text().trim()
          const organization = $el.find('[class*="org"], [class*="company"], [class*="host"]').first().text().trim()
          const deadline = $el.find('[class*="deadline"], [class*="date"], time').first().text().trim()
          const location = $el.find('[class*="location"], [class*="city"]').first().text().trim() || 'Online'
          const relUrl = $el.find('a').first().attr('href') || ''
          const url = relUrl.startsWith('http') ? relUrl : relUrl ? `https://unstop.com${relUrl}` : ''

          if (!title || !url || title.length < 5) return

          opportunities.push({
            title,
            organization: organization || 'Unstop',
            description: `${title} - opportunity on Unstop`,
            location,
            deadline: deadline || undefined,
            url,
            skills: [],
            opportunityType: 'Competition',
            source: this.sourceId,
          })
        } catch (err) {
          console.warn('[unstop] Error parsing card:', err)
        }
      })
    } catch (error) {
      console.error('[unstop] Scrape error:', error)
    }

    return opportunities.slice(0, 20)
  }
}
