CREATE OR REPLACE FUNCTION public.check_area_belongs_to_cliente()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.areas
    WHERE id = NEW.area_id AND cliente_id = NEW.cliente_id
  ) THEN
    RAISE EXCEPTION 'El área % no pertenece al cliente %', 
      NEW.area_id, NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_area_cliente
  BEFORE INSERT OR UPDATE ON public.registros_ingreso
  FOR EACH ROW EXECUTE FUNCTION public.check_area_belongs_to_cliente();
