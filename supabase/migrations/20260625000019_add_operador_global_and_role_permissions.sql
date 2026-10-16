-- Migración 19: Agregar rol 'operador_global', permisos para supervisores y actualización de hook y RLS

-- 1. Registrar el rol canónico 'operador_global' y actualizar descripción de 'operador'
INSERT INTO public.roles (nombre, descripcion)
VALUES ('operador_global', 'Registro de ingresos y magic links para cualquier cliente')
ON CONFLICT (nombre) DO UPDATE SET 
  descripcion = EXCLUDED.descripcion;

UPDATE public.roles 
SET descripcion = 'Registro de ingresos asignado a un cliente específico' 
WHERE nombre = 'operador';

-- 2. Actualizar el hook JWT para inyectar cliente_id tanto a supervisor_cliente como a operador
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role_nombre text;
  v_cliente_id integer;
  v_claims jsonb;
BEGIN
  v_user_id := (event->>'user_id')::uuid;
  
  -- Obtener el nombre del rol del perfil activo
  SELECT r.nombre INTO v_role_nombre
  FROM public.profiles p
  JOIN public.roles r ON p.rol_id = r.id
  WHERE p.id = v_user_id AND p.activo = true;

  -- Si es supervisor de cliente, buscar en supervisor_cliente
  IF v_role_nombre = 'supervisor_cliente' THEN
    SELECT cliente_id INTO v_cliente_id
    FROM public.supervisor_cliente
    WHERE profile_id = v_user_id
    LIMIT 1;
  -- Si es operador de cliente, buscar en operador_cliente
  ELSIF v_role_nombre = 'operador' THEN
    SELECT cliente_id INTO v_cliente_id
    FROM public.operador_cliente
    WHERE profile_id = v_user_id
    LIMIT 1;
  END IF;

  v_claims := event->'claims';
  
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

  RETURN jsonb_set(event, '{claims}', v_claims);
END;
$$;

-- 3. RLS: Permitir al supervisor_cliente crear y editar áreas de su propia empresa
DROP POLICY IF EXISTS "areas_supervisor_cliente_insert" ON public.areas;
CREATE POLICY "areas_supervisor_cliente_insert" ON public.areas
FOR INSERT TO authenticated
WITH CHECK (
  ((auth.jwt() ->> 'user_role') = 'supervisor_cliente') AND
  (cliente_id = ((auth.jwt() ->> 'cliente_id'))::integer)
);

DROP POLICY IF EXISTS "areas_supervisor_cliente_update" ON public.areas;
CREATE POLICY "areas_supervisor_cliente_update" ON public.areas
FOR UPDATE TO authenticated
USING (
  ((auth.jwt() ->> 'user_role') = 'supervisor_cliente') AND
  (cliente_id = ((auth.jwt() ->> 'cliente_id'))::integer)
);

-- 4. RLS: Permitir a operador_global consultar clientes y áreas
DROP POLICY IF EXISTS "clientes_select" ON public.clientes;
CREATE POLICY "clientes_select" ON public.clientes
FOR SELECT TO authenticated
USING (
  ((auth.jwt() ->> 'user_role') IN ('administrador', 'supervisor_global', 'operador_global'))
  OR
  (((auth.jwt() ->> 'user_role') = 'supervisor_cliente') AND (id = ((auth.jwt() ->> 'cliente_id'))::integer))
  OR
  (((auth.jwt() ->> 'user_role') = 'operador') AND (
    (NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()))
    OR (id IN (SELECT operador_cliente.cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid()))
  ))
);

DROP POLICY IF EXISTS "areas_select" ON public.areas;
CREATE POLICY "areas_select" ON public.areas
FOR SELECT TO authenticated
USING (
  ((auth.jwt() ->> 'user_role') IN ('administrador', 'supervisor_global', 'operador_global'))
  OR
  (((auth.jwt() ->> 'user_role') = 'supervisor_cliente') AND (cliente_id = ((auth.jwt() ->> 'cliente_id'))::integer))
  OR
  (((auth.jwt() ->> 'user_role') = 'operador') AND (
    (NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()))
    OR (cliente_id IN (SELECT operador_cliente.cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid()))
  ))
);

-- 5. RLS: Habilitar inserción y consulta de registros_ingreso para supervisor_global, supervisor_cliente y operador_global
DROP POLICY IF EXISTS "registros_insert" ON public.registros_ingreso;
CREATE POLICY "registros_insert" ON public.registros_ingreso
FOR INSERT TO authenticated
WITH CHECK (
  ((auth.jwt() ->> 'user_role') IN ('administrador', 'supervisor_global', 'operador_global'))
  OR
  (((auth.jwt() ->> 'user_role') = 'supervisor_cliente') AND (cliente_id = ((auth.jwt() ->> 'cliente_id'))::integer))
  OR
  (((auth.jwt() ->> 'user_role') = 'operador') AND (
    (NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()))
    OR (cliente_id IN (SELECT operador_cliente.cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid()))
  ))
);

DROP POLICY IF EXISTS "registros_select" ON public.registros_ingreso;
CREATE POLICY "registros_select" ON public.registros_ingreso
FOR SELECT TO authenticated
USING (
  ((auth.jwt() ->> 'user_role') IN ('administrador', 'supervisor_global', 'operador_global'))
  OR
  (((auth.jwt() ->> 'user_role') = 'supervisor_cliente') AND (cliente_id = ((auth.jwt() ->> 'cliente_id'))::integer))
  OR
  (((auth.jwt() ->> 'user_role') = 'operador') AND (
    (NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()))
    OR (cliente_id IN (SELECT operador_cliente.cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid()))
  ))
);

-- 6. RLS: Habilitar generación de magic links a todos los roles operativos y de supervisión
DROP POLICY IF EXISTS "magic_links_operador" ON public.magic_links;
CREATE POLICY "magic_links_operador" ON public.magic_links
FOR ALL TO authenticated
USING (
  ((auth.jwt() ->> 'user_role') IN ('administrador', 'supervisor_global', 'supervisor_cliente', 'operador_global', 'operador'))
  AND (generado_por = auth.uid())
)
WITH CHECK (
  ((auth.jwt() ->> 'user_role') IN ('administrador', 'supervisor_global', 'supervisor_cliente', 'operador_global', 'operador'))
  AND (generado_por = auth.uid())
);

-- 7. Storage: Permitir subida de fotos a cualquier rol habilitado para registrar ingresos
DROP POLICY IF EXISTS "Permitir subida a operadores autorizados" ON storage.objects;
CREATE POLICY "Permitir subida a operadores autorizados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'residuos-fotos' AND
  ((auth.jwt() ->> 'user_role') IN ('administrador', 'supervisor_global', 'supervisor_cliente', 'operador_global', 'operador')) AND
  (storage.foldername(name))[1] ~ '^[0-9]+$' AND
  (storage.foldername(name))[2] = 'operador' AND
  EXISTS (
    SELECT 1 FROM public.registros_ingreso r
    WHERE r.id = ((storage.foldername(name))[1])::bigint
  )
);
