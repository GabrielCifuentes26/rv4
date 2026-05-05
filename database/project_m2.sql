-- Tabla de metros cuadrados por proyecto
CREATE TABLE IF NOT EXISTS project_m2 (
    project_key      TEXT PRIMARY KEY,
    m2_casas         NUMERIC(12,2) NOT NULL,
    m2_urbanizacion  NUMERIC(12,2) NOT NULL,
    m2_total         NUMERIC(12,2) NOT NULL,
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE project_m2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read project_m2"
    ON project_m2 FOR SELECT TO authenticated USING (true);

-- Datos iniciales
INSERT INTO project_m2 (project_key, m2_casas, m2_urbanizacion, m2_total) VALUES
    ('bdj', 16566.48, 36248.76, 52815.24),
    ('bdp', 30715.06, 23331.69, 54046.75),
    ('bse', 41272.94, 27442.78, 68715.72),
    ('cse', 42630.21, 19427.66, 62057.87),
    ('hlq', 10388.90,  7282.77, 17671.67),
    ('rdb', 29940.56, 33784.09, 63724.65)
ON CONFLICT (project_key) DO UPDATE SET
    m2_casas         = EXCLUDED.m2_casas,
    m2_urbanizacion  = EXCLUDED.m2_urbanizacion,
    m2_total         = EXCLUDED.m2_total,
    updated_at       = NOW();
