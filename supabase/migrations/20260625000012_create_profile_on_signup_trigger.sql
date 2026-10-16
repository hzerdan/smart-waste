CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, rol_id, nombre_completo, email, activo)
  VALUES (
    NEW.id,
    NULL, -- Requiere asignación manual por Admin
    COALESCE(NEW.raw_user_meta_data->>'nombre_completo', NEW.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    COALESCE(NEW.email, ''),
    false -- Requiere activación manual por Admin
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
