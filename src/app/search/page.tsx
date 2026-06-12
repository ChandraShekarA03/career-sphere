'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search, Filter, Loader2, MapPin, Calendar, Clock,
  Building, ExternalLink, Bookmark, BookmarkCheck, ChevronDown, X, Sparkles
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface Opportunity {
  id: string
  title: string
  description: string | null
  url: string
  location: string | null
  deadline: string | null
  stipend: string | null
  is_archived: boolean
  organizations: { id: string; name: string } | null
  opportunity_types: { id: string; name: string } | null
  opportunity_skills: { skills: { id: number; name: string; category: string } | null }[]
  match_score?: number
}

const OPPORTUNITY_TYPES = ['Internship', 'Scholarship', 'Hackathon', 'Fellowship', 'Competition', 'Research Program']

function SearchContent() {
  const searchParams = useSearchParams()
  const initialJobId = searchParams.get('jobId')

  const [query, setQuery] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterLocation, setFilterLocation] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const [loading, setLoading] = useState(false)
  const [polling, setPolling] = useState(false)
  const [currentJobId, setCurrentJobId] = useState(initialJobId)
  const [jobStatus, setJobStatus] = useState<string | null>(null)
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Load opportunities for a job
  const loadOpportunities = useCallback(async (jobId: string, p = 1) => {
    const params = new URLSearchParams({ jobId, page: String(p), pageSize: '20' })
    if (filterType) params.set('type', filterType)
    if (filterLocation) params.set('location', filterLocation)

    const res = await fetch(`/api/opportunities?${params}`)
    const data = await res.json()
    if (data.data) {
      setOpportunities(p === 1 ? data.data : (prev) => [...prev, ...data.data])
      setTotalPages(data.totalPages)
    }
  }, [filterType, filterLocation])

  // Poll job status
  useEffect(() => {
    if (!currentJobId || !polling) return

    const interval = setInterval(async () => {
      const res = await fetch(`/api/scrape/${currentJobId}`)
      const data = await res.json()
      const status = data.data?.status

      setJobStatus(status)

      if (status === 'completed' || status === 'failed') {
        setPolling(false)
        setLoading(false)
        if (status === 'completed') {
          await loadOpportunities(currentJobId, 1)
        }
        clearInterval(interval)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [currentJobId, polling, loadOpportunities])

  // Load initial job if jobId in URL
  useEffect(() => {
    if (initialJobId) {
      setCurrentJobId(initialJobId)
      loadOpportunities(initialJobId, 1)
    }
  }, [initialJobId, loadOpportunities])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    setOpportunities([])
    setPage(1)

    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: query.trim(), filters: { type: filterType || undefined, location: filterLocation || undefined } }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Failed to start search')
      setLoading(false)
      return
    }

    setCurrentJobId(data.data.jobId)
    setJobStatus('pending')
    setPolling(true)
  }

  const handleSave = async (opportunityId: string) => {
    const isSaved = savedIds.has(opportunityId)

    if (isSaved) {
      // Find saved_opportunity id and delete
      setSavedIds((prev) => { const next = new Set(prev); next.delete(opportunityId); return next })
      // TODO: implement unsave
    } else {
      setSavedIds((prev) => new Set(prev).add(opportunityId))
      await fetch('/api/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId }),
      })
    }
  }

  const getScoreStyle = (score?: number) => {
    if (!score) return { color: 'var(--color-text-3)', border: 'var(--color-border)' }
    if (score >= 75) return { color: '#10b981', border: 'rgba(16,185,129,0.4)' }
    if (score >= 50) return { color: '#f59e0b', border: 'rgba(245,158,11,0.4)' }
    return { color: '#ef4444', border: 'rgba(239,68,68,0.4)' }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Search Opportunities</h1>
        <p>Search across internships, scholarships, hackathons, and more</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
            <input
              id="search-query"
              type="text"
              className="input"
              style={{ paddingLeft: '2.75rem', height: '48px', fontSize: '1rem' }}
              placeholder='e.g. "AI internship Bangalore" or "ML scholarship 2025"'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowFilters(!showFilters)}
            style={{ height: 48 }}
          >
            <Filter size={16} /> Filters <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          <button
            id="search-submit"
            type="submit"
            className="btn btn-primary"
            style={{ height: 48, paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
            disabled={loading || !query.trim()}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="card animate-fade-in" style={{ marginTop: '0.75rem', padding: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-2)', display: 'block', marginBottom: '0.5rem' }}>
                Opportunity Type
              </label>
              <select
                id="filter-type"
                className="input"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ background: 'var(--color-bg)' }}
              >
                <option value="">All Types</option>
                {OPPORTUNITY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-2)', display: 'block', marginBottom: '0.5rem' }}>
                Location
              </label>
              <input
                id="filter-location"
                type="text"
                className="input"
                style={{ background: 'var(--color-bg)' }}
                placeholder="e.g. Bangalore, Remote"
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
              />
            </div>
            {(filterType || filterLocation) && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setFilterType(''); setFilterLocation('') }}
                style={{ alignSelf: 'flex-end' }}
              >
                <X size={14} /> Clear
              </button>
            )}
          </div>
        )}
      </form>

      {/* Status Banner */}
      {polling && (
        <div className="alert alert-info animate-fade-in" style={{ marginBottom: '1.5rem' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <div>
            <strong>Scraping in progress…</strong>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', opacity: 0.8 }}>
              Searching Internshala, Unstop, Devfolio and more. This takes 10–30 seconds.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {opportunities.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.9375rem', color: 'var(--color-text-2)' }}>
              {opportunities.length} opportunities found
            </span>
            {currentJobId && (
              <span className="badge badge-success">
                <Sparkles size={12} /> Results from live scrape
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {opportunities.map((opp) => {
              const scoreStyle = getScoreStyle(opp.match_score)
              const skills = opp.opportunity_skills?.map((os) => os.skills).filter(Boolean) ?? []
              const isSaved = savedIds.has(opp.id)

              return (
                <div key={opp.id} className="card opp-card card-interactive" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                    {/* Match score */}
                    {opp.match_score !== undefined && (
                      <div
                        style={{
                          width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                          border: `2.5px solid ${scoreStyle.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.875rem', fontWeight: 800, color: scoreStyle.color,
                        }}
                      >
                        {Math.round(opp.match_score)}%
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div>
                          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.25rem', lineHeight: 1.3 }}>
                            {opp.title}
                          </h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--color-text-2)' }}>
                            {opp.organizations && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Building size={13} /> {opp.organizations.name}
                              </span>
                            )}
                            {opp.location && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <MapPin size={13} /> {opp.location}
                              </span>
                            )}
                            {opp.deadline && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Calendar size={13} />
                                {format(new Date(opp.deadline), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          {opp.opportunity_types && (
                            <span className="badge badge-primary">{opp.opportunity_types.name}</span>
                          )}
                        </div>
                      </div>

                      {opp.description && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-2)', marginTop: '0.75rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {opp.description}
                        </p>
                      )}

                      {skills.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.875rem' }}>
                          {skills.slice(0, 6).map((skill) => skill && (
                            <span key={skill.id} className="badge badge-neutral">{skill.name}</span>
                          ))}
                          {skills.length > 6 && (
                            <span className="badge badge-neutral">+{skills.length - 6}</span>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                        <a href={opp.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                          Apply <ExternalLink size={12} />
                        </a>
                        <button
                          onClick={() => handleSave(opp.id)}
                          className={`btn btn-sm ${isSaved ? 'btn-accent' : 'btn-ghost'}`}
                        >
                          {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                          {isSaved ? 'Saved' : 'Save'}
                        </button>
                        {opp.stipend && (
                          <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
                            {opp.stipend}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <button
                className="btn btn-ghost"
                onClick={() => {
                  const next = page + 1
                  setPage(next)
                  if (currentJobId) loadOpportunities(currentJobId, next)
                }}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty state after search */}
      {!loading && !polling && currentJobId && opportunities.length === 0 && jobStatus === 'completed' && (
        <div className="empty-state">
          <Search size={48} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>No results found</h3>
          <p>Try a different search query or adjust your filters.</p>
        </div>
      )}

      {/* Initial empty state */}
      {!currentJobId && !loading && (
        <div className="empty-state">
          <Search size={56} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Search for Opportunities</h3>
          <p style={{ maxWidth: 440 }}>
            Type a query above to discover internships, scholarships, hackathons, and more from across the web.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem' }}>
            {['AI Internship Bangalore', 'ML scholarship 2025', 'Hackathon India 2025', 'Research fellowship IIT'].map((s) => (
              <button
                key={s}
                className="badge badge-primary"
                style={{ cursor: 'pointer', border: 'none', fontSize: '0.875rem', padding: '0.5rem 1rem', background: 'rgba(99,102,241,0.1)' }}
                onClick={() => setQuery(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <React.Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    }>
      <SearchContent />
    </React.Suspense>
  )
}
