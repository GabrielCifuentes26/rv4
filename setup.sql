-- ============================================================
-- EJECUTAR UNA SOLA VEZ en Supabase > SQL Editor
-- URL: https://supabase.com/dashboard/project/iipgrojliqeyycvgnkrc/sql
-- ============================================================

-- 1. Agregar columnas a la tabla usuarios existente
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS empresa TEXT DEFAULT 'RV4',
  ADD COLUMN IF NOT EXISTS nivel   TEXT DEFAULT 'Bronce',
  ADD COLUMN IF NOT EXISTS estado  TEXT DEFAULT 'activo';

-- 2. Crear tabla de solicitudes de registro
CREATE TABLE IF NOT EXISTS solicitudes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_user_id UUID,
  nombre       TEXT NOT NULL,
  correo       TEXT NOT NULL,
  empresa      TEXT DEFAULT 'RV4',
  estado       TEXT DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','aprobado','rechazado')),
  notas        TEXT,
  creado_en    TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar Row Level Security en solicitudes
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;

-- 4. Política: cualquiera puede insertar (registro público)
DROP POLICY IF EXISTS "public_insert_solicitudes" ON solicitudes;
CREATE POLICY "public_insert_solicitudes"
  ON solicitudes FOR INSERT
  WITH CHECK (true);

-- 5. Política: usuarios autenticados pueden leer
DROP POLICY IF EXISTS "auth_select_solicitudes" ON solicitudes;
CREATE POLICY "auth_select_solicitudes"
  ON solicitudes FOR SELECT
  USING (auth.role() = 'authenticated');

-- 6. Política: usuarios autenticados pueden actualizar
DROP POLICY IF EXISTS "auth_update_solicitudes" ON solicitudes;
CREATE POLICY "auth_update_solicitudes"
  ON solicitudes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- 7. Política: usuarios autenticados pueden eliminar
DROP POLICY IF EXISTS "auth_delete_solicitudes" ON solicitudes;
CREATE POLICY "auth_delete_solicitudes"
  ON solicitudes FOR DELETE
  USING (auth.role() = 'authenticated');

-- ✅ Listo. Ya puedes cerrar esta ventana.

-- ============================================================
-- CIERRE CONTABLE — Tablas (agregar en la misma sesión)
-- ============================================================

-- cc_periodos
CREATE TABLE IF NOT EXISTS cc_periodos (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nombre     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cc_periodos DISABLE ROW LEVEL SECURITY;

-- cc_sociedades
CREATE TABLE IF NOT EXISTS cc_sociedades (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  periodo_id BIGINT REFERENCES cc_periodos(id) ON DELETE CASCADE,
  nombre     TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cc_sociedades DISABLE ROW LEVEL SECURITY;

-- cc_cierres (4 filas por sociedad — una por etapa)
CREATE TABLE IF NOT EXISTS cc_cierres (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sociedad_id BIGINT REFERENCES cc_sociedades(id) ON DELETE CASCADE,
  etapa_num   INT NOT NULL CHECK (etapa_num BETWEEN 1 AND 4),
  responsable TEXT NOT NULL DEFAULT 'Contabilidad',
  fecha_limite DATE,
  estatus     TEXT NOT NULL DEFAULT 'pendiente'
              CHECK (estatus IN ('pendiente','en_proceso','finalizado')),
  notas       TEXT DEFAULT '',
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cc_cierres DISABLE ROW LEVEL SECURITY;

-- ✅ Cierre Contable listo.
