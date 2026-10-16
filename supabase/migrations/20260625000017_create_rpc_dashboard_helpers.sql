CREATE OR REPLACE FUNCTION public.get_dashboard_global(p_fecha_desde date, p_fecha_hasta date)
RETURNS TABLE (
  cliente_id integer,
  razon_social text,
  tipo_residuo_id integer,
  tipo_residuo_nombre text,
  total_ingresos bigint,
  categoria_area_id integer,
  categoria_area_nombre text
) AS $$
DECLARE
  v_user_role text;
BEGIN
  v_user_role := auth.jwt() ->> 'user_role';
  IF v_user_role IS NULL OR v_user_role NOT IN ('supervisor_global', 'administrador') THEN
    RAISE EXCEPTION 'No autorizado. Se requiere rol de supervisor_global o administrador.';
  END IF;

  RETURN QUERY
  SELECT 
    c.id AS cliente_id,
    c.razon_social,
    tr.id AS tipo_residuo_id,
    tr.nombre AS tipo_residuo_nombre,
    COUNT(r.id) AS total_ingresos,
    ca.id AS categoria_area_id,
    ca.nombre AS categoria_area_nombre
  FROM public.registros_ingreso r
  JOIN public.clientes c ON r.cliente_id = c.id
  JOIN public.tipos_residuo tr ON r.tipo_residuo_id = tr.id
  JOIN public.areas a ON r.area_id = a.id
  LEFT JOIN public.categorias_area ca ON a.categoria_area_id = ca.id
  WHERE r.fecha_hora_ingreso::date BETWEEN p_fecha_desde AND p_fecha_hasta
  GROUP BY c.id, c.razon_social, tr.id, tr.nombre, ca.id, ca.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_dashboard_cliente(p_fecha_desde date, p_fecha_hasta date)
RETURNS TABLE (
  area_id integer,
  area_nombre text,
  categoria_area_nombre text,
  tipo_residuo_id integer,
  tipo_residuo_nombre text,
  total_ingresos bigint
) AS $$
DECLARE
  v_user_role text;
  v_jwt_cliente_id integer;
BEGIN
  v_user_role := auth.jwt() ->> 'user_role';
  v_jwt_cliente_id := (auth.jwt() ->> 'cliente_id')::integer;
  
  IF v_user_role IS NULL OR v_user_role <> 'supervisor_cliente' THEN
    RAISE EXCEPTION 'No autorizado. Se requiere rol de supervisor_cliente.';
  END IF;

  IF v_jwt_cliente_id IS NULL THEN
    RAISE EXCEPTION 'No autorizado. No se encontró cliente_id en los claims del usuario.';
  END IF;

  RETURN QUERY
  SELECT 
    a.id AS area_id,
    a.nombre AS area_nombre,
    coalesce(ca.nombre, 'Sin Categoría') AS categoria_area_nombre,
    tr.id AS tipo_residuo_id,
    tr.nombre AS tipo_residuo_nombre,
    COUNT(r.id) AS total_ingresos
  FROM public.registros_ingreso r
  JOIN public.tipos_residuo tr ON r.tipo_residuo_id = tr.id
  JOIN public.areas a ON r.area_id = a.id
  LEFT JOIN public.categorias_area ca ON a.categoria_area_id = ca.id
  WHERE r.cliente_id = v_jwt_cliente_id
    AND r.fecha_hora_ingreso::date BETWEEN p_fecha_desde AND p_fecha_hasta
  GROUP BY a.id, a.nombre, ca.nombre, tr.id, tr.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_resumen_operador(
  p_operador_id uuid,
  p_fecha_desde date,
  p_fecha_hasta date
)
RETURNS TABLE (
  cliente_id integer,
  razon_social text,
  registros_creados bigint,
  magic_links_generados bigint,
  fotos_subidas bigint
) AS $$
DECLARE
  v_user_role text;
BEGIN
  v_user_role := auth.jwt() ->> 'user_role';
  
  -- Validar que el operador consulte su propia actividad o sea administrador
  IF v_user_role IS NULL OR (v_user_role <> 'administrador' AND auth.uid() <> p_operador_id) THEN
    RAISE EXCEPTION 'No autorizado. Solo el propio operador o un administrador pueden ver este resumen.';
  END IF;

  RETURN QUERY
  WITH reg AS (
    SELECT r.cliente_id, COUNT(r.id) AS creados
    FROM public.registros_ingreso r
    WHERE r.operador_id = p_operador_id 
      AND r.fecha_hora_ingreso::date BETWEEN p_fecha_desde AND p_fecha_hasta
    GROUP BY r.cliente_id
  ),
  ml AS (
    SELECT r.cliente_id, COUNT(m.id) AS links
    FROM public.magic_links m
    JOIN public.registros_ingreso r ON m.registro_id = r.id
    WHERE m.generado_por = p_operador_id 
      AND m.created_at::date BETWEEN p_fecha_desde AND p_fecha_hasta
    GROUP BY r.cliente_id
  ),
  fot AS (
    SELECT r.cliente_id, COUNT(f.id) AS fotos
    FROM public.fotos_ingreso f
    JOIN public.registros_ingreso r ON f.registro_id = r.id
    WHERE f.subida_por_operador = true
      AND r.operador_id = p_operador_id
      AND f.created_at::date BETWEEN p_fecha_desde AND p_fecha_hasta
    GROUP BY r.cliente_id
  )
  SELECT 
    c.id AS cliente_id,
    c.razon_social,
    coalesce(reg.creados, 0) AS registros_creados,
    coalesce(ml.links, 0) AS magic_links_generados,
    coalesce(fot.fotos, 0) AS fotos_subidas
  FROM public.clientes c
  LEFT JOIN reg ON c.id = reg.cliente_id
  LEFT JOIN ml ON c.id = ml.cliente_id
  LEFT JOIN fot ON c.id = fot.cliente_id
  WHERE reg.creados IS NOT NULL OR ml.links IS NOT NULL OR fot.fotos IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
