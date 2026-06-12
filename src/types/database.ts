export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          bio: string | null
          degree: string | null
          institution: string | null
          graduation_year: number | null
          interests: string[] | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          bio?: string | null
          degree?: string | null
          institution?: string | null
          graduation_year?: number | null
          interests?: string[] | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          bio?: string | null
          degree?: string | null
          institution?: string | null
          graduation_year?: number | null
          interests?: string[] | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      opportunity_types: {
        Row: { id: number; name: string }
        Insert: { name: string }
        Update: { name?: string }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          website: string | null
          created_at: string
        }
        Insert: { name: string; website?: string | null }
        Update: { name?: string; website?: string | null }
        Relationships: []
      }
      scrape_jobs: {
        Row: {
          id: string
          user_id: string
          query: string
          filters: Json | null
          status: 'pending' | 'running' | 'completed' | 'failed'
          result_count: number
          error_message: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          user_id: string
          query: string
          filters?: Json | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          result_count?: number
          error_message?: string | null
          expires_at?: string
        }
        Update: {
          user_id?: string
          query?: string
          filters?: Json | null
          status?: 'pending' | 'running' | 'completed' | 'failed'
          result_count?: number
          error_message?: string | null
          expires_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          id: string
          scrape_job_id: string
          organization_id: string | null
          opportunity_type_id: number | null
          title: string
          description: string | null
          url: string
          location: string | null
          deadline: string | null
          stipend: string | null
          duration: string | null
          is_archived: boolean
          source: string | null
          url_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          scrape_job_id: string
          organization_id?: string | null
          opportunity_type_id?: number | null
          title: string
          description?: string | null
          url: string
          location?: string | null
          deadline?: string | null
          stipend?: string | null
          duration?: string | null
          is_archived?: boolean
          source?: string | null
          url_hash?: string | null
        }
        Update: {
          scrape_job_id?: string
          organization_id?: string | null
          opportunity_type_id?: number | null
          title?: string
          description?: string | null
          url?: string
          location?: string | null
          deadline?: string | null
          stipend?: string | null
          duration?: string | null
          is_archived?: boolean
          source?: string | null
          url_hash?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: { id: number; name: string; category: string | null; created_at: string }
        Insert: { name: string; category?: string | null }
        Update: { name?: string; category?: string | null }
        Relationships: []
      }
      opportunity_skills: {
        Row: { opportunity_id: string; skill_id: number }
        Insert: { opportunity_id: string; skill_id: number }
        Update: { opportunity_id?: string; skill_id?: number }
        Relationships: []
      }
      user_skills: {
        Row: {
          user_id: string
          skill_id: number
          level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
          added_at: string
        }
        Insert: {
          user_id: string
          skill_id: number
          level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null
        }
        Update: { level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null }
        Relationships: []
      }
      resumes: {
        Row: {
          id: string
          user_id: string
          file_path: string
          file_name: string
          file_size: number | null
          extracted_text: string | null
          parse_status: 'pending' | 'processing' | 'completed' | 'failed'
          uploaded_at: string
        }
        Insert: {
          user_id: string
          file_path: string
          file_name: string
          file_size?: number | null
          extracted_text?: string | null
          parse_status?: 'pending' | 'processing' | 'completed' | 'failed'
        }
        Update: {
          user_id?: string
          file_path?: string
          file_name?: string
          file_size?: number | null
          extracted_text?: string | null
          parse_status?: 'pending' | 'processing' | 'completed' | 'failed'
        }
        Relationships: []
      }
      resume_skills: {
        Row: { resume_id: string; skill_id: number; confidence: number | null }
        Insert: { resume_id: string; skill_id: number; confidence?: number | null }
        Update: { confidence?: number | null }
        Relationships: []
      }
      recommendations: {
        Row: {
          id: string
          user_id: string
          opportunity_id: string
          score: number
          matched_skills: number[] | null
          missing_skills: number[] | null
          generated_at: string
        }
        Insert: {
          user_id: string
          opportunity_id: string
          score: number
          matched_skills?: number[] | null
          missing_skills?: number[] | null
        }
        Update: {
          user_id?: string
          opportunity_id?: string
          score?: number
          matched_skills?: number[] | null
          missing_skills?: number[] | null
        }
        Relationships: []
      }
      saved_opportunities: {
        Row: {
          id: string
          user_id: string
          opportunity_id: string
          notes: string | null
          saved_at: string
        }
        Insert: {
          user_id: string
          opportunity_id: string
          notes?: string | null
        }
        Update: { notes?: string | null }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// ============================================================
// Convenient type aliases
// ============================================================
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type OpportunityType = Database['public']['Tables']['opportunity_types']['Row']
export type Organization = Database['public']['Tables']['organizations']['Row']
export type ScrapeJob = Database['public']['Tables']['scrape_jobs']['Row']
export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
export type UserSkill = Database['public']['Tables']['user_skills']['Row']
export type Resume = Database['public']['Tables']['resumes']['Row']
export type ResumeSkill = Database['public']['Tables']['resume_skills']['Row']
export type Recommendation = Database['public']['Tables']['recommendations']['Row']
export type SavedOpportunity = Database['public']['Tables']['saved_opportunities']['Row']

// Rich joined types used in the UI
export type OpportunityWithDetails = Opportunity & {
  organizations: Organization | null
  opportunity_types: OpportunityType | null
  skills: Skill[]
  match_score?: number
  matched_skills?: Skill[]
  missing_skills?: Skill[]
  is_saved?: boolean
}

export type ResumeWithSkills = Resume & {
  skills: Skill[]
}

export type ScrapeJobWithOpportunities = ScrapeJob & {
  opportunities: OpportunityWithDetails[]
}
