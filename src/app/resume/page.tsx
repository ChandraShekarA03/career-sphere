'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Upload, FileText, CheckCircle, XCircle, Loader2, AlertCircle,
  Brain, Zap, RefreshCw, Trash2
} from 'lucide-react'

interface Skill {
  id: number
  name: string
  category: string | null
}

interface ResumeRecord {
  id: string
  file_name: string
  file_size: number | null
  parse_status: 'pending' | 'processing' | 'completed' | 'failed'
  uploaded_at: string
  resume_skills: { skill_id: number; confidence: number | null; skills: Skill | null }[]
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<ResumeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [polling, setPolling] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25)

  const fetchResumes = useCallback(async () => {
    const res = await fetch('/api/resume')
    const data = await res.json()
    if (data.data) setResumes(data.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchResumes() }, [fetchResumes])

  // Poll if any resume is processing
  useEffect(() => {
    const hasProcessing = resumes.some((r) => r.parse_status === 'processing' || r.parse_status === 'pending')
    if (!hasProcessing) { setPolling(false); return }

    setPolling(true)
    const interval = setInterval(fetchResumes, 3000)
    return () => clearInterval(interval)
  }, [resumes, fetchResumes])

  // Countdown timer for processing UI
  useEffect(() => {
    if (!polling) return
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [polling])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploading(true)
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/resume', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Upload failed')
    } else {
      setTimeLeft(25)
      setSuccess('Resume uploaded! Extracting skills with AI…')
      await fetchResumes()
    }

    setUploading(false)
  }, [fetchResumes])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  })

  const latestResume = resumes[0]
  const skills = latestResume?.resume_skills?.map((rs) => rs.skills).filter(Boolean) as Skill[] | undefined

  const skillsByCategory = skills?.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category ?? 'other'
    return { ...acc, [cat]: [...(acc[cat] ?? []), skill] }
  }, {}) ?? {}

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Brain size={28} color="var(--color-primary)" /> Resume Analysis
        </h1>
        <p>Upload your PDF resume. Our AI will extract your skills and build your profile.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}><CheckCircle size={18} />{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Upload Zone */}
        <div>
          <div
            {...getRootProps()}
            style={{
              border: `2px dashed ${isDragActive ? 'var(--color-primary)' : 'var(--color-border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: isDragActive ? 'rgba(99,102,241,0.05)' : 'var(--color-surface)',
              transition: 'all var(--transition-base)',
            }}
          >
            <input {...getInputProps()} id="resume-upload" />
            {uploading ? (
              <div>
                <Loader2 size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontWeight: 600 }}>Uploading…</p>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    width: 72, height: 72, borderRadius: 16,
                    background: isDragActive ? 'var(--gradient-primary)' : 'rgba(99,102,241,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                    transition: 'all var(--transition-base)',
                  }}
                >
                  <Upload size={32} color={isDragActive ? '#fff' : 'var(--color-primary)'} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                  {isDragActive ? 'Drop your resume here' : 'Upload Your Resume'}
                </h3>
                <p style={{ color: 'var(--color-text-2)', fontSize: '0.9375rem', marginBottom: '1rem' }}>
                  Drag & drop or click to select
                </p>
                <p style={{ color: 'var(--color-text-3)', fontSize: '0.8125rem' }}>
                  PDF only • Max 5MB
                </p>
              </div>
            )}
          </div>

          {/* Previous resumes */}
          {resumes.length > 0 && (
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-text-2)' }}>Upload History</h3>
              {resumes.map((r) => (
                <div
                  key={r.id}
                  className="card"
                  style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.875rem' }}
                >
                  <FileText size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.file_name}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-2)' }}>
                      {r.file_size ? `${Math.round(r.file_size / 1024)}KB • ` : ''}{new Date(r.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                  {r.parse_status === 'completed' && <CheckCircle size={18} color="#10b981" />}
                  {r.parse_status === 'failed' && <XCircle size={18} color="#ef4444" />}
                  {(r.parse_status === 'processing' || r.parse_status === 'pending') && (
                    <Loader2 size={18} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills panel */}
        <div>
          {loading ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <Loader2 size={32} style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : latestResume && latestResume.parse_status === 'completed' && skills && skills.length > 0 ? (
            <div>
              {/* Skills header */}
              <div className="card" style={{ padding: '1.5rem', marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <Zap size={20} color="var(--color-primary)" />
                  <h3 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                    {skills.length} Skills Detected
                  </h3>
                  <button onClick={fetchResumes} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-3)', marginLeft: 'auto' }}>
                    <RefreshCw size={14} />
                  </button>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-2)' }}>
                  These skills have been added to your profile and will be used for matching.
                </p>
              </div>

              {/* Skills by category */}
              {Object.entries(skillsByCategory).map(([category, catSkills]) => (
                <div key={category} className="card" style={{ padding: '1.25rem', marginBottom: '0.875rem' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-2)', marginBottom: '0.875rem' }}>
                    {category}
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {catSkills.map((skill) => (
                      <span
                        key={skill.id}
                        className={`badge ${
                          category === 'programming' ? 'badge-primary' :
                          category === 'framework' ? 'badge-accent' :
                          category === 'domain' ? 'badge-success' :
                          category === 'tool' ? 'badge-warning' :
                          'badge-neutral'
                        }`}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : latestResume && (latestResume.parse_status === 'processing' || latestResume.parse_status === 'pending') ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', animation: 'pulseGlow 2s ease-in-out infinite' }}>
                <Brain size={28} color="var(--color-primary)" />
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Processing…</h3>
              <p style={{ color: 'var(--color-text-2)', fontSize: '0.9375rem' }}>
                Extracting skills from your resume. Estimated time remaining: <strong style={{ color: 'var(--color-primary)' }}>{timeLeft > 0 ? `${timeLeft}s` : 'almost done...'}</strong>
              </p>
            </div>
          ) : (
            <div className="empty-state card">
              <FileText size={40} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>No Resume Uploaded</h3>
              <p>Upload your PDF resume to extract skills and get personalized matches.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
