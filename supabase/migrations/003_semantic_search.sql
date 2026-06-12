-- ============================================================
-- CareerSphere AI – Semantic Search
-- ============================================================

-- 1. Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add an embedding column to the opportunities table
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 3. Create an HNSW index for lightning-fast approximate nearest neighbor search using cosine similarity
CREATE INDEX IF NOT EXISTS idx_opportunities_embedding 
ON opportunities USING hnsw (embedding vector_cosine_ops);

-- 4. Create a function to perform vector similarity search
-- It takes a 1536-dimensional query vector and returns matching opportunities
CREATE OR REPLACE FUNCTION match_opportunities (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_job_id uuid DEFAULT null
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  url text,
  location text,
  deadline date,
  stipend text,
  duration text,
  is_archived boolean,
  scrape_job_id uuid,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.title,
    o.description,
    o.url,
    o.location,
    o.deadline,
    o.stipend,
    o.duration,
    o.is_archived,
    o.scrape_job_id,
    o.created_at,
    1 - (o.embedding <=> query_embedding) AS similarity
  FROM opportunities o
  WHERE 
    -- 1 - cosine_distance = similarity
    -- We only want rows where cosine_distance is less than (1 - match_threshold)
    (o.embedding <=> query_embedding) < 1 - match_threshold
    AND (filter_job_id IS NULL OR o.scrape_job_id = filter_job_id)
    AND o.is_archived = false
  ORDER BY o.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
