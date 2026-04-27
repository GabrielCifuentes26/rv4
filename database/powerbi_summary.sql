-- ============================================================
-- POWER BI SUMMARY CACHE
-- Ejecutar una sola vez en Supabase > SQL Editor
-- URL: https://supabase.com/dashboard/project/iipgrojliqeyycvgnkrc/sql
-- ============================================================

CREATE TABLE IF NOT EXISTS powerbi_resumen_cache (
  project_key  TEXT PRIMARY KEY,
  project_name TEXT NOT NULL,
  mes_a        TEXT,
  generated_at TIMESTAMPTZ,
  workspace_id TEXT,
  report_id    TEXT,
  dataset_id   TEXT,
  source       TEXT DEFAULT 'Power BI Service',
  payload      JSONB NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE powerbi_resumen_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "powerbi_resumen_select_authenticated" ON powerbi_resumen_cache;
CREATE POLICY "powerbi_resumen_select_authenticated"
  ON powerbi_resumen_cache FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_powerbi_resumen_cache_updated_at
  ON powerbi_resumen_cache(updated_at DESC);

COMMENT ON TABLE powerbi_resumen_cache IS
  'Cache del resumen de Power BI para dashboards web. Guarda solo datos agregados, no datos crudos de SAP.';
