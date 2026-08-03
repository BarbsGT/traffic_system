-- =============================================
-- TASK ALERT STATUS (trazabilidad de alertas)
-- Las tareas BLOCKED aparecen en /alerts. Para que
-- queden "gestionadas" o "desbloqueadas" con fecha,
-- se agregan columnas de trazabilidad a tasks:
--   - alert_status: PENDING (sin gestionar) | GESTIONADA | DESBLOQUEADA
--   - alert_status_at: fecha del cambio de estado
--   - alert_status_by: quién hizo el cambio
-- =============================================

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS alert_status TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS alert_status_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS alert_status_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Si el estado era BLOCKED y se cambió el estado de alerta a DESBLOQUEADA,
-- la tarea debe volver a IN_PROGRESS. El trigger deja constancia en alert_status.
CREATE OR REPLACE FUNCTION set_alert_resolved()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.alert_status = 'DESBLOQUEADA' THEN
    IF NEW.status = 'BLOCKED' THEN
      NEW.status := 'IN_PROGRESS';
    END IF;
    NEW.alert_status_at := COALESCE(NEW.alert_status_at, now());
    NEW.alert_status_by := COALESCE(NEW.alert_status_by, auth.uid());
  ELSIF NEW.alert_status = 'GESTIONADA' THEN
    NEW.alert_status_at := COALESCE(NEW.alert_status_at, now());
    NEW.alert_status_by := COALESCE(NEW.alert_status_by, auth.uid());
  ELSIF NEW.alert_status = 'PENDING' THEN
    NEW.alert_status_at := NULL;
    NEW.alert_status_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tasks_alert_status ON tasks;
CREATE TRIGGER trg_tasks_alert_status
  BEFORE INSERT OR UPDATE OF alert_status ON tasks
  FOR EACH ROW EXECUTE FUNCTION set_alert_resolved();

-- Backfill: cualquier tarea que ya no esté bloqueada y tenga alert_status PENDING
-- no es una alerta activa; se marca como no gestionada (se ignora en /alerts).
-- Solo afecta registros nuevos que nunca pasaron por /alerts.
