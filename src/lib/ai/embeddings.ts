import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generates an OpenAI text embedding vector for the given text.
 * Uses the text-embedding-3-small model which produces 1536-dimensional vectors.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Clean up text by removing extra whitespace and newlines
  const cleanText = text.replace(/\s+/g, ' ').trim()
  
  if (!cleanText) {
    throw new Error('Cannot generate embedding for empty text')
  }

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: cleanText,
    encoding_format: 'float',
  })

  return response.data[0].embedding
}
