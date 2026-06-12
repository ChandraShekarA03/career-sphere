'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Search, Bookmark, FileText, User,
  LogOut, Sparkles, ChevronRight, Bell
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/resume', label: 'Resume', icon: FileText },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/profile', label: 'Profile', icon: User },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="glass-strong"
        style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--color-border)',
          padding: '1.5rem 0',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '0 1.25rem', marginBottom: '2rem' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={17} color="#fff" />
            </div>
            <span style={{ fontSize: '1.0625rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Career<span className="gradient-text">Sphere</span>
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.9375rem',
                  fontWeight: active ? 600 : 400,
                  color: active ? '#fff' : 'var(--color-text-2)',
                  background: active ? 'var(--gradient-primary)' : 'transparent',
                  boxShadow: active ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                  transition: 'all var(--transition-fast)',
                  textDecoration: 'none',
                }}
              >
                <item.icon size={18} />
                {item.label}
                {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />}
              </Link>
            )
          })}
        </nav>

        {/* Bottom actions */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.875rem',
              width: '100%',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9375rem',
              color: 'var(--color-text-2)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'color var(--transition-fast), background var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.color = '#fca5a5'
              el.style.background = 'rgba(239,68,68,0.08)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.color = 'var(--color-text-2)'
              el.style.background = 'none'
            }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────── */}
      <main style={{ background: 'var(--color-bg)', overflowY: 'auto' }}>
        {/* Top bar */}
        <div
          className="glass"
          style={{
            position: 'sticky', top: 0, zIndex: 10,
            padding: '0 2rem', height: '56px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-3)' }}>
              {NAV_ITEMS.find((n) => pathname === n.href || (n.href !== '/dashboard' && pathname.startsWith(n.href)))?.label ?? 'Dashboard'}
            </span>
          </div>
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-2)', padding: '0.25rem' }}
          >
            <Bell size={18} />
          </button>
        </div>

        {/* Page content */}
        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
