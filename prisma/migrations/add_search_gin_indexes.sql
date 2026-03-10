-- GIN indexes for full-text search performance
-- Run manually: psql $DATABASE_URL -f prisma/migrations/add_search_gin_indexes.sql

-- Community: search on name + description
CREATE INDEX IF NOT EXISTS idx_community_search
  ON "Community"
  USING GIN (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '')))
  WHERE "isPublic" = true;

-- Course: search on title + description
CREATE INDEX IF NOT EXISTS idx_course_search
  ON "Course"
  USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')))
  WHERE "isPublished" = true;

-- Post: search on title + content
CREATE INDEX IF NOT EXISTS idx_post_search
  ON "Post"
  USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '')));

-- ILIKE fallback indexes (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_community_name_trgm ON "Community" USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_community_desc_trgm ON "Community" USING GIN (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_course_title_trgm ON "Course" USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_post_title_trgm ON "Post" USING GIN (title gin_trgm_ops);
