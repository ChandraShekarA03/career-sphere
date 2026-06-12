import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Search, Bookmark, FileText, TrendingUp, Clock, Sparkles,
  ArrowRight, Brain, Target, Zap, CheckCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user data in parallel
  const [profileRes, recentJobsRes, savedCountRes, resumeRes, recommendationsRes] = await Promise.all([
    supabase.from('profiles').select('full_name, degree, institution').eq('id', user.id).single(),
    supabase.from('scrape_jobs').select('id, query, status, result_count, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('saved_opportunities').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('resumes').select('id, parse_status').eq('user_id', user.id).order('uploaded_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('recommendations').select('score').eq('user_id', user.id).order('score', { ascending: false }).limit(3),
  ])

  const profile = profileRes.data
  const recentJobs = recentJobsRes.data ?? []
  const savedCount = savedCountRes.count ?? 0
  const resume = resumeRes.data
  const recommendations = recommendationsRes.data ?? []
  const firstName = (profile?.full_name ?? user.email?.split('@')[0] ?? 'there').split(' ')[0]

  const STAT_CARDS = [
    {
      label: 'Recent Searches',
      value: recentJobs.length,
      icon: Search,
      color: '#6366f1',
      href: '/search',
    },
    {
      label: 'Saved Opportunities',
      value: savedCount,
      icon: Bookmark,
      color: '#06b6d4',
      href: '/saved',
    },
    {
      label: 'Resume Status',
      value: resume ? (resume.parse_status === 'completed' ? 'Analyzed' : 'Processing') : 'Not uploaded',
      icon: FileText,
      color: '#10b981',
      href: '/resume',
    },
    {
      label: 'Top Match Score',
      value: recommendations[0] ? `${Math.round(recommendations[0].score)}%` : 'N/A',
      icon: Target,
      color: '#f59e0b',
      href: '/search',
    },
  ]

  const QUICK_ACTIONS = [
    { label: 'Search Opportunities', icon: Search, href: '/search', color: '#6366f1', desc: 'Find internships, hackathons & more' },
    { label: 'Upload Resume', icon: FileText, href: '/resume', color: '#10b981', desc: 'Let AI extract your skills' },
    { label: 'View Saved', icon: Bookmark, href: '/saved', color: '#06b6d4', desc: 'Review your saved opportunities' },
    { label: 'Update Profile', icon: Brain, href: '/profile', color: '#8b5cf6', desc: 'Complete your career profile' },
  ]

  return (
    <div>
      {/* Welcome Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
              Welcome back, {firstName} 👋
            </h1>
            <p style={{ color: 'var(--color-text-2)' }}>
              {profile?.institution ? `${profile.institution} • ` : ''}{profile?.degree ?? 'Complete your profile to get better matches'}
            </p>
          </div>
          <Link href="/search" className="btn btn-primary">
            <Search size={16} /> New Search
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {STAT_CARDS.map((card) => (
          <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
            <div className="card card-interactive" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${card.color}20`, border: `1px solid ${card.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <card.icon size={20} color={card.color} />
              </div>
              <div>
                <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
                  {card.value}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-2)', marginTop: '0.25rem' }}>
                  {card.label}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Recent Searches */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={18} color="var(--color-primary)" /> Recent Searches
              </h2>
              <Link href="/search" style={{ fontSize: '0.875rem', color: 'var(--color-primary-2)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                New search <ArrowRight size={14} />
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <Search size={36} />
                <p style={{ fontSize: '0.9375rem' }}>No searches yet. Try &quot;AI Internship Bangalore&quot;</p>
                <Link href="/search" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                  Start Searching
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentJobs.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.875rem 1rem',
                      background: 'var(--color-bg)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: job.status === 'completed' ? '#10b981' : job.status === 'running' ? '#f59e0b' : '#ef4444', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{job.query}</div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-2)' }}>
                          {job.result_count} results • {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/search?jobId=${job.id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Opportunities */}
          {recommendations.length > 0 && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} color="#f59e0b" /> AI Recommendations
                </h2>
                <span className="badge badge-warning">
                  {recommendations.length} matches
                </span>
              </div>
              <p style={{ color: 'var(--color-text-2)', fontSize: '0.9375rem' }}>
                Based on your skills, we found opportunities with top scores of{' '}
                <strong style={{ color: '#10b981' }}>{Math.round(recommendations[0].score)}%</strong> match.
              </p>
              <Link href="/search" className="btn btn-primary btn-sm" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                View Matched Opportunities <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Actions */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={18} color="var(--color-accent)" /> Quick Actions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="card-interactive"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    transition: 'all var(--transition-fast)',
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${action.color}15`, border: `1px solid ${action.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <action.icon size={16} color={action.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{action.label}</div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-2)' }}>{action.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Profile completion */}
          {!profile?.institution && (
            <div
              className="card"
              style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                border: '1px solid rgba(99,102,241,0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                <TrendingUp size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Complete Your Profile</h3>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-2)', marginBottom: '1rem' }}>
                A complete profile helps us find better matches for you.
              </p>
              {[
                { label: 'Add your institution', done: false },
                { label: 'Set your degree', done: !!profile?.degree },
                { label: 'Upload resume', done: !!resume },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <CheckCircle size={14} color={item.done ? '#10b981' : 'var(--color-text-3)'} />
                  <span style={{ color: item.done ? '#10b981' : 'var(--color-text-2)', textDecoration: item.done ? 'line-through' : 'none' }}>
                    {item.label}
                  </span>
                </div>
              ))}
              <Link href="/profile" className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem', display: 'inline-flex' }}>
                Complete Profile
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
