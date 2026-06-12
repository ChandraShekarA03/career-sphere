-- ============================================================
-- CareerSphere AI – Row Level Security Policies
-- ============================================================

-- Enable RLS on all user-scoped tables
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills          ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_skills        ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_opportunities  ENABLE ROW LEVEL SECURITY;

-- Public read-only tables (no RLS needed but enable for safety)
ALTER TABLE opportunity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills            ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_skills ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- profiles
-- ============================================================
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- scrape_jobs
-- ============================================================
CREATE POLICY "Users can view own scrape jobs"
  ON scrape_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scrape jobs"
  ON scrape_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scrape jobs"
  ON scrape_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- opportunities
-- Users can only see opportunities from their own scrape jobs
-- ============================================================
CREATE POLICY "Users can view opportunities from own jobs"
  ON opportunities FOR SELECT
  USING (
    scrape_job_id IN (
      SELECT id FROM scrape_jobs WHERE user_id = auth.uid()
    )
  );

-- Only service role can insert/update opportunities (via API)
CREATE POLICY "Service role can manage opportunities"
  ON opportunities FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- opportunity_types – public read
-- ============================================================
CREATE POLICY "Anyone can read opportunity types"
  ON opportunity_types FOR SELECT
  USING (TRUE);

-- ============================================================
-- organizations – public read
-- ============================================================
CREATE POLICY "Anyone can read organizations"
  ON organizations FOR SELECT
  USING (TRUE);

-- ============================================================
-- skills – public read
-- ============================================================
CREATE POLICY "Anyone can read skills"
  ON skills FOR SELECT
  USING (TRUE);

-- ============================================================
-- opportunity_skills – readable if user has access to the opportunity
-- ============================================================
CREATE POLICY "Users can read opportunity skills for accessible opportunities"
  ON opportunity_skills FOR SELECT
  USING (
    opportunity_id IN (
      SELECT o.id FROM opportunities o
      JOIN scrape_jobs sj ON o.scrape_job_id = sj.id
      WHERE sj.user_id = auth.uid()
    )
  );

-- ============================================================
-- user_skills
-- ============================================================
CREATE POLICY "Users can view own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own skills"
  ON user_skills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skills"
  ON user_skills FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- resumes
-- ============================================================
CREATE POLICY "Users can view own resumes"
  ON resumes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes"
  ON resumes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON resumes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON resumes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- resume_skills
-- ============================================================
CREATE POLICY "Users can view own resume skills"
  ON resume_skills FOR SELECT
  USING (
    resume_id IN (
      SELECT id FROM resumes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage resume skills"
  ON resume_skills FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- recommendations
-- ============================================================
CREATE POLICY "Users can view own recommendations"
  ON recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage recommendations"
  ON recommendations FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================
-- saved_opportunities
-- ============================================================
CREATE POLICY "Users can view own saved opportunities"
  ON saved_opportunities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save opportunities"
  ON saved_opportunities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved opportunities"
  ON saved_opportunities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved opportunities"
  ON saved_opportunities FOR DELETE
  USING (auth.uid() = user_id);
