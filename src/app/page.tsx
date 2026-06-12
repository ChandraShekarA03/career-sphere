'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Brain, Zap, Target, BookOpen, Trophy, Users,
  ArrowRight, ChevronRight, Star, Globe, Shield,
  Sparkles, Search, BarChart3, CheckCircle
} from 'lucide-react'

const FEATURES = [
  {
    icon: Search,
    title: 'Smart Opportunity Search',
    description: 'Search across internships, scholarships, hackathons, and fellowships from multiple sources simultaneously.',
    color: '#6366f1',
  },
  {
    icon: Brain,
    title: 'AI Skill Extraction',
    description: 'Upload your resume and our AI automatically extracts your skills, building an intelligent career profile.',
    color: '#8b5cf6',
  },
  {
    icon: Target,
    title: 'Precision Matching',
    description: 'Get match scores for every opportunity based on your skills, showing exactly what you have and what you need.',
    color: '#06b6d4',
  },
  {
    icon: Zap,
    title: 'Real-time Scraping',
    description: 'Fresh opportunities scraped from Internshala, Unstop, Devfolio, and more — always up to date.',
    color: '#f59e0b',
  },
  {
    icon: BarChart3,
    title: 'Career Analytics',
    description: 'Understand your skill gaps, track your saved opportunities, and get personalized recommendations.',
    color: '#10b981',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your resume and career data are encrypted and private. Row-level security ensures only you see your data.',
    color: '#ef4444',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Create Your Profile', desc: 'Sign up and build your career profile with your degree, interests, and skills.' },
  { step: '02', title: 'Upload Your Resume', desc: 'Our AI reads your PDF and automatically extracts all your skills and experience.' },
  { step: '03', title: 'Search Opportunities', desc: 'Type a query like "AI internship Bangalore" — we scrape the web in real-time.' },
  { step: '04', title: 'Get Matched', desc: 'Every result shows a match score. Save the best ones and track your applications.' },
]

const STATS = [
  { value: '10+', label: 'Opportunity Sources' },
  { value: '50+', label: 'Skill Categories' },
  { value: 'AI', label: 'Powered Matching' },
  { value: 'Free', label: 'To Get Started' },
]

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', overflow: 'hidden' }}>
      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav
        className="glass"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '0 2rem',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background var(--transition-base)',
          background: scrollY > 20 ? 'rgba(8,13,26,0.9)' : 'transparent',
          backdropFilter: scrollY > 20 ? 'blur(16px)' : 'none',
          borderBottom: scrollY > 20 ? '1px solid var(--color-border)' : '1px solid transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Sparkles size={18} color="#fff" />
          </div>
          <span style={{ fontSize: '1.125rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Career<span className="gradient-text">Sphere</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/login" className="btn btn-ghost btn-sm">Log in</Link>
          <Link href="/register" className="btn btn-primary btn-sm">
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="hero-mesh"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '7rem 1.5rem 4rem',
          position: 'relative',
        }}
      >
        {/* Floating orbs */}
        <div style={{
          position: 'absolute', top: '20%', left: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float 6s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', right: '10%',
          width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.12), transparent 70%)',
          filter: 'blur(40px)',
          animation: 'float 8s ease-in-out infinite reverse',
          pointerEvents: 'none',
        }} />

        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1, maxWidth: 760 }}>
          {/* Pill badge */}
          <div
            className="badge badge-primary"
            style={{ display: 'inline-flex', marginBottom: '1.5rem', fontSize: '0.8125rem' }}
          >
            <Sparkles size={12} />
            AI-Powered Career Intelligence
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: '1.5rem',
            }}
          >
            Discover Your{' '}
            <span className="gradient-text">Perfect Career</span>
            {' '}Opportunity
          </h1>

          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'var(--color-text-2)',
              lineHeight: 1.7,
              marginBottom: '2.5rem',
              maxWidth: 600,
              margin: '0 auto 2.5rem',
            }}
          >
            CareerSphere AI scrapes internships, scholarships, hackathons, and fellowships
            from across the web — then matches them to{' '}
            <em style={{ color: 'var(--color-text)', fontStyle: 'normal', fontWeight: 600 }}>your exact skills</em>.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" className="btn btn-primary btn-lg">
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link href="/login" className="btn btn-ghost btn-lg">
              Sign In <ChevronRight size={18} />
            </Link>
          </div>

          {/* Social proof */}
          <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--color-text-2)', fontSize: '0.875rem' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
            ))}
            <span>Trusted by students across India</span>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section style={{ padding: '4rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.5rem',
        }}>
          {STATS.map((stat) => (
            <div key={stat.label} className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, background: 'var(--gradient-hero)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {stat.value}
              </div>
              <div style={{ color: 'var(--color-text-2)', marginTop: '0.25rem', fontSize: '0.9375rem' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-accent" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            <Globe size={12} /> Core Features
          </div>
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Everything You Need to{' '}
            <span className="gradient-text">Land Your Dream Role</span>
          </h2>
          <p style={{ color: 'var(--color-text-2)', maxWidth: 560, margin: '0 auto', fontSize: '1.0625rem' }}>
            From scraping to matching to saving — the complete career intelligence stack in one platform.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card card-interactive" style={{ padding: '2rem' }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: `${feature.color}20`,
                  border: `1px solid ${feature.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1.25rem',
                }}
              >
                <feature.icon size={22} color={feature.color} />
              </div>
              <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.625rem' }}>
                {feature.title}
              </h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: '0.9375rem', lineHeight: 1.65 }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', background: 'var(--color-bg-2)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="badge badge-primary" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
              <BookOpen size={12} /> How It Works
            </div>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              From <span className="gradient-text">Zero to Matched</span> in Minutes
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '2rem' }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} style={{ position: 'relative' }}>
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{
                    position: 'absolute', top: 28, left: 'calc(100% - 0px)', width: '2rem',
                    height: 2, background: 'var(--gradient-primary)',
                    display: 'none', // Hidden on mobile
                  }} />
                )}
                <div
                  style={{
                    fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)',
                    letterSpacing: '0.1em', marginBottom: '0.75rem',
                  }}
                >
                  STEP {step.step}
                </div>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 800, color: '#fff',
                }}>
                  {step.step}
                </div>
                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {step.title}
                </h3>
                <p style={{ color: 'var(--color-text-2)', fontSize: '0.9375rem', lineHeight: 1.65 }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Opportunity Types ─────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <div className="badge badge-success" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
          <Trophy size={12} /> Opportunity Types
        </div>
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '2rem' }}>
          All Types, One Platform
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
          {['Internship', 'Scholarship', 'Hackathon', 'Fellowship', 'Competition', 'Research Program', 'Grant', 'Bootcamp'].map((type) => (
            <div key={type} className="badge badge-primary" style={{ fontSize: '0.9375rem', padding: '0.5rem 1.25rem' }}>
              <CheckCircle size={14} /> {type}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div
          style={{
            maxWidth: 780,
            margin: '0 auto',
            textAlign: 'center',
            padding: '4rem 2rem',
            borderRadius: 'var(--radius-xl)',
            background: 'var(--gradient-primary)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.1), transparent 60%)',
          }} />
          <Users size={40} color="rgba(255,255,255,0.8)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: '1rem', position: 'relative' }}>
            Ready to Find Your Next Opportunity?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '2rem', fontSize: '1.0625rem', position: 'relative' }}>
            Join thousands of students using AI to discover and land their dream opportunities.
          </p>
          <Link
            href="/register"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              background: '#fff', color: '#6366f1',
              padding: '0.875rem 2rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700, fontSize: '1.0625rem',
              position: 'relative',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            }}
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer
        style={{
          padding: '2rem 1.5rem',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          color: 'var(--color-text-3)',
          fontSize: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <div style={{ width: 20, height: 20, borderRadius: 4, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={11} color="#fff" />
          </div>
          <span style={{ fontWeight: 700 }}>CareerSphere AI</span>
        </div>
        <p>© {new Date().getFullYear()} CareerSphere AI. Built to accelerate careers.</p>
      </footer>
    </div>
  )
}
