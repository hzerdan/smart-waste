-- Migración 24: Esquema para Informes Mensuales, Trazabilidad de Retiros, Corrientes Y y Desvíos
-- Basado en los requerimientos del Informe Mensual de Minería / Ganfeng Lithium (LMA)

-- ==============================================================================
-- 1. EXTENDER public.tipos_residuo
-- ==============================================================================

ALTER TABLE public.tipos_residuo
ADD COLUMN IF NOT EXISTS categoria_corriente text NOT NULL DEFAULT 'rsu'
  CHECK (categoria_corriente IN ('rsu', 'reciclable', 'inerte', 'peligroso_liquido', 'peligroso_solido')),
ADD COLUMN IF NOT EXISTS codigo_y text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS unidad_medida_defecto text NOT NULL DEFAULT 'kg'
  CHECK (unidad_medida_defecto IN ('kg', 'litros', 'unidades', 'bolsas', 'tarimas', 'fardos'));

COMMENT ON COLUMN public.tipos_residuo.categoria_corriente IS 'Clasificación de corriente para reportes: rsu, reciclable, inerte, peligroso_liquido, peligroso_solido';
COMMENT ON COLUMN public.tipos_residuo.codigo_y IS 'Identificador normativo Ley 24.051 / Basilea (ej: Y8, Y9, Y12, Y31, Y34, Y48)';
COMMENT ON COLUMN public.tipos_residuo.unidad_medida_defecto IS 'Unidad de medida estándar para pesaje o cubicaje';

-- Actualizar clasificación de tipos de residuo existentes
UPDATE public.tipos_residuo
SET 
  categoria_corriente = CASE 
    WHEN nombre ILIKE '%Plástico%' OR nombre ILIKE '%PET%' THEN 'reciclable'
    WHEN nombre ILIKE '%Cartón%' OR nombre ILIKE '%Papel%' THEN 'reciclable'
    WHEN nombre ILIKE '%Chatarra%' THEN 'inerte'
    WHEN nombre ILIKE '%Orgánico%' OR nombre ILIKE '%Comedor%' THEN 'rsu'
    WHEN nombre ILIKE '%Peligroso%' OR nombre ILIKE '%Hidrocarburo%' THEN 'peligroso_liquido'
    WHEN nombre ILIKE '%Batería%' OR nombre ILIKE '%RAEE%' THEN 'peligroso_solido'
    ELSE 'rsu'
  END,
  codigo_y = CASE
    WHEN nombre ILIKE '%Hidrocarburo%' THEN 'Y8'
    WHEN nombre ILIKE '%Batería%' THEN 'Y31'
    ELSE NULL
  END,
  unidad_medida_defecto = CASE
    WHEN nombre ILIKE '%Hidrocarburo%' THEN 'litros'
    ELSE 'kg'
  END;

-- Insertar nuevas corrientes típicas del informe minero si no existen
INSERT INTO public.tipos_residuo (nombre, descripcion, categoria_corriente, codigo_y, unidad_medida_defecto, requiere_foto, activo)
VALUES 
  ('RSU Asimilable a Urbano', 'Residuos sólidos urbanos asimilables en bolsas de campamento/cocina', 'rsu', NULL, 'kg', false, true),
  ('Geomembrana', 'Recortes y rollos de geomembrana plástica para impermeabilización', 'inerte', NULL, 'kg', false, true),
  ('Madera y Tarimas', 'Pallets de madera, tarimas y rezagos de embalaje', 'inerte', NULL, 'kg', false, true),
  ('Bolsones KCL (Big Bags)', 'Bolsones tipo big bag vacíos de cloruro de potasio y reactivos', 'inerte', NULL, 'unidades', false, true),
  ('Neumáticos Fuera de Uso (NFU)', 'Neumáticos de camionetas y maquinaria pesada', 'inerte', NULL, 'unidades', false, true),
  ('Aceites Usados (Y8)', 'Lubricantes y aceites minerales usados de motores y maquinarias', 'peligroso_liquido', 'Y8', 'litros', true, true),
  ('Mezcla de Hidrocarburos (Y9)', 'Emulsiones de hidrocarburos, agua aceitosa y combustibles', 'peligroso_liquido', 'Y9', 'litros', true, true),
  ('Restos de Pinturas y Solventes (Y12)', 'Pinturas, barnices, resinas y solventes', 'peligroso_solido', 'Y12', 'kg', true, true),
  ('Sólidos Contaminados con Hidrocarburos (Y48)', 'Trapos, guantes, filtros, mangueras y absorbentes impregnados', 'peligroso_solido', 'Y48', 'kg', true, true),
  ('Suelo Contaminado con Hidrocarburos (Y48)', 'Tierra y suelo remediado producto de derrames o saneamiento', 'peligroso_solido', 'Y48', 'kg', true, true)
ON CONFLICT (nombre) DO UPDATE SET
  categoria_corriente = EXCLUDED.categoria_corriente,
  codigo_y = EXCLUDED.codigo_y,
  unidad_medida_defecto = EXCLUDED.unidad_medida_defecto;

