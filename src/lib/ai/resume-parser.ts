import { extractSkillsFromText } from './skill-extractor'
import type { ParsedResume } from '@/types'

/**
 * Parse a PDF buffer and extract text + skills.
 * Uses pdf-parse for text extraction and OpenAI for skill extraction.
 */
export async function parseResume(pdfBuffer: Buffer): Promise<ParsedResume> {
  // Dynamically import pdf-parse to avoid issues with Next.js bundler
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')

  let rawText = ''

  try {
    const data = await pdfParse(pdfBuffer)
    rawText = data.text ?? ''
  } catch (error) {
    console.error('[resume-parser] PDF parse error:', error)
    throw new Error('Failed to extract text from PDF. Ensure the file is a valid, non-encrypted PDF.')
  }

  if (!rawText || rawText.trim().length < 50) {
    throw new Error('Could not extract meaningful text from the PDF. It may be scanned or image-based.')
  }

  // Extract skills using AI
  const skillResults = await extractSkillsFromText(rawText, 'resume')

  const extractedSkills = skillResults.map((r) => r.skill)
  const confidence: Record<string, number> = {}
  skillResults.forEach((r) => {
    confidence[r.skill] = r.confidence
  })

  return {
    rawText,
    extractedSkills,
    confidence,
  }
}
