-- Migración 25: Normalización de Tablas Maestras y Catálogos para Informes y Operaciones
-- Crea: codigos_y, clasificaciones_residuo, unidades_medida, contratistas
-- Modifica: tipos_residuo, registros_ingreso, registros_retiro, y actualiza RPC get_datos_informe_mensual

-- ==============================================================================
-- 1. CREAR TABLAS MAESTRAS (CATÁLOGOS)
-- ==============================================================================

-- A. Catálogo de Códigos Y (Ley 24.051 / Basilea)
CREATE TABLE IF NOT EXISTS public.codigos_y (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  nombre_comun text NOT NULL,
  descripcion_legal text NOT NULL,
  corriente_normativa text NOT NULL DEFAULT 'Ley Nac. 24.051 - Anexo I / Convenio de Basilea',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.codigos_y IS 'Catálogo maestro de residuos peligrosos según Anexo I Ley 24.051 y Convenio de Basilea';

-- B. Catálogo de Clasificaciones de Residuo / Corrientes
CREATE TABLE IF NOT EXISTS public.clasificaciones_residuo (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  descripcion text,
  color_hex text NOT NULL DEFAULT '#6b7280',
  orden_reporte integer NOT NULL DEFAULT 1,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clasificaciones_residuo IS 'Corrientes de residuos para reportes, agregación y estilos de gráficos (RSU, Reciclables, Inertes, RRPP)';

-- C. Catálogo de Unidades de Medida
CREATE TABLE IF NOT EXISTS public.unidades_medida (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  codigo text NOT NULL UNIQUE,
  nombre text NOT NULL,
  simbolo text NOT NULL,
  es_pesable boolean NOT NULL DEFAULT true,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.unidades_medida IS 'Unidades de medida para pesaje balanza, cubicaje o conteo unitario';

-- D. Catálogo de Contratistas / Subcontratistas por Cliente
CREATE TABLE IF NOT EXISTS public.contratistas (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre_fantasia text NOT NULL,
  razon_social text,
  cuit text,
  contacto text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uq_contratista_por_cliente UNIQUE (cliente_id, nombre_fantasia)
);

COMMENT ON TABLE public.contratistas IS 'Empresas contratistas y prestadores de servicio asignados a cada cliente';

-- ==============================================================================
-- 2. POBLAR DATOS SEMILLA EN TABLAS MAESTRAS
-- ==============================================================================

-- A. Códigos Y
INSERT INTO public.codigos_y (codigo, nombre_comun, descripcion_legal)
VALUES
  ('Y8', 'Aceites Usados y Minerales', 'Desechos de aceites minerales no aptos para el uso a que estaban destinados'),
  ('Y9', 'Mezclas y Emulsiones de Hidrocarburos', 'Mezclas y emulsiones de desechos de aceite y agua o de hidrocarburos y agua'),
  ('Y12', 'Pinturas, Resinas y Tintas', 'Desechos resultantes de la producción, preparación y utilización de tintas, colorantes, pigmentos, pinturas, lacas o barnices'),
  ('Y31', 'Compuestos de Plomo / Baterías', 'Plomo y compuestos de plomo (baterías de automotores, placas, soldaduras)'),
  ('Y34', 'Soluciones Ácidas', 'Soluciones ácidas o ácidos en forma sólida'),
  ('Y48', 'Sólidos y Suelos Contaminados', 'Materiales y elementos filtrantes, trapos, suelos y recipientes contaminados con sustancias peligrosas')
ON CONFLICT (codigo) DO UPDATE SET
  nombre_comun = EXCLUDED.nombre_comun,
  descripcion_legal = EXCLUDED.descripcion_legal;

-- B. Clasificaciones de Residuo
INSERT INTO public.clasificaciones_residuo (codigo, nombre, descripcion, color_hex, orden_reporte)
VALUES
  ('RSU', 'Residuos Sólidos Urbanos (RSU)', 'Residuos asimilables a urbanos generados en cocinas, campamentos y oficinas', '#10b981', 1),
  ('RECICLABLE', 'Materiales Reciclables', 'Plásticos, papeles, cartones y materiales valorizables secos', '#3b82f6', 2),
  ('INERTE', 'Residuos Inertes e Industriales', 'Chatarra, maderas, geomembrana, tarimas y bolsones de insumos', '#f59e0b', 3),
  ('PELIGROSO_LIQUIDO', 'Residuos Peligrosos Líquidos', 'Aceites usados, mezclas de hidrocarburos y efluentes controlados', '#ef4444', 4),
  ('PELIGROSO_SOLIDO', 'Residuos Peligrosos Sólidos', 'Suelos contaminados, absorbentes, trapos con hidrocarburos y baterías', '#b91c1c', 5)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  color_hex = EXCLUDED.color_hex,
  orden_reporte = EXCLUDED.orden_reporte;

-- C. Unidades de Medida
INSERT INTO public.unidades_medida (codigo, nombre, simbolo, es_pesable)
VALUES
  ('kg', 'Kilogramos', 'kg', true),
  ('litros', 'Litros', 'L', false),
  ('unidades', 'Unidades / Piezas', 'unid', false),
  ('tarimas', 'Tarimas / Pallets', 'tar', false),
  ('fardos', 'Fardos prensados', 'far', true),
  ('m3', 'Metros Cúbicos', 'm³', false)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  simbolo = EXCLUDED.simbolo,
  es_pesable = EXCLUDED.es_pesable;

-- D. Contratistas semilla para clientes existentes
INSERT INTO public.contratistas (cliente_id, nombre_fantasia, razon_social)
SELECT c.id, cont.nombre_fantasia, cont.razon_social
FROM public.clientes c
CROSS JOIN (
  VALUES 
    ('LMA Propio', 'Litio Minera Argentina S.A.'),
    ('CONOSUR', 'Transportes y Servicios Conosur S.A.'),
    ('AGV', 'AGV Servicios Mineros S.R.L.'),
    ('SECORP', 'Secorp Seguridad Integral S.A.'),
    ('BIOTEC', 'Biotec Saneamiento Ambiental'),
    ('VIAL CARRIL', 'Vial Carril Movimientos de Suelo S.A.'),
    ('GEO', 'Geología & Perforaciones S.A.')
) AS cont(nombre_fantasia, razon_social)
ON CONFLICT (cliente_id, nombre_fantasia) DO NOTHING;

-- ==============================================================================
-- 3. MIGRAR RELACIONES EN public.tipos_residuo
-- ==============================================================================

ALTER TABLE public.tipos_residuo
ADD COLUMN IF NOT EXISTS clasificacion_id integer REFERENCES public.clasificaciones_residuo(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS codigo_y_id integer REFERENCES public.codigos_y(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unidad_medida_defecto_id integer REFERENCES public.unidades_medida(id) ON DELETE RESTRICT;

-- Migrar valores desde los campos de texto
UPDATE public.tipos_residuo tr
SET 
  clasificacion_id = cr.id,
  codigo_y_id = (SELECT id FROM public.codigos_y cy WHERE cy.codigo = tr.codigo_y LIMIT 1),
  unidad_medida_defecto_id = COALESCE(
    (SELECT id FROM public.unidades_medida um WHERE um.codigo = tr.unidad_medida_defecto LIMIT 1),
    (SELECT id FROM public.unidades_medida WHERE codigo = 'kg' LIMIT 1)
  )
FROM public.clasificaciones_residuo cr
WHERE UPPER(cr.codigo) = UPPER(tr.categoria_corriente);

-- Asegurar valor por defecto si alguno quedó en NULL
UPDATE public.tipos_residuo
SET 
  clasificacion_id = (SELECT id FROM public.clasificaciones_residuo WHERE codigo = 'RSU' LIMIT 1)
WHERE clasificacion_id IS NULL;

UPDATE public.tipos_residuo
SET 
  unidad_medida_defecto_id = (SELECT id FROM public.unidades_medida WHERE codigo = 'kg' LIMIT 1)
WHERE unidad_medida_defecto_id IS NULL;

-- Aplicar NOT NULL
ALTER TABLE public.tipos_residuo
ALTER COLUMN clasificacion_id SET NOT NULL,
ALTER COLUMN unidad_medida_defecto_id SET NOT NULL;

-- Eliminar columnas redundantes
ALTER TABLE public.tipos_residuo
DROP COLUMN IF EXISTS categoria_corriente,
DROP COLUMN IF EXISTS codigo_y,
DROP COLUMN IF EXISTS unidad_medida_defecto;

-- ==============================================================================
-- 4. MIGRAR RELACIONES EN public.registros_ingreso
-- ==============================================================================

ALTER TABLE public.registros_ingreso
ADD COLUMN IF NOT EXISTS contratista_id integer REFERENCES public.contratistas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS unidad_medida_id integer REFERENCES public.unidades_medida(id) ON DELETE RESTRICT;

-- Asignar unidad_medida_id basada en la columna anterior o en 'kg' por defecto
UPDATE public.registros_ingreso r
SET unidad_medida_id = COALESCE(
  (SELECT id FROM public.unidades_medida um WHERE um.codigo = r.unidad_medida LIMIT 1),
  (SELECT id FROM public.unidades_medida WHERE codigo = 'kg' LIMIT 1)
);

-- Asignar contratista_id si el texto de contratista coincide con la tabla
UPDATE public.registros_ingreso r
SET contratista_id = c.id
FROM public.contratistas c
WHERE c.cliente_id = r.cliente_id
  AND (c.nombre_fantasia ILIKE '%' || r.contratista || '%' OR r.contratista ILIKE '%' || c.nombre_fantasia || '%');

-- Asegurar NOT NULL en unidad_medida_id
ALTER TABLE public.registros_ingreso
ALTER COLUMN unidad_medida_id SET NOT NULL;

-- Eliminar columnas de texto
ALTER TABLE public.registros_ingreso
DROP COLUMN IF EXISTS unidad_medida,
DROP COLUMN IF EXISTS contratista;

-- ==============================================================================
-- 5. MIGRAR RELACIONES EN public.registros_retiro
-- ==============================================================================

ALTER TABLE public.registros_retiro
ADD COLUMN IF NOT EXISTS unidad_medida_id integer REFERENCES public.unidades_medida(id) ON DELETE RESTRICT;

UPDATE public.registros_retiro r
SET unidad_medida_id = COALESCE(
  (SELECT id FROM public.unidades_medida um WHERE um.codigo = r.unidad_medida LIMIT 1),
  (SELECT id FROM public.unidades_medida WHERE codigo = 'kg' LIMIT 1)
);

ALTER TABLE public.registros_retiro
ALTER COLUMN unidad_medida_id SET NOT NULL;

ALTER TABLE public.registros_retiro
DROP COLUMN IF EXISTS unidad_medida;

-- ==============================================================================
-- 6. HABILITAR SEGURIDAD (RLS) EN NUEVAS TABLAS
-- ==============================================================================

ALTER TABLE public.codigos_y ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clasificaciones_residuo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unidades_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratistas ENABLE ROW LEVEL SECURITY;

-- Lectura pública para autenticados en tablas maestras fijas
CREATE POLICY codigos_y_select ON public.codigos_y FOR SELECT TO authenticated USING (true);
CREATE POLICY codigos_y_admin ON public.codigos_y FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

CREATE POLICY clasificaciones_select ON public.clasificaciones_residuo FOR SELECT TO authenticated USING (true);
CREATE POLICY clasificaciones_admin ON public.clasificaciones_residuo FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

CREATE POLICY unidades_medida_select ON public.unidades_medida FOR SELECT TO authenticated USING (true);
CREATE POLICY unidades_medida_admin ON public.unidades_medida FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- Políticas para contratistas
CREATE POLICY contratistas_select ON public.contratistas FOR SELECT TO authenticated
USING (
  auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global') OR
  (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND cliente_id = (auth.jwt() ->> 'cliente_id')::integer) OR
  (auth.jwt() ->> 'user_role' IN ('operador', 'operador_global'))
);

CREATE POLICY contratistas_admin ON public.contratistas FOR ALL TO authenticated
USING (auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global'));

-- ==============================================================================
-- 7. ACTUALIZAR RPC get_datos_informe_mensual CON LAS NUEVAS TABLAS
-- ==============================================================================

DROP FUNCTION IF EXISTS public.get_datos_informe_mensual(integer, integer, integer);

CREATE OR REPLACE FUNCTION public.get_datos_informe_mensual(
  p_cliente_id integer,
  p_anio integer,
  p_mes integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role text;
  v_jwt_cliente_id integer;
  v_fecha_desde date;
  v_fecha_hasta date;
  v_fecha_inicio_acumulativo date;
  v_resumen_corrientes jsonb;
  v_resumen_sectores jsonb;
  v_desvios jsonb;
  v_acumulado_mensual jsonb;
  v_retiros jsonb;
  v_metadatos_informe jsonb;
  v_resultado jsonb;
BEGIN
  v_user_role := auth.jwt() ->> 'user_role';
  v_jwt_cliente_id := (auth.jwt() ->> 'cliente_id')::integer;

  -- Validación de permisos
  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'No autorizado. Usuario no autenticado.';
  END IF;

  IF v_user_role = 'supervisor_cliente' AND v_jwt_cliente_id <> p_cliente_id THEN
    RAISE EXCEPTION 'No autorizado. No tiene acceso a los informes de este cliente.';
  END IF;

  -- Ventanas temporales
  v_fecha_desde := make_date(p_anio, p_mes, 1);
  v_fecha_hasta := (v_fecha_desde + interval '1 month - 1 day')::date;
  v_fecha_inicio_acumulativo := make_date(p_anio, 1, 1);

  -- A. Resumen por corriente en el mes seleccionado (con clasificación y código Y normalizados)
  SELECT jsonb_agg(sub) INTO v_resumen_corrientes
  FROM (
    SELECT 
      cr.id AS clasificacion_id,
      cr.codigo AS clasificacion_codigo,
      cr.nombre AS clasificacion_nombre,
      cr.color_hex AS clasificacion_color,
      cr.orden_reporte,
      tr.id AS tipo_residuo_id,
      tr.nombre AS tipo_residuo_nombre,
      cy.codigo AS codigo_y,
      cy.nombre_comun AS codigo_y_nombre,
      um.simbolo AS unidad_medida_simbolo,
      COUNT(r.id) AS cantidad_ingresos,
      COALESCE(SUM(r.cantidad_bultos), 0) AS total_bultos,
      ROUND(COALESCE(SUM(r.peso), 0)::numeric, 2) AS total_peso_kg,
      ROUND(COALESCE(SUM(r.importe), 0)::numeric, 2) AS total_importe
    FROM public.registros_ingreso r
    JOIN public.tipos_residuo tr ON r.tipo_residuo_id = tr.id
    JOIN public.clasificaciones_residuo cr ON tr.clasificacion_id = cr.id
    LEFT JOIN public.codigos_y cy ON tr.codigo_y_id = cy.id
    JOIN public.unidades_medida um ON tr.unidad_medida_defecto_id = um.id
    WHERE r.cliente_id = p_cliente_id
      AND r.fecha_hora_ingreso::date BETWEEN v_fecha_desde AND v_fecha_hasta
    GROUP BY cr.id, cr.codigo, cr.nombre, cr.color_hex, cr.orden_reporte, tr.id, tr.nombre, cy.codigo, cy.nombre_comun, um.simbolo
    ORDER BY cr.orden_reporte ASC, total_peso_kg DESC
  ) sub;

  -- B. Ranking de generación por Sector y Contratista
  SELECT jsonb_agg(sub) INTO v_resumen_sectores
  FROM (
    SELECT 
      COALESCE(cont.nombre_fantasia, 'LMA Propio') AS empresa_contratista,
      a.id AS sector_id,
      a.nombre AS sector_nombre,
      COALESCE(ca.nombre, 'General') AS categoria_area_nombre,
      cr.codigo AS clasificacion_codigo,
      cr.color_hex AS clasificacion_color,
      COUNT(r.id) AS cantidad_ingresos,
      COALESCE(SUM(r.cantidad_bultos), 0) AS total_bultos,
      ROUND(COALESCE(SUM(r.peso), 0)::numeric, 2) AS total_peso_kg
    FROM public.registros_ingreso r
    JOIN public.areas a ON r.area_id = a.id
    LEFT JOIN public.categorias_area ca ON a.categoria_area_id = ca.id
    LEFT JOIN public.contratistas cont ON r.contratista_id = cont.id
    JOIN public.tipos_residuo tr ON r.tipo_residuo_id = tr.id
    JOIN public.clasificaciones_residuo cr ON tr.clasificacion_id = cr.id
    WHERE r.cliente_id = p_cliente_id
      AND r.fecha_hora_ingreso::date BETWEEN v_fecha_desde AND v_fecha_hasta
    GROUP BY cont.nombre_fantasia, a.id, a.nombre, ca.nombre, cr.codigo, cr.color_hex
    ORDER BY total_peso_kg DESC
  ) sub;

  -- C. Desvíos detectados en el mes
  SELECT jsonb_agg(sub) INTO v_desvios
  FROM (
    SELECT 
      r.id,
      r.fecha_hora_ingreso,
      COALESCE(cont.nombre_fantasia, 'LMA Propio') AS empresa_contratista,
      a.nombre AS sector_nombre,
      tr.nombre AS tipo_residuo_nombre,
      cr.nombre AS clasificacion_nombre,
      r.cantidad_bultos,
      ROUND(r.peso::numeric, 2) AS peso_kg,
      um.simbolo AS unidad_medida_simbolo,
      r.motivo_desvio,
      r.observaciones
    FROM public.registros_ingreso r
    JOIN public.areas a ON r.area_id = a.id
    JOIN public.tipos_residuo tr ON r.tipo_residuo_id = tr.id
    JOIN public.clasificaciones_residuo cr ON tr.clasificacion_id = cr.id
    JOIN public.unidades_medida um ON r.unidad_medida_id = um.id
    LEFT JOIN public.contratistas cont ON r.contratista_id = cont.id
    WHERE r.cliente_id = p_cliente_id
      AND r.fecha_hora_ingreso::date BETWEEN v_fecha_desde AND v_fecha_hasta
      AND r.es_desvio = true
    ORDER BY r.fecha_hora_ingreso DESC
  ) sub;

  -- D. Serie temporal mensual acumulativa (Evolución histórica)
  SELECT jsonb_agg(sub) INTO v_acumulado_mensual
  FROM (
    SELECT 
      to_char(date_trunc('month', r.fecha_hora_ingreso), 'YYYY-MM') AS periodo_mes,
      cr.codigo AS clasificacion_codigo,
      cr.nombre AS clasificacion_nombre,
      cr.color_hex AS clasificacion_color,
      COUNT(r.id) AS cantidad_ingresos,
      ROUND(COALESCE(SUM(r.peso), 0)::numeric, 2) AS total_peso_kg
    FROM public.registros_ingreso r
    JOIN public.tipos_residuo tr ON r.tipo_residuo_id = tr.id
    JOIN public.clasificaciones_residuo cr ON tr.clasificacion_id = cr.id
    WHERE r.cliente_id = p_cliente_id
      AND r.fecha_hora_ingreso::date BETWEEN v_fecha_inicio_acumulativo AND v_fecha_hasta
    GROUP BY date_trunc('month', r.fecha_hora_ingreso), cr.codigo, cr.nombre, cr.color_hex
    ORDER BY periodo_mes ASC
  ) sub;

  -- E. Retiros de sitio en el mes
  SELECT jsonb_agg(sub) INTO v_retiros
  FROM (
    SELECT 
      ret.id,
      ret.fecha_retiro,
      ret.numero_remito,
      tr.nombre AS tipo_residuo_nombre,
      cr.nombre AS clasificacion_nombre,
      ROUND(ret.cantidad::numeric, 2) AS cantidad,
      um.simbolo AS unidad_medida_simbolo,
      ret.lugar_egreso,
      ret.empresa_transportista,
      ret.autorizado_por,
      ret.responsable_patio
    FROM public.registros_retiro ret
    JOIN public.tipos_residuo tr ON ret.tipo_residuo_id = tr.id
    JOIN public.clasificaciones_residuo cr ON tr.clasificacion_id = cr.id
    JOIN public.unidades_medida um ON ret.unidad_medida_id = um.id
    WHERE ret.cliente_id = p_cliente_id
      AND ret.fecha_retiro BETWEEN v_fecha_desde AND v_fecha_hasta
    ORDER BY ret.fecha_retiro ASC
  ) sub;

  -- F. Metadatos de informe mensual / bitácora de patios
  SELECT to_jsonb(inf) INTO v_metadatos_informe
  FROM public.informes_mensuales inf
  WHERE inf.cliente_id = p_cliente_id
    AND inf.periodo_anio = p_anio
    AND inf.periodo_mes = p_mes;

  -- Compilación final del JSON
  v_resultado := jsonb_build_object(
    'periodo', jsonb_build_object(
      'anio', p_anio,
      'mes', p_mes,
      'fecha_desde', v_fecha_desde,
      'fecha_hasta', v_fecha_hasta
    ),
    'metadatos', COALESCE(v_metadatos_informe, '{}'::jsonb),
    'resumen_corrientes', COALESCE(v_resumen_corrientes, '[]'::jsonb),
    'resumen_sectores', COALESCE(v_resumen_sectores, '[]'::jsonb),
    'desvios', COALESCE(v_desvios, '[]'::jsonb),
    'acumulado_mensual', COALESCE(v_acumulado_mensual, '[]'::jsonb),
    'retiros', COALESCE(v_retiros, '[]'::jsonb)
  );

  RETURN v_resultado;
END;
$$;
