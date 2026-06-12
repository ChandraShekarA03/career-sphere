import type { ScrapedOpportunity } from '@/types'

// ============================================================
// Scraper interface – every scraper must implement this
// ============================================================
export interface Scraper {
  /** Human-readable name for this scraper */
  name: string
  /** Unique identifier used as the `source` field in DB */
  sourceId: string
  /** Run the scraper and return standardized opportunities */
  scrape(query: string, filters?: Record<string, string>): Promise<ScrapedOpportunity[]>
}

export { ScrapedOpportunity }
