CREATE OR REPLACE FUNCTION public.generate_magic_link(p_registro_id bigint)
RETURNS jsonb AS $$
DECLARE
  v_user_role text;
  v_user_id uuid;
  v_registro_cliente_id integer;
  v_token text;
  v_expires_at timestamptz;
  v_base_url text;
  v_result jsonb;
BEGIN
  -- Obtener rol y UID del JWT
  v_user_role := auth.jwt() ->> 'user_role';
  v_user_id := auth.uid();

  -- Validar que el rol sea operador o administrador
  IF v_user_role IS NULL OR v_user_role NOT IN ('operador', 'administrador') THEN
    RAISE EXCEPTION 'No autorizado. Se requiere rol de operador o administrador.';
  END IF;

  -- Obtener el cliente del registro
  SELECT cliente_id INTO v_registro_cliente_id
  FROM public.registros_ingreso
  WHERE id = p_registro_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de ingreso no encontrado.';
  END IF;

  -- Validar si el operador está asignado a este cliente
  IF v_user_role = 'operador' AND EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = v_user_id) THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.operador_cliente
      WHERE profile_id = v_user_id AND cliente_id = v_registro_cliente_id
    ) THEN
      RAISE EXCEPTION 'No autorizado. El operador no está asignado al cliente de este registro.';
    END IF;
  END IF;

  -- Generar token y fecha de expiración
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_expires_at := now() + interval '2 hours';

  -- Insertar en la tabla de magic_links
  INSERT INTO public.magic_links (token, registro_id, generado_por, expires_at)
  VALUES (v_token, p_registro_id, v_user_id, v_expires_at);

  -- Intentar obtener URL base de configuración, o usar fallback
  v_base_url := coalesce(current_setting('app.settings.magic_link_base_url', true), 'http://localhost:5173/subir-fotos');

  -- Construir resultado
  v_result := jsonb_build_object(
    'token', v_token,
    'expires_at', v_expires_at,
    'url', v_base_url || '?token=' || v_token
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
