'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  User, GraduationCap, Building, Calendar, Tag, Loader2,
  CheckCircle, Save, Plus, X, AlertCircle
} from 'lucide-react'

interface Skill { id: number; name: string; category: string | null }
interface UserSkill { skill_id: number; level: string | null; skills: Skill | null }

export default function ProfilePage() {
  const [profile, setProfile] = useState({ full_name: '', bio: '', degree: '', institution: '', graduation_year: '', interests: [] as string[] })
  const [userSkills, setUserSkills] = useState<UserSkill[]>([])
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [interestInput, setInterestInput] = useState('')
  const [showSkillPicker, setShowSkillPicker] = useState(false)

  const fetchData = useCallback(async () => {
    const [profileRes, skillsRes, allSkillsRes] = await Promise.all([
      fetch('/api/auth/profile'),
      fetch('/api/user/skills'),
      fetch('/api/skills'),
    ])
    const profileData = await profileRes.json()
    const skillsData = await skillsRes.json()
    const allSkillsData = await allSkillsRes.json()

    if (profileData.data) {
      const p = profileData.data
      setProfile({
        full_name: p.full_name ?? '',
        bio: p.bio ?? '',
        degree: p.degree ?? '',
        institution: p.institution ?? '',
        graduation_year: p.graduation_year?.toString() ?? '',
        interests: p.interests ?? [],
      })
    }
    if (skillsData.data) setUserSkills(skillsData.data)
    if (allSkillsData.data) setAllSkills(allSkillsData.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...profile,
        graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : undefined,
      }),
    })

    const data = await res.json()
    if (!res.ok) setError(data.error?.formErrors?.join(', ') ?? 'Failed to save')
    else setSuccess(true)

    setSaving(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  const addSkill = async (skill: Skill) => {
    if (userSkills.find((us) => us.skill_id === skill.id)) return

    setUserSkills((prev) => [...prev, { skill_id: skill.id, level: null, skills: skill }])
    await fetch('/api/user/skills', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillIds: [skill.id] }),
    })
  }

  const removeSkill = async (skillId: number) => {
    setUserSkills((prev) => prev.filter((us) => us.skill_id !== skillId))
    await fetch(`/api/user/skills?skillId=${skillId}`, { method: 'DELETE' })
  }

  const addInterest = () => {
    const trimmed = interestInput.trim()
    if (!trimmed || profile.interests.includes(trimmed) || profile.interests.length >= 10) return
    setProfile((prev) => ({ ...prev, interests: [...prev.interests, trimmed] }))
    setInterestInput('')
  }

  const filteredAllSkills = allSkills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !userSkills.find((us) => us.skill_id === s.id)
  ).slice(0, 30)

  const skillsByCategory = userSkills.reduce<Record<string, UserSkill[]>>((acc, us) => {
    const cat = us.skills?.category ?? 'other'
    return { ...acc, [cat]: [...(acc[cat] ?? []), us] }
  }, {})

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <User size={26} color="var(--color-primary)" /> Your Profile
        </h1>
        <p>Complete your profile for better opportunity matching</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Profile form */}
        <form onSubmit={handleSave}>
          <div className="card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, paddingBottom: '0.75rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--color-primary)" /> Personal Information
            </h2>

            {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}
            {success && <div className="alert alert-success"><CheckCircle size={16} />Profile saved!</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: '0.5rem' }}>
                  Full Name
                </label>
                <input id="profile-name" type="text" className="input" value={profile.full_name} onChange={(e) => setProfile((p) => ({ ...p, full_name: e.target.value }))} placeholder="Your name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: '0.5rem' }}>
                  Graduation Year
                </label>
                <input
                  id="profile-grad-year"
                  type="number"
                  className="input"
                  value={profile.graduation_year}
                  onChange={(e) => setProfile((p) => ({ ...p, graduation_year: e.target.value }))}
                  placeholder="2026"
                  min={2020} max={2035}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: '0.5rem' }}>
                <GraduationCap size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Degree
              </label>
              <input id="profile-degree" type="text" className="input" value={profile.degree} onChange={(e) => setProfile((p) => ({ ...p, degree: e.target.value }))} placeholder="e.g. B.Tech Computer Science" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: '0.5rem' }}>
                <Building size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Institution
              </label>
              <input id="profile-institution" type="text" className="input" value={profile.institution} onChange={(e) => setProfile((p) => ({ ...p, institution: e.target.value }))} placeholder="e.g. IIT Madras" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: '0.5rem' }}>
                Bio
              </label>
              <textarea
                id="profile-bio"
                className="input"
                rows={3}
                style={{ resize: 'vertical' }}
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                placeholder="A short bio about yourself..."
              />
            </div>

            {/* Interests */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-2)', marginBottom: '0.5rem' }}>
                <Tag size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                Interests
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <input
                  id="profile-interest-input"
                  type="text"
                  className="input"
                  value={interestInput}
                  onChange={(e) => setInterestInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInterest() } }}
                  placeholder="e.g. AI, Web Dev, Robotics"
                />
                <button type="button" onClick={addInterest} className="btn btn-ghost btn-sm">
                  <Plus size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {profile.interests.map((interest) => (
                  <span key={interest} className="badge badge-accent" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                    {interest}
                    <button type="button" onClick={() => setProfile((p) => ({ ...p, interests: p.interests.filter((i) => i !== interest) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button id="profile-save" type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Skills panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.0625rem', fontWeight: 700 }}>
                Your Skills ({userSkills.length})
              </h2>
              <button
                id="add-skill-btn"
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowSkillPicker(!showSkillPicker)}
              >
                <Plus size={14} /> Add Skills
              </button>
            </div>

            {showSkillPicker && (
              <div className="animate-fade-in" style={{ marginBottom: '1rem' }}>
                <input
                  id="skill-search"
                  type="text"
                  className="input"
                  placeholder="Search skills…"
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  style={{ marginBottom: '0.75rem' }}
                />
                <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {filteredAllSkills.map((skill) => (
                    <button
                      key={skill.id}
                      type="button"
                      className="badge badge-neutral"
                      style={{ cursor: 'pointer', border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}
                      onClick={() => addSkill(skill)}
                    >
                      <Plus size={10} /> {skill.name}
                    </button>
                  ))}
                  {filteredAllSkills.length === 0 && (
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-3)', padding: '0.5rem' }}>No more skills to add</p>
                  )}
                </div>
              </div>
            )}

            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-3)', marginBottom: '0.5rem' }}>
                  {category}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {skills.map((us) => us.skills && (
                    <span
                      key={us.skill_id}
                      className={`badge ${
                        category === 'programming' ? 'badge-primary' :
                        category === 'framework' ? 'badge-accent' :
                        category === 'domain' ? 'badge-success' :
                        'badge-neutral'
                      }`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}
                    >
                      {us.skills.name}
                      <button
                        type="button"
                        onClick={() => removeSkill(us.skill_id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex', opacity: 0.7 }}
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {userSkills.length === 0 && (
              <div className="empty-state" style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem' }}>No skills yet. Add skills manually or upload your resume to auto-detect them.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