-- ==============================================================================
-- 2. EXTENDER public.registros_ingreso
-- ==============================================================================

ALTER TABLE public.registros_ingreso
ADD COLUMN IF NOT EXISTS cantidad_bultos numeric(10, 2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS unidad_medida text NOT NULL DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS contratista text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS es_desvio boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS motivo_desvio text DEFAULT NULL;

COMMENT ON COLUMN public.registros_ingreso.cantidad_bultos IS 'Cantidad de bultos/bolsas/unidades que componen la descarga';
COMMENT ON COLUMN public.registros_ingreso.unidad_medida IS 'Unidad de medida del pesaje o cubicaje (kg, litros, unidades)';
COMMENT ON COLUMN public.registros_ingreso.contratista IS 'Empresa o contratista generador (ej: LMA, CONOSUR, AGV, SECORP, BIOTEC)';
COMMENT ON COLUMN public.registros_ingreso.es_desvio IS 'Indica si se detectó una no conformidad o desvío en el ingreso';
COMMENT ON COLUMN public.registros_ingreso.motivo_desvio IS 'Motivo del desvío (ej: Mezcla c/ reciclable, Decomiso, Mezcla de Y48)';

-- Asignar contratista por defecto en registros existentes para trazabilidad
UPDATE public.registros_ingreso
SET contratista = 'LMA'
WHERE contratista IS NULL;

-- ==============================================================================
-- 3. CREAR TABLA public.registros_retiro (Salidas / Egresos de Residuos de Sitio)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.registros_retiro (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo_residuo_id integer NOT NULL REFERENCES public.tipos_residuo(id) ON DELETE RESTRICT,
  fecha_retiro date NOT NULL DEFAULT CURRENT_DATE,
  numero_remito text NOT NULL,
  cantidad numeric(12, 2) NOT NULL DEFAULT 0.00,
  unidad_medida text NOT NULL DEFAULT 'kg',
  lugar_egreso text DEFAULT 'Patio de RSU',
  empresa_transportista text NOT NULL,
  autorizado_por text DEFAULT NULL,
  responsable_patio text DEFAULT NULL,
  observaciones text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.registros_retiro IS 'Registro oficial de salidas/retiros de residuos de sitio hacia disposición o reciclaje';

-- Habilitar RLS en registros_retiro
ALTER TABLE public.registros_retiro ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para registros_retiro
DROP POLICY IF EXISTS retiros_admin ON public.registros_retiro;
CREATE POLICY retiros_admin ON public.registros_retiro
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_role' = 'administrador');

DROP POLICY IF EXISTS retiros_select ON public.registros_retiro;
CREATE POLICY retiros_select ON public.registros_retiro
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global') OR
    (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND cliente_id = (auth.jwt() ->> 'cliente_id')::integer) OR
    (auth.jwt() ->> 'user_role' = 'operador' AND (
      NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()) OR
      cliente_id IN (SELECT cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid())
    ))
  );

DROP POLICY IF EXISTS retiros_insert ON public.registros_retiro;
CREATE POLICY retiros_insert ON public.registros_retiro
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global', 'operador_global') OR
    (auth.jwt() ->> 'user_role' = 'operador' AND (
      NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()) OR
      cliente_id IN (SELECT cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid())
    ))
  );

-- ==============================================================================
-- 4. CREAR TABLA public.informes_mensuales (Bitácora de Patios y Auditoría Mensual)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.informes_mensuales (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  periodo_anio integer NOT NULL CHECK (periodo_anio >= 2020),
  periodo_mes integer NOT NULL CHECK (periodo_mes BETWEEN 1 AND 12),
  numero_informe integer DEFAULT NULL,
  titulo text NOT NULL DEFAULT 'Informe Mensual de Gestión de Residuos',
  ocupacion_patio_rsu_pct numeric(5, 2) DEFAULT 0.00,
  ocupacion_patio_rrpp_pct numeric(5, 2) DEFAULT 0.00,
  tareas_sitio jsonb NOT NULL DEFAULT '[]'::jsonb,
  conclusiones text DEFAULT NULL,
  creado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uq_informe_cliente_periodo UNIQUE (cliente_id, periodo_anio, periodo_mes)
);

COMMENT ON TABLE public.informes_mensuales IS 'Metadatos mensuales, bitácora de tareas operativas y ocupación de patios por cliente';

-- Habilitar RLS en informes_mensuales
ALTER TABLE public.informes_mensuales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS informes_admin ON public.informes_mensuales;
CREATE POLICY informes_admin ON public.informes_mensuales
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global'));

DROP POLICY IF EXISTS informes_select ON public.informes_mensuales;
CREATE POLICY informes_select ON public.informes_mensuales
  FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global') OR
    (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND cliente_id = (auth.jwt() ->> 'cliente_id')::integer)
  );

