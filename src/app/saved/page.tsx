'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Bookmark, ExternalLink, MapPin, Calendar, Building,
  Trash2, Search, Filter
} from 'lucide-react'
import { format } from 'date-fns'

interface SavedEntry {
  id: string
  notes: string | null
  saved_at: string
  opportunities: {
    id: string
    title: string
    description: string | null
    url: string
    location: string | null
    deadline: string | null
    stipend: string | null
    organizations: { id: string; name: string } | null
    opportunity_types: { id: string; name: string } | null
    opportunity_skills: { skills: { id: number; name: string } | null }[]
  } | null
}

export default function SavedPage() {
  const [saved, setSaved] = useState<SavedEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('')
  const [search, setSearch] = useState('')

  const fetchSaved = useCallback(async () => {
    const res = await fetch('/api/saved')
    const data = await res.json()
    if (data.data) setSaved(data.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchSaved() }, [fetchSaved])

  const handleUnsave = async (savedId: string) => {
    setSaved((prev) => prev.filter((s) => s.id !== savedId))
    await fetch(`/api/saved/${savedId}`, { method: 'DELETE' })
  }

  const filtered = saved.filter((s) => {
    const opp = s.opportunities
    if (!opp) return false
    if (filterType && opp.opportunity_types?.name !== filterType) return false
    if (search && !opp.title.toLowerCase().includes(search.toLowerCase()) &&
        !opp.organizations?.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const types = [...new Set(saved.map((s) => s.opportunities?.opportunity_types?.name).filter(Boolean))]

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Bookmark size={26} color="var(--color-accent)" /> Saved Opportunities
            </h1>
            <p>{saved.length} opportunities saved</p>
          </div>
          <Link href="/search" className="btn btn-primary">
            <Search size={16} /> Find More
          </Link>
        </div>
      </div>

      {/* Filters */}
      {saved.length > 0 && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-3)', pointerEvents: 'none' }} />
            <input
              id="saved-search"
              type="text"
              className="input"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search saved…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {types.length > 1 && (
            <select
              id="saved-filter-type"
              className="input"
              style={{ width: 'auto', minWidth: 160, background: 'var(--color-surface)' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">All Types</option>
              {types.map((t) => <option key={t}>{t}</option>)}
            </select>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card" style={{ height: 120 }}>
              <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-lg)', margin: '-1.5rem' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Bookmark size={56} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            {saved.length === 0 ? 'No Saved Opportunities' : 'No Results'}
          </h3>
          <p style={{ maxWidth: 360 }}>
            {saved.length === 0
              ? 'When you find opportunities you like, save them here for easy access.'
              : 'Try adjusting your filters.'}
          </p>
          {saved.length === 0 && (
            <Link href="/search" className="btn btn-primary" style={{ marginTop: '1.25rem' }}>
              <Search size={16} /> Start Searching
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((entry) => {
            const opp = entry.opportunities
            if (!opp) return null

            const skills = opp.opportunity_skills?.map((os) => os.skills).filter(Boolean) ?? []

            return (
              <div key={entry.id} className="card opp-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                      <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>{opp.title}</h3>
                      {opp.opportunity_types && (
                        <span className="badge badge-primary">{opp.opportunity_types.name}</span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-text-2)', flexWrap: 'wrap' }}>
                      {opp.organizations && <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Building size={13} />{opp.organizations.name}</span>}
                      {opp.location && <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><MapPin size={13} />{opp.location}</span>}
                      {opp.deadline && <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}><Calendar size={13} />Deadline: {format(new Date(opp.deadline), 'MMM d, yyyy')}</span>}
                      {opp.stipend && <span style={{ color: '#10b981', fontWeight: 600 }}>{opp.stipend}</span>}
                    </div>

                    {opp.description && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-2)', marginTop: '0.625rem', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {opp.description}
                      </p>
                    )}

                    {skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.875rem' }}>
                        {skills.slice(0, 5).map((skill) => skill && (
                          <span key={skill.id} className="badge badge-neutral">{skill.name}</span>
                        ))}
                        {skills.length > 5 && <span className="badge badge-neutral">+{skills.length - 5}</span>}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                      <a href={opp.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                        Apply <ExternalLink size={12} />
                      </a>
                      <button
                        onClick={() => handleUnsave(entry.id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#fca5a5' }}
                      >
                        <Trash2 size={13} /> Remove
                      </button>
                      <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-3)', marginLeft: 'auto' }}>
                        Saved {format(new Date(entry.saved_at), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
