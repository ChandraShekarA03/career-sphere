/**
 * Playwright Scraper Template
 * 
 * This template is scaffolded for future use with JavaScript-rendered pages.
 * Playwright is NOT active by default to keep the dev environment lightweight.
 * 
 * To activate:
 * 1. Run: npx playwright install chromium
 * 2. Set ENABLE_PLAYWRIGHT=true in .env.local
 * 3. Extend this class for your target site
 * 
 * @example
 * ```typescript
 * const scraper = new PlaywrightScraper()
 * const results = await scraper.scrape('AI internship Bangalore')
 * ```
 */

import type { Scraper, ScrapedOpportunity } from '../types'

export class PlaywrightTemplateScraper implements Scraper {
  name = 'PlaywrightTemplate'
  sourceId = 'playwright-template'

  async scrape(query: string): Promise<ScrapedOpportunity[]> {
    if (process.env.ENABLE_PLAYWRIGHT !== 'true') {
      console.log('[playwright] Playwright is disabled. Set ENABLE_PLAYWRIGHT=true to enable.')
      return []
    }

    try {
      // Dynamic import to avoid loading Playwright in environments where it's not installed
      // @ts-ignore
      const { chromium } = await import('playwright')
      const browser = await chromium.launch({ headless: true })
      const page = await browser.newPage()

      try {
        // ── CUSTOMIZE THIS SECTION ──────────────────────────────────────
        await page.goto(`https://example.com/search?q=${encodeURIComponent(query)}`, {
          waitUntil: 'networkidle',
          timeout: 30_000,
        })

        // Wait for results to load
        await page.waitForSelector('.result-card', { timeout: 10_000 })

        const results = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('.result-card')).map((card) => ({
            title: card.querySelector('.title')?.textContent?.trim() ?? '',
            organization: card.querySelector('.org')?.textContent?.trim() ?? '',
            description: card.querySelector('.desc')?.textContent?.trim() ?? '',
            location: card.querySelector('.location')?.textContent?.trim() ?? '',
            url: (card.querySelector('a') as HTMLAnchorElement)?.href ?? '',
          }))
        })
        // ────────────────────────────────────────────────────────────────

        return results
          .filter((r: any) => r.title && r.url)
          .map((r: any) => ({
            ...r,
            skills: [],
            source: this.sourceId,
          }))
      } finally {
        await browser.close()
      }
    } catch (error) {
      console.error('[playwright] Error:', error)
      return []
    }
  }
}