-- ==============================================================================
-- 5. RPC ANALÍTICO PARA EL REPORTE MENSUAL
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

  -- Calcular ventanas de tiempo
  v_fecha_desde := make_date(p_anio, p_mes, 1);
  v_fecha_hasta := (v_fecha_desde + interval '1 month - 1 day')::date;
  v_fecha_inicio_acumulativo := make_date(p_anio, 1, 1); -- Desde inicio de año

  -- A. Resumen por corriente en el mes seleccionado
  SELECT jsonb_agg(sub) INTO v_resumen_corrientes
  FROM (
    SELECT 
      tr.categoria_corriente,
      tr.nombre AS tipo_residuo_nombre,
      tr.codigo_y,
      tr.unidad_medida_defecto,
      COUNT(r.id) AS cantidad_ingresos,
      COALESCE(SUM(r.cantidad_bultos), 0) AS total_bultos,
      ROUND(COALESCE(SUM(r.peso), 0)::numeric, 2) AS total_peso_kg,
      ROUND(COALESCE(SUM(r.importe), 0)::numeric, 2) AS total_importe
    FROM public.registros_ingreso r
    JOIN public.tipos_residuo tr ON r.tipo_residuo_id = tr.id
    WHERE r.cliente_id = p_cliente_id
      AND r.fecha_hora_ingreso::date BETWEEN v_fecha_desde AND v_fecha_hasta
    GROUP BY tr.categoria_corriente, tr.nombre, tr.codigo_y, tr.unidad_medida_defecto
    ORDER BY tr.categoria_corriente, total_peso_kg DESC
  ) sub;

  -- B. Ranking de generación por Sector y Contratista
  SELECT jsonb_agg(sub) INTO v_resumen_sectores
  FROM (
    SELECT 
      COALESCE(r.contratista, 'Cliente Principal') AS empresa_contratista,
      a.nombre AS sector_nombre,
      COALESCE(ca.nombre, 'General') AS categoria_area_nombre,
      tr.categoria_corriente,
      COUNT(r.id) AS cantidad_ingresos,
      COALESCE(SUM(r.cantidad_bultos), 0) AS total_bultos,
      ROUND(COALESCE(SUM(r.peso), 0)::numeric, 2) AS total_peso_kg
    FROM public.registros_ingreso r
    JOIN public.areas a ON r.area_id = a.id
    LEFT JOIN public.categorias_area ca ON a.categoria_area_id = ca.id
    JOIN public.tipos_residuo tr ON r.tipo_residuo_id = tr.id
    WHERE r.cliente_id = p_cliente_id
      AND r.fecha_hora_ingreso::date BETWEEN v_fecha_desde AND v_fecha_hasta
    GROUP BY r.contratista, a.nombre, ca.nombre, tr.categoria_corriente
    ORDER BY total_peso_kg DESC
  ) sub;

  -- C. Desvíos detectados en el mes
  SELECT jsonb_agg(sub) INTO v_desvios
  FROM (
    SELECT 
      r.id,
      r.fecha_hora_ingreso,
      COALESCE(r.contratista, 'Cliente Principal') AS empresa_contratista,
      a.nombre AS sector_nombre,
      tr.nombre AS tipo_residuo_nombre,
      tr.categoria_corriente,
      r.cantidad_bultos,
      ROUND(r.peso::numeric, 2) AS peso_kg,
      r.motivo_desvio,
      r.observaciones
    FROM public.registros_ingreso r
    JOIN public.areas a ON r.area_id = a.id
    JOIN public.tipos_residuo tr ON r.tipo_residuo_id = tr.id
    WHERE r.cliente_id = p_cliente_id
      AND r.fecha_hora_ingreso::date BETWEEN v_fecha_desde AND v_fecha_hasta
      AND r.es_desvio = true
    ORDER BY r.fecha_hora_ingreso DESC
  ) sub;

  -- D. Serie temporal mensual acumulativa (Evolución histórica mes a mes)
  SELECT jsonb_agg(sub) INTO v_acumulado_mensual
  FROM (
    SELECT 
      to_char(date_trunc('month', r.fecha_hora_ingreso), 'YYYY-MM') AS periodo_mes,
      tr.categoria_corriente,
      COUNT(r.id) AS cantidad_ingresos,
      ROUND(COALESCE(SUM(r.peso), 0)::numeric, 2) AS total_peso_kg
    FROM public.registros_ingreso r
    JOIN public.tipos_residuo tr ON r.tipo_residuo_id = tr.id
    WHERE r.cliente_id = p_cliente_id
      AND r.fecha_hora_ingreso::date BETWEEN v_fecha_inicio_acumulativo AND v_fecha_hasta
    GROUP BY date_trunc('month', r.fecha_hora_ingreso), tr.categoria_corriente
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
      tr.categoria_corriente,
      ROUND(ret.cantidad::numeric, 2) AS cantidad,
      ret.unidad_medida,
      ret.lugar_egreso,
      ret.empresa_transportista,
      ret.autorizado_por,
      ret.responsable_patio
    FROM public.registros_retiro ret
    JOIN public.tipos_residuo tr ON ret.tipo_residuo_id = tr.id
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

  -- Compilar resultado global en JSON
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
