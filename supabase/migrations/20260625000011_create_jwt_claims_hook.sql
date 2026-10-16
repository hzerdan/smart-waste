CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid;
  v_role_nombre text;
  v_cliente_id integer;
  v_claims jsonb;
BEGIN
  v_user_id := (event->>'user_id')::uuid;
  
  -- Obtener el nombre del rol del perfil activo del usuario
  SELECT r.nombre INTO v_role_nombre
  FROM public.profiles p
  JOIN public.roles r ON p.rol_id = r.id
  WHERE p.id = v_user_id AND p.activo = true;

  -- Si es supervisor de cliente, buscar su cliente_id asignado
  IF v_role_nombre = 'supervisor_cliente' THEN
    SELECT cliente_id INTO v_cliente_id
    FROM public.supervisor_cliente
    WHERE profile_id = v_user_id
    LIMIT 1;
  END IF;

  -- Extraer claims existentes
  v_claims := event->'claims';
  
  -- Inyectar claims personalizados
  IF v_role_nombre IS NOT NULL THEN
    v_claims := jsonb_set(v_claims, '{user_role}', to_jsonb(v_role_nombre));
  ELSE
    v_claims := jsonb_set(v_claims, '{user_role}', 'null'::jsonb);
  END IF;

  IF v_cliente_id IS NOT NULL THEN
    v_claims := jsonb_set(v_claims, '{cliente_id}', to_jsonb(v_cliente_id));
  ELSE
    v_claims := jsonb_set(v_claims, '{cliente_id}', 'null'::jsonb);
  END IF;

  -- Retornar el evento modificado con los nuevos claims
  RETURN jsonb_set(event, '{claims}', v_claims);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos de ejecución al usuario de Supabase Auth
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
