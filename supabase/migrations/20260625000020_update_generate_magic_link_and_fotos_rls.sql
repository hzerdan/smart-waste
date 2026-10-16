-- Migración 20: Habilitar generate_magic_link y subida de fotos a roles globales y de supervisión

-- 1. Actualizar RLS en public.fotos_ingreso para permitir inserción a todos los roles operativos y de supervisión
DROP POLICY IF EXISTS "fotos_insert_operador" ON public.fotos_ingreso;

CREATE POLICY "fotos_insert_operador" ON public.fotos_ingreso
FOR INSERT TO authenticated
WITH CHECK (
  ((auth.jwt() ->> 'user_role') IN ('administrador', 'supervisor_global', 'supervisor_cliente', 'operador_global', 'operador'))
  AND subida_por_operador = true
  AND magic_link_id IS NULL
);

-- 2. Actualizar función RPC public.generate_magic_link para soportar operador_global, supervisor_global y supervisor_cliente
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

  -- Validar que el rol esté autorizado para operaciones de registro
  IF v_user_role IS NULL OR v_user_role NOT IN ('operador', 'operador_global', 'supervisor_cliente', 'supervisor_global', 'administrador') THEN
    RAISE EXCEPTION 'No autorizado. Se requiere rol operativo o de supervisión.';
  END IF;

  -- Obtener el cliente del registro
  SELECT cliente_id INTO v_registro_cliente_id
  FROM public.registros_ingreso
  WHERE id = p_registro_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro de ingreso no encontrado.';
  END IF;

  -- Si es operador de cliente, validar asignación
  IF v_user_role = 'operador' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.operador_cliente
      WHERE profile_id = v_user_id AND cliente_id = v_registro_cliente_id
    ) THEN
      RAISE EXCEPTION 'No autorizado. El operador no está asignado al cliente de este registro.';
    END IF;
  END IF;

  -- Si es supervisor de cliente, validar asignación
  IF v_user_role = 'supervisor_cliente' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.supervisor_cliente
      WHERE profile_id = v_user_id AND cliente_id = v_registro_cliente_id
    ) THEN
      RAISE EXCEPTION 'No autorizado. El supervisor no está asignado al cliente de este registro.';
    END IF;
  END IF;

  -- Generar token aleatorio y fecha de expiración (2 horas)
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
