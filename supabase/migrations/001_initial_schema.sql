-- ============================================================
-- CareerSphere AI – Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for similarity search / dedup

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT,
  bio           TEXT,
  degree        TEXT,
  institution   TEXT,
  graduation_year INT,
  interests     TEXT[],
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- opportunity_types  (lookup – not hardcoded)
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunity_types (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE
);

-- ============================================================
-- organizations
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  website    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name)
);

-- ============================================================
-- scrape_jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query      TEXT NOT NULL,
  filters    JSONB,          -- stores type, location, deadline filters
  status     TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','running','completed','failed')),
  result_count INT DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days')
);

-- ============================================================
-- opportunities
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scrape_job_id       UUID NOT NULL REFERENCES scrape_jobs(id) ON DELETE CASCADE,
  organization_id     UUID REFERENCES organizations(id),
  opportunity_type_id INT REFERENCES opportunity_types(id),
  title               TEXT NOT NULL,
  description         TEXT,
  url                 TEXT NOT NULL,
  location            TEXT,
  deadline            DATE,
  stipend             TEXT,
  duration            TEXT,
  is_archived         BOOLEAN NOT NULL DEFAULT FALSE,
  source              TEXT,             -- which scraper found this
  url_hash            TEXT,             -- SHA256 of normalized URL for dedup
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(url_hash)
);

CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for archiving queries
CREATE INDEX idx_opportunities_expires ON scrape_jobs(expires_at);
CREATE INDEX idx_opportunities_scrape_job ON opportunities(scrape_job_id);
CREATE INDEX idx_opportunities_archived ON opportunities(is_archived);
CREATE INDEX idx_opportunities_title_trgm ON opportunities USING gin(title gin_trgm_ops);

-- ============================================================
-- skills
-- ============================================================
CREATE TABLE IF NOT EXISTS skills (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  category     TEXT,            -- e.g. 'programming', 'soft', 'tool'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- opportunity_skills (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunity_skills (
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  skill_id       INT  NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  PRIMARY KEY (opportunity_id, skill_id)
);

-- ============================================================
-- user_skills
-- ============================================================
CREATE TABLE IF NOT EXISTS user_skills (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id   INT  NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level      TEXT CHECK (level IN ('beginner','intermediate','advanced','expert')),
  added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id)
);

-- ============================================================
-- resumes
-- ============================================================
CREATE TABLE IF NOT EXISTS resumes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path     TEXT NOT NULL,           -- Supabase Storage path
  file_name     TEXT NOT NULL,
  file_size     INT,
  extracted_text TEXT,                   -- Raw extracted text from PDF
  parse_status  TEXT NOT NULL DEFAULT 'pending'
                CHECK (parse_status IN ('pending','processing','completed','failed')),
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resumes_user ON resumes(user_id);

-- ============================================================
-- resume_skills
-- ============================================================
CREATE TABLE IF NOT EXISTS resume_skills (
  resume_id  UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  skill_id   INT  NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  confidence NUMERIC(3,2),     -- 0.00-1.00 confidence score from AI
  PRIMARY KEY (resume_id, skill_id)
);

-- ============================================================
-- recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS recommendations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  score           NUMERIC(5,2) NOT NULL,      -- 0-100 match score
  matched_skills  INT[],                       -- array of skill IDs that matched
  missing_skills  INT[],                       -- array of skill IDs that are missing
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id, score DESC);

-- ============================================================
-- saved_opportunities
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_opportunities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  notes           TEXT,
  saved_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, opportunity_id)
);

CREATE INDEX idx_saved_user ON saved_opportunities(user_id, saved_at DESC);
