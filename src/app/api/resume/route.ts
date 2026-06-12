import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { parseResume } from '@/lib/ai/resume-parser'
import { rateLimit, rateLimitKeys } from '@/lib/rate-limit'

export const maxDuration = 60 // allow up to 60s for PDF processing

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limit resume uploads: 3 per hour
  const rl = rateLimit(rateLimitKeys.resume(user.id), { limit: 3, windowMs: 3_600_000 })
  if (!rl.allowed) {
    return Response.json({ error: 'Too many resume uploads. Try again later.' }, { status: 429 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.type !== 'application/pdf') {
    return Response.json({ error: 'Only PDF files are supported' }, { status: 400 })
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return Response.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
  }

  // Upload to Supabase Storage
  const filePath = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(filePath, file, { contentType: 'application/pdf', upsert: false })

  if (uploadError) {
    return Response.json({ error: 'Failed to upload file' }, { status: 500 })
  }

  // Create resume record
  const { data: resume, error: resumeError } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      parse_status: 'processing',
    })
    .select()
    .single()

  if (resumeError || !resume) {
    return Response.json({ error: 'Failed to create resume record' }, { status: 500 })
  }

  // Parse resume synchronously to prevent Next.js from killing the background task
  const admin = createAdminClient()

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = await parseResume(buffer)

    // Update resume with extracted text
    await admin
      .from('resumes')
      .update({ extracted_text: parsed.rawText, parse_status: 'completed' })
      .eq('id', resume.id)

    // Upsert skills into skills table and link to resume
    for (const skillName of parsed.extractedSkills) {
      if (!skillName.trim()) continue

      const { data: skill } = await admin
        .from('skills')
        .upsert({ name: skillName.trim() }, { onConflict: 'name' })
        .select('id')
        .single()

      if (skill) {
        await admin.from('resume_skills').upsert(
          {
            resume_id: resume.id,
            skill_id: skill.id,
            confidence: parsed.confidence[skillName] ?? null,
          },
          { onConflict: 'resume_id,skill_id' }
        )

        // Also add to user_skills if not already present
        await admin.from('user_skills').upsert(
          { user_id: user.id, skill_id: skill.id },
          { onConflict: 'user_id,skill_id' }
        )
      }
    }
  } catch (err) {
    console.error('[api/resume] Parse error:', err)
    await admin
      .from('resumes')
      .update({ parse_status: 'failed' })
      .eq('id', resume.id)
  }

  return Response.json(
    {
      data: {
        resumeId: resume.id,
        status: 'completed',
        message: 'Resume uploaded and skills extracted successfully.',
      },
    },
    { status: 200 }
  )
}

export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: resumes, error } = await supabase
    .from('resumes')
    .select(`
      *,
      resume_skills(skill_id, confidence, skills(id, name, category))
    `)
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  if (error) {
    return Response.json({ error: 'Failed to fetch resumes' }, { status: 500 })
  }

  return Response.json({ data: resumes ?? [] })
}
