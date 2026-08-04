-- ============================================================
-- MIGRACIÓN: normalización + soft delete (estado A/B)
-- Ejecutar una sola vez en la base de datos PostgreSQL
-- ============================================================

-- 1. Nueva tabla Localidades (ciudades/barrios que se repiten entre socios)
CREATE TABLE IF NOT EXISTS "Localidades" (
  "idLocalidad"   SERIAL PRIMARY KEY,
  "nombre"        VARCHAR(100) NOT NULL,
  "provincia"     VARCHAR(100),
  "codigoPostal"  VARCHAR(10)
);

-- 2. Campo estado en Socios ('A' = activo, 'B' = baja)
ALTER TABLE "Socios"
  ADD COLUMN IF NOT EXISTS "estado" CHAR(1) NOT NULL DEFAULT 'A';

-- Marcar todos los socios existentes como activos
UPDATE "Socios" SET "estado" = 'A' WHERE "estado" IS NULL;

-- 4. Campo estado en Profesores ('A' = activo, 'B' = baja)
ALTER TABLE "Profesores"
  ADD COLUMN IF NOT EXISTS "estado" CHAR(1) NOT NULL DEFAULT 'A';

-- Marcar todos los profesores existentes como activos
UPDATE "Profesores" SET "estado" = 'A' WHERE "estado" IS NULL;

-- 3. Índices para acelerar el filtrado por estado (importante con muchos registros)
CREATE INDEX IF NOT EXISTS idx_socios_estado     ON "Socios"("estado");
CREATE INDEX IF NOT EXISTS idx_profesores_estado ON "Profesores"("estado");

-- ============================================================
-- Eliminar tablas que ya no se usan
-- ============================================================

-- Socios-Entrenamiento: reemplazada por PlanSocio (JSON)
DROP TABLE IF EXISTS "Socios-Entrenamiento";

-- Profesores-Sedes: redundante, Profesores.idSede ya cumple esa función
DROP TABLE IF EXISTS "Profesores-Sedes";

-- Ejercicios y ZonasMusculares: módulo completo eliminado
DROP TABLE IF EXISTS "Ejercicios";
DROP TABLE IF EXISTS "ZonasMusculares";

-- Actividades: columna idActividad eliminada de Turnero
ALTER TABLE "Turnero" DROP COLUMN IF EXISTS "idActividad";
DROP TABLE IF EXISTS "Actividades";

-- 5. Foto de perfil del socio (data URL en base64, subida desde la PWA)
ALTER TABLE "Socios"
  ADD COLUMN IF NOT EXISTS "fotoUrl" TEXT;
