-- =============================================
-- ROL GERENTE — mismo alcance que DIRECTOR
-- 1) Agrega GERENTE al enum user_role
-- 2) is_director() incluye GERENTE (hereda todo el
--    CRUD de proyectos/tareas/asignaciones/catálogos)
-- =============================================

-- Agregar valor al enum user_role (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'user_role' AND e.enumlabel = 'GERENTE'
  ) THEN
    ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'GERENTE';
  END IF;
END
$$;

-- is_director() → GERENTE tiene las mismas funciones que DIRECTOR
CREATE OR REPLACE FUNCTION is_director()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('SUPERADMIN', 'SYSADMIN', 'DIRECTOR', 'GERENTE'));
END;
$$;