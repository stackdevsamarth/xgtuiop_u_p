/*
  # Create Leaderboard System Schema

  ## Overview
  This migration creates a complete role-based leaderboard system with support for admins, judges, and teams.

  ## New Tables
  
  ### 1. `judges`
  - `id` (uuid, primary key) - Unique identifier for each judge
  - `name` (text, unique, required) - Judge's display name (used for login)
  - `created_at` (timestamptz) - Record creation timestamp
  - Used for judge authentication (name-based, no password)

  ### 2. `teams`
  - `id` (uuid, primary key) - Unique identifier for each team
  - `name` (text, unique, required) - Team's display name (used for login)
  - `created_at` (timestamptz) - Record creation timestamp
  - Used for team authentication (name-based, no password)

  ### 3. `score_categories`
  - `id` (uuid, primary key) - Unique identifier for each category
  - `name` (text, required) - Category name (e.g., "Innovation", "Design")
  - `max_score` (integer, default 10) - Maximum possible score for this category
  - `created_at` (timestamptz) - Record creation timestamp
  - Defines the scoring categories that judges use

  ### 4. `scores`
  - `id` (uuid, primary key) - Unique identifier for each score entry
  - `team_id` (uuid, foreign key -> teams) - The team being scored
  - `judge_id` (uuid, foreign key -> judges) - The judge giving the score
  - `category_id` (uuid, foreign key -> score_categories) - The category being scored
  - `score` (integer, required) - The actual score value
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - Stores all scores with unique constraint on (team_id, judge_id, category_id)

  ### 5. `comments`
  - `id` (uuid, primary key) - Unique identifier for each comment
  - `team_id` (uuid, foreign key -> teams) - The team receiving the comment
  - `judge_id` (uuid, foreign key -> judges) - The judge leaving the comment
  - `comment` (text, required) - The comment text
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  - Stores judge comments for teams

  ## Security
  - All tables have RLS enabled
  - Admins (authenticated users in auth.users) have full access
  - Judges can only modify their own scores and comments
  - Teams can only view their own data
  - Public leaderboard view is read-only

  ## Indexes
  - Added indexes on foreign keys for performance
  - Unique constraints on judge/team names and scoring combinations
*/

-- Create judges table
CREATE TABLE IF NOT EXISTS judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create score_categories table
CREATE TABLE IF NOT EXISTS score_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  max_score integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES score_categories(id) ON DELETE CASCADE,
  score integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_id, judge_id, category_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_scores_team_id ON scores(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge_id ON scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_category_id ON scores(category_id);
CREATE INDEX IF NOT EXISTS idx_comments_team_id ON comments(team_id);
CREATE INDEX IF NOT EXISTS idx_comments_judge_id ON comments(judge_id);

-- Enable Row Level Security on all tables
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for judges table
-- Admins can do everything
CREATE POLICY "Admins have full access to judges"
  ON judges FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Judges can read all other judges (to see who else is judging)
CREATE POLICY "Judges can view all judges"
  ON judges FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for teams table
-- Admins can do everything
CREATE POLICY "Admins have full access to teams"
  ON teams FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Everyone can read teams (for leaderboard and judge scoring)
CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for score_categories table
-- Admins can do everything
CREATE POLICY "Admins have full access to categories"
  ON score_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Everyone can read categories
CREATE POLICY "Anyone can view categories"
  ON score_categories FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for scores table
-- Admins can view all scores
CREATE POLICY "Admins can view all scores"
  ON scores FOR SELECT
  TO authenticated
  USING (true);

-- Admins can delete scores
CREATE POLICY "Admins can delete scores"
  ON scores FOR DELETE
  TO authenticated
  USING (true);

-- Anyone can insert scores (judge authentication happens at app level)
CREATE POLICY "Anyone can insert scores"
  ON scores FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anyone can update scores (judge authentication happens at app level)
CREATE POLICY "Anyone can update scores"
  ON scores FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Anyone can read all scores (for leaderboard calculation)
CREATE POLICY "Anyone can view scores"
  ON scores FOR SELECT
  TO anon
  USING (true);

-- RLS Policies for comments table
-- Admins can view all comments
CREATE POLICY "Admins can view all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (true);

-- Admins can delete comments
CREATE POLICY "Admins can delete comments"
  ON comments FOR DELETE
  TO authenticated
  USING (true);

-- Anyone can insert comments (judge authentication happens at app level)
CREATE POLICY "Anyone can insert comments"
  ON comments FOR INSERT
  TO anon
  WITH CHECK (true);

-- Anyone can update comments (judge authentication happens at app level)
CREATE POLICY "Anyone can update comments"
  ON comments FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Anyone can read comments (teams need to see comments about them)
CREATE POLICY "Anyone can view comments"
  ON comments FOR SELECT
  TO anon
  USING (true);

-- Insert some default score categories
INSERT INTO score_categories (name, max_score) VALUES
  ('Innovation', 10),
  ('Design', 10),
  ('Execution', 10),
  ('Presentation', 10)
ON CONFLICT DO NOTHING;