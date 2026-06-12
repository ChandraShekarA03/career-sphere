// Re-export all database types
export * from './database'

// ============================================================
// API response types
// ============================================================
export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// ============================================================
// Scraping types
// ============================================================
export interface ScrapedOpportunity {
  title: string
  organization: string
  organizationWebsite?: string
  description: string
  location: string
  deadline?: string         // ISO date string or human readable
  url: string
  skills: string[]          // raw skill strings
  stipend?: string
  duration?: string
  opportunityType?: string  // maps to opportunity_types.name
  source: string            // scraper identifier
}

export interface ScrapeFilters {
  type?: string
  location?: string
  deadline?: string
}

export interface ScrapeRequest {
  query: string
  filters?: ScrapeFilters
}

// ============================================================
// Matching types
// ============================================================
export interface MatchResult {
  score: number             // 0–100
  matchedSkillIds: number[]
  missingSkillIds: number[]
  matchedSkills: import('./database').Skill[]
  missingSkills: import('./database').Skill[]
}

// ============================================================
// Resume parsing types
// ============================================================
export interface ParsedResume {
  rawText: string
  extractedSkills: string[]   // raw skill name strings from AI
  confidence: Record<string, number>  // skill name -> confidence 0-1
}
