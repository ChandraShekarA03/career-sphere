import * as cheerio from 'cheerio'
import type { Scraper, ScrapedOpportunity } from '../types'

/**
 * Internshala scraper – uses Cheerio to parse the public search results page.
 * 
 * NOTE: Internshala's HTML structure may change. This scraper targets the
 * public listing page for internships. If scraping fails, check the selectors.
 */
export class InternshalasScraper implements Scraper {
  name = 'Internshala'
  sourceId = 'internshala'

  async scrape(query: string): Promise<ScrapedOpportunity[]> {
    const opportunities: ScrapedOpportunity[] = []

    try {
      // Encode query for URL
      const encodedQuery = encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))
      const url = `https://internshala.com/internships/keywords-${encodedQuery}/`

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(4_000),
      })

      if (!response.ok) {
        console.warn(`[internshala] HTTP ${response.status} for query: ${query}`)
        return []
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Parse each internship card
      $('.individual_internship').each((_, el) => {
        try {
          const $el = $(el)

          const title = $el.find('.profile').text().trim()
          const organization = $el.find('.company_name a').first().text().trim() ||
                              $el.find('.company_name').text().trim()
          const location = $el.find('.location_link').text().trim() ||
                          $el.find('.location').text().trim() || 'Remote'
          const stipend = $el.find('.stipend').text().trim()
          const duration = $el.find('.other_detail_item').first().text().trim()
          const relUrl = $el.find('a.view_detail_button').attr('href') ||
                        $el.find('.profile a').attr('href') || ''
          const url = relUrl.startsWith('http') ? relUrl : `https://internshala.com${relUrl}`
          const description = $el.find('.internship_other_details_container').text().trim()

          if (!title || !url || url === 'https://internshala.com') return

          opportunities.push({
            title,
            organization: organization || 'Unknown Company',
            description: description || `${title} internship at ${organization}`,
            location,
            url,
            stipend: stipend || undefined,
            duration: duration || undefined,
            skills: [],
            opportunityType: 'Internship',
            source: this.sourceId,
          })
        } catch (err) {
          console.warn('[internshala] Error parsing card:', err)
        }
      })
    } catch (error) {
      console.error('[internshala] Scrape error:', error)
    }

    return opportunities.slice(0, 20) // cap at 20 results
  }
}
