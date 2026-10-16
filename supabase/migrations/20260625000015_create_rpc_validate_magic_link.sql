CREATE OR REPLACE FUNCTION public.validate_magic_link(p_token text)
RETURNS jsonb AS $$
DECLARE
  v_link public.magic_links%ROWTYPE;
  v_valido boolean := false;
  v_registro_id bigint := NULL;
  v_mensaje text;
BEGIN
  -- Buscar el token
  SELECT * INTO v_link
  FROM public.magic_links
  WHERE token = p_token;

  IF NOT FOUND THEN
    v_mensaje := 'Token no válido o inexistente.';
  ELSIF v_link.usado THEN
    v_mensaje := 'El token ya ha sido utilizado.';
  ELSIF v_link.expires_at < now() THEN
    v_mensaje := 'El token ha expirado.';
  ELSE
    v_valido := true;
    v_registro_id := v_link.registro_id;
    v_mensaje := 'Token válido.';
  END IF;

  RETURN jsonb_build_object(
    'valido', v_valido,
    'registro_id', v_registro_id,
    'mensaje', v_mensaje
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
