CREATE OR REPLACE FUNCTION public.mark_magic_link_used(p_token text, p_foto_paths text[])
RETURNS void AS $$
DECLARE
  v_link public.magic_links%ROWTYPE;
  v_path text;
BEGIN
  -- Validar que la función es llamada por el rol de servicio (service_role)
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'No autorizado. Esta acción requiere permisos de service_role.';
  END IF;

  -- Buscar y bloquear fila del token
  SELECT * INTO v_link
  FROM public.magic_links
  WHERE token = p_token FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Token no encontrado.';
  END IF;

  IF v_link.usado THEN
    RAISE EXCEPTION 'El token ya ha sido utilizado.';
  END IF;

  IF v_link.expires_at < now() THEN
    RAISE EXCEPTION 'El token ha expirado.';
  END IF;

  -- Marcar link como usado
  UPDATE public.magic_links
  SET usado = true,
      used_at = now()
  WHERE id = v_link.id;

  -- Registrar cada foto subida
  FOREACH v_path IN ARRAY p_foto_paths LOOP
    INSERT INTO public.fotos_ingreso (registro_id, storage_path, subida_por_operador, magic_link_id)
    VALUES (v_link.registro_id, v_path, false, v_link.id);
  END LOOP;

  -- Actualizar estado del registro de ingreso a completo si estaba pendiente
  UPDATE public.registros_ingreso
  SET estado = 'completo',
      updated_at = now()
  WHERE id = v_link.registro_id AND estado = 'pendiente';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
