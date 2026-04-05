-- PostGIS and pgvector are pre-installed on Supabase — just enable them
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;

-- Splat registry
CREATE TABLE IF NOT EXISTS splats (
  id              TEXT PRIMARY KEY,
  centroid        GEOMETRY(Point, 4326)   NOT NULL,
  bbox            GEOMETRY(Polygon, 4326) NOT NULL,
  centroid_ecef   DOUBLE PRECISION[3]     NOT NULL,
  lods            JSONB                   NOT NULL,
  metadata        JSONB                   NOT NULL,
  capture_date    DATE                    NOT NULL,
  owner_id        TEXT                    NOT NULL,
  created_at      TIMESTAMPTZ             DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_splats_centroid ON splats USING GIST (centroid);
CREATE INDEX IF NOT EXISTS idx_splats_bbox     ON splats USING GIST (bbox);

-- Semantic document store
CREATE TABLE IF NOT EXISTS spatial_docs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  splat_id    TEXT        REFERENCES splats(id) ON DELETE CASCADE,
  chunk_text  TEXT        NOT NULL,
  embedding   VECTOR(1536) NOT NULL,   -- OpenAI text-embedding-3-small
  bbox        GEOMETRY(Polygon, 4326),
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_docs_embedding ON spatial_docs
  USING hnsw (embedding vector_cosine_ops) WITH (m=16, ef_construction=64);

-- Spatial pre-filter → semantic search
CREATE OR REPLACE FUNCTION query_spatial_rag(
  query_embedding VECTOR(1536),
  search_bbox     GEOMETRY,
  top_k           INT DEFAULT 5
) RETURNS TABLE (chunk_text TEXT, similarity FLOAT, splat_id TEXT) AS $$
  SELECT d.chunk_text,
         1 - (d.embedding <=> query_embedding) AS similarity,
         d.splat_id
  FROM   spatial_docs d
  WHERE  ST_Intersects(d.bbox, search_bbox)
  ORDER  BY d.embedding <=> query_embedding
  LIMIT  top_k;
$$ LANGUAGE sql STABLE;

-- ── Seed data ───────────────────────────────────────────────────────────────
INSERT INTO splats (id, centroid, bbox, centroid_ecef, lods, metadata, capture_date, owner_id)
VALUES (
  'dhaka_test_01',
  ST_SetSRID(ST_MakePoint(90.4125, 23.8103), 4326),
  ST_SetSRID(ST_MakeEnvelope(90.407, 23.805, 90.418, 23.816), 4326),
  ARRAY[635318.0, 5698547.0, 2557457.0],
  '{"low":"low_5mb.spz","medium":"med_25mb.spz","high":"high_80mb.spz"}',
  '{"crop":"rice","ndvi":0.72,"area_ha":4.3,"public":true}',
  '2025-07-10',
  'test_user'
) ON CONFLICT (id) DO NOTHING;

-- Seed docs with zero vectors — RAG query works, results just won't be semantically ranked
INSERT INTO spatial_docs (splat_id, chunk_text, embedding, bbox)
VALUES
  ('dhaka_test_01',
   'This field grows boro rice with NDVI 0.72, indicating healthy crop cover as of July 2025.',
   array_fill(0, ARRAY[1536])::vector,
   ST_SetSRID(ST_MakeEnvelope(90.407, 23.805, 90.418, 23.816), 4326)),
  ('dhaka_test_01',
   'Field area is 4.3 hectares. Irrigation source is groundwater pump. Last harvest was April 2025.',
   array_fill(0, ARRAY[1536])::vector,
   ST_SetSRID(ST_MakeEnvelope(90.407, 23.805, 90.418, 23.816), 4326))
ON CONFLICT DO NOTHING;
