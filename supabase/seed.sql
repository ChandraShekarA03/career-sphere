-- ============================================================
-- CareerSphere AI – Seed Data
-- ============================================================

-- Opportunity Types
INSERT INTO opportunity_types (name) VALUES
  ('Internship'),
  ('Scholarship'),
  ('Hackathon'),
  ('Fellowship'),
  ('Competition'),
  ('Research Program'),
  ('Grant'),
  ('Job'),
  ('Bootcamp'),
  ('Workshop')
ON CONFLICT (name) DO NOTHING;

-- Common Skills – Programming Languages
INSERT INTO skills (name, category) VALUES
  ('Python', 'programming'),
  ('JavaScript', 'programming'),
  ('TypeScript', 'programming'),
  ('Java', 'programming'),
  ('C++', 'programming'),
  ('C', 'programming'),
  ('Go', 'programming'),
  ('Rust', 'programming'),
  ('Ruby', 'programming'),
  ('PHP', 'programming'),
  ('Swift', 'programming'),
  ('Kotlin', 'programming'),
  ('R', 'programming'),
  ('MATLAB', 'programming'),
  ('Scala', 'programming'),
  ('Dart', 'programming'),
  ('SQL', 'programming')
ON CONFLICT (name) DO NOTHING;

-- Frameworks & Libraries
INSERT INTO skills (name, category) VALUES
  ('React', 'framework'),
  ('Next.js', 'framework'),
  ('Vue.js', 'framework'),
  ('Angular', 'framework'),
  ('Node.js', 'framework'),
  ('Express.js', 'framework'),
  ('Django', 'framework'),
  ('Flask', 'framework'),
  ('FastAPI', 'framework'),
  ('Spring Boot', 'framework'),
  ('TensorFlow', 'framework'),
  ('PyTorch', 'framework'),
  ('Scikit-learn', 'framework'),
  ('Pandas', 'framework'),
  ('NumPy', 'framework'),
  ('Flutter', 'framework'),
  ('React Native', 'framework'),
  ('GraphQL', 'framework'),
  ('REST APIs', 'framework'),
  ('Tailwind CSS', 'framework')
ON CONFLICT (name) DO NOTHING;

-- Tools & Platforms
INSERT INTO skills (name, category) VALUES
  ('Git', 'tool'),
  ('Docker', 'tool'),
  ('Kubernetes', 'tool'),
  ('AWS', 'tool'),
  ('Google Cloud', 'tool'),
  ('Azure', 'tool'),
  ('Linux', 'tool'),
  ('PostgreSQL', 'tool'),
  ('MongoDB', 'tool'),
  ('Redis', 'tool'),
  ('Figma', 'tool'),
  ('Postman', 'tool'),
  ('Jira', 'tool'),
  ('CI/CD', 'tool'),
  ('GitHub Actions', 'tool'),
  ('Terraform', 'tool'),
  ('Supabase', 'tool'),
  ('Firebase', 'tool'),
  ('Vercel', 'tool')
ON CONFLICT (name) DO NOTHING;

-- Domains
INSERT INTO skills (name, category) VALUES
  ('Machine Learning', 'domain'),
  ('Deep Learning', 'domain'),
  ('Natural Language Processing', 'domain'),
  ('Computer Vision', 'domain'),
  ('Data Science', 'domain'),
  ('Data Analysis', 'domain'),
  ('Cybersecurity', 'domain'),
  ('Blockchain', 'domain'),
  ('Web Development', 'domain'),
  ('Mobile Development', 'domain'),
  ('DevOps', 'domain'),
  ('Cloud Computing', 'domain'),
  ('UI/UX Design', 'domain'),
  ('Product Management', 'domain'),
  ('Business Analytics', 'domain'),
  ('Robotics', 'domain'),
  ('IoT', 'domain'),
  ('Embedded Systems', 'domain'),
  ('Quantum Computing', 'domain')
ON CONFLICT (name) DO NOTHING;

-- Soft Skills
INSERT INTO skills (name, category) VALUES
  ('Communication', 'soft'),
  ('Leadership', 'soft'),
  ('Problem Solving', 'soft'),
  ('Teamwork', 'soft'),
  ('Critical Thinking', 'soft'),
  ('Time Management', 'soft'),
  ('Public Speaking', 'soft'),
  ('Research', 'soft'),
  ('Writing', 'soft'),
  ('Project Management', 'soft')
ON CONFLICT (name) DO NOTHING;
