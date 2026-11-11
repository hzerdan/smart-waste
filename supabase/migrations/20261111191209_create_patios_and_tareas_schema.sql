-- Migración 26: Parametrización de Patios y Tareas Operativas por Cliente
-- Crea tablas maestras public.patios y public.tareas_sitio,
-- tablas de auditoría por informe public.informes_patios y public.informes_tareas,
-- migra datos existentes y actualiza el RPC get_datos_informe_mensual.

-- ==============================================================================
-- 1. TABLA MAESTRA: public.patios (Discriminada por cliente_id)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.patios (
  id serial PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre varchar(150) NOT NULL,
  codigo varchar(50) DEFAULT NULL,
  tipo varchar(50) NOT NULL DEFAULT 'general'
    CHECK (tipo IN ('rsu', 'rrpp', 'inerte', 'reciclable', 'general', 'mixto')),
  capacidad_nominal numeric(12, 2) DEFAULT NULL,
  unidad_capacidad varchar(30) NOT NULL DEFAULT 'm3',
  descripcion text DEFAULT NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uq_patio_cliente_nombre UNIQUE (cliente_id, nombre)
);

COMMENT ON TABLE public.patios IS 'Catálogo maestro de patios y áreas de acopio físico discriminados por cliente';
COMMENT ON COLUMN public.patios.cliente_id IS 'Cliente al que pertenece el patio de acopio';
COMMENT ON COLUMN public.patios.tipo IS 'Clasificación operativa del patio: rsu, rrpp, inerte, reciclable, general, mixto';

-- ==============================================================================
-- 2. TABLA AUDITORÍA: public.informes_patios (Ocupación mensual por patio)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.informes_patios (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  informe_id bigint NOT NULL REFERENCES public.informes_mensuales(id) ON DELETE CASCADE,
  patio_id integer NOT NULL REFERENCES public.patios(id) ON DELETE CASCADE,
  porcentaje_ocupacion numeric(5, 2) NOT NULL DEFAULT 0.00
    CHECK (porcentaje_ocupacion >= 0 AND porcentaje_ocupacion <= 100),
  observaciones text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uq_informe_patio UNIQUE (informe_id, patio_id)
);

COMMENT ON TABLE public.informes_patios IS 'Auditoría de capacidad y porcentaje de ocupación por patio en cada informe mensual';

-- ==============================================================================
-- 3. TABLA MAESTRA: public.tareas_sitio (Catálogo de tareas operativas por cliente)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.tareas_sitio (
  id serial PRIMARY KEY,
  cliente_id integer NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  categoria varchar(50) NOT NULL DEFAULT 'operacion'
    CHECK (categoria IN ('operacion', 'segregacion', 'mantenimiento', 'ambiental', 'seguridad', 'otra')),
  orden integer NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uq_tarea_cliente_nombre UNIQUE (cliente_id, nombre)
);

COMMENT ON TABLE public.tareas_sitio IS 'Catálogo de actividades y tareas operativas rutinarias en faena por cliente';

-- ==============================================================================
-- 4. TABLA AUDITORÍA: public.informes_tareas (Tareas ejecutadas por informe)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.informes_tareas (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  informe_id bigint NOT NULL REFERENCES public.informes_mensuales(id) ON DELETE CASCADE,
  tarea_id integer NOT NULL REFERENCES public.tareas_sitio(id) ON DELETE CASCADE,
  completada boolean NOT NULL DEFAULT true,
  detalle_adicional text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uq_informe_tarea UNIQUE (informe_id, tarea_id)
);

COMMENT ON TABLE public.informes_tareas IS 'Registro y certificación de tareas ejecutadas en sitio durante el mes auditado';

-- ==============================================================================
-- 5. SEGURIDAD A NIVEL DE FILAS (RLS)
-- ==============================================================================

ALTER TABLE public.patios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informes_patios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas_sitio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.informes_tareas ENABLE ROW LEVEL SECURITY;

-- Políticas para patios
DROP POLICY IF EXISTS patios_select ON public.patios;
CREATE POLICY patios_select ON public.patios FOR SELECT TO authenticated
USING (
  auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global', 'operador_global') OR
  (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND cliente_id = (auth.jwt() ->> 'cliente_id')::integer) OR
  (auth.jwt() ->> 'user_role' = 'operador' AND (
    NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()) OR
    cliente_id IN (SELECT cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid())
  ))
);

DROP POLICY IF EXISTS patios_admin ON public.patios;
CREATE POLICY patios_admin ON public.patios FOR ALL TO authenticated
USING (auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global'));

-- Políticas para informes_patios
DROP POLICY IF EXISTS informes_patios_select ON public.informes_patios;
CREATE POLICY informes_patios_select ON public.informes_patios FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.informes_mensuales inf
    WHERE inf.id = informes_patios.informe_id
      AND (
        auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global') OR
        (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND inf.cliente_id = (auth.jwt() ->> 'cliente_id')::integer)
      )
  )
);

DROP POLICY IF EXISTS informes_patios_admin ON public.informes_patios;
CREATE POLICY informes_patios_admin ON public.informes_patios FOR ALL TO authenticated
USING (auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global'));

-- Políticas para tareas_sitio
DROP POLICY IF EXISTS tareas_sitio_select ON public.tareas_sitio;
CREATE POLICY tareas_sitio_select ON public.tareas_sitio FOR SELECT TO authenticated
USING (
  auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global', 'operador_global') OR
  (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND cliente_id = (auth.jwt() ->> 'cliente_id')::integer) OR
  (auth.jwt() ->> 'user_role' = 'operador' AND (
    NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()) OR
    cliente_id IN (SELECT cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid())
  ))
);

DROP POLICY IF EXISTS tareas_sitio_admin ON public.tareas_sitio;
CREATE POLICY tareas_sitio_admin ON public.tareas_sitio FOR ALL TO authenticated
USING (auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global'));

-- Políticas para informes_tareas
DROP POLICY IF EXISTS informes_tareas_select ON public.informes_tareas;
CREATE POLICY informes_tareas_select ON public.informes_tareas FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.informes_mensuales inf
    WHERE inf.id = informes_tareas.informe_id
      AND (
        auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global') OR
        (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND inf.cliente_id = (auth.jwt() ->> 'cliente_id')::integer)
      )
  )
);

DROP POLICY IF EXISTS informes_tareas_admin ON public.informes_tareas;
CREATE POLICY informes_tareas_admin ON public.informes_tareas FOR ALL TO authenticated
USING (auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global'));

-- ==============================================================================
-- 6. MIGRAR DATOS EXISTENTES DESDE public.informes_mensuales
-- ==============================================================================

DO $$
DECLARE
  r_inf RECORD;
  v_patio_rsu_id integer;
  v_patio_rrpp_id integer;
  v_tarea_text text;
  v_tarea_id integer;
  v_orden integer;
BEGIN
  -- 6.1 Crear patios por defecto para todos los clientes activos si no existen
  FOR r_inf IN (SELECT id FROM public.clientes WHERE activo = true) LOOP
    INSERT INTO public.patios (cliente_id, nombre, codigo, tipo, capacidad_nominal, unidad_capacidad, descripcion)
    VALUES 
      (r_inf.id, 'Patio de Residuos Sólidos (RSU)', 'PATIO_RSU', 'rsu', 500.00, 'm2', 'Área de recepción, pesaje, compactación de RSU y enfardado de reciclables'),
      (r_inf.id, 'Patio de Residuos Peligrosos (RRPP)', 'PATIO_RRPP', 'rrpp', 300.00, 'm2', 'Recinto cubierto y con contención secundaria para tambores e IBC de RRPP')
    ON CONFLICT (cliente_id, nombre) DO NOTHING;
  END LOOP;

  -- 6.2 Poblar informes_patios e informes_tareas a partir de informes_mensuales existentes
  FOR r_inf IN (SELECT * FROM public.informes_mensuales) LOOP
    -- Buscar IDs de patios del cliente
    SELECT id INTO v_patio_rsu_id FROM public.patios WHERE cliente_id = r_inf.cliente_id AND codigo = 'PATIO_RSU' LIMIT 1;
    SELECT id INTO v_patio_rrpp_id FROM public.patios WHERE cliente_id = r_inf.cliente_id AND codigo = 'PATIO_RRPP' LIMIT 1;

    IF v_patio_rsu_id IS NOT NULL AND r_inf.ocupacion_patio_rsu_pct IS NOT NULL THEN
      INSERT INTO public.informes_patios (informe_id, patio_id, porcentaje_ocupacion, observaciones)
      VALUES (r_inf.id, v_patio_rsu_id, r_inf.ocupacion_patio_rsu_pct, 'Capacidad disponible para maniobra de equipos y recambio de tolvas')
      ON CONFLICT (informe_id, patio_id) DO UPDATE SET porcentaje_ocupacion = EXCLUDED.porcentaje_ocupacion;
    END IF;

    IF v_patio_rrpp_id IS NOT NULL AND r_inf.ocupacion_patio_rrpp_pct IS NOT NULL THEN
      INSERT INTO public.informes_patios (informe_id, patio_id, porcentaje_ocupacion, observaciones)
      VALUES (r_inf.id, v_patio_rrpp_id, r_inf.ocupacion_patio_rrpp_pct, 'Condiciones óptimas de orden, segregación y control antiderrames')
      ON CONFLICT (informe_id, patio_id) DO UPDATE SET porcentaje_ocupacion = EXCLUDED.porcentaje_ocupacion;
    END IF;

    -- Migrar tareas del jsonb si existen
    IF r_inf.tareas_sitio IS NOT NULL AND jsonb_array_length(r_inf.tareas_sitio) > 0 THEN
      v_orden := 1;
      FOR v_tarea_text IN SELECT jsonb_array_elements_text(r_inf.tareas_sitio) LOOP
        -- Insertar en catálogo maestro de tareas del cliente si no existe
        INSERT INTO public.tareas_sitio (cliente_id, nombre, categoria, orden)
        VALUES (r_inf.cliente_id, v_tarea_text, 'operacion', v_orden)
        ON CONFLICT (cliente_id, nombre) DO UPDATE SET orden = EXCLUDED.orden
        RETURNING id INTO v_tarea_id;

        IF v_tarea_id IS NULL THEN
          SELECT id INTO v_tarea_id FROM public.tareas_sitio WHERE cliente_id = r_inf.cliente_id AND nombre = v_tarea_text LIMIT 1;
        END IF;

        IF v_tarea_id IS NOT NULL THEN
          INSERT INTO public.informes_tareas (informe_id, tarea_id, completada)
          VALUES (r_inf.id, v_tarea_id, true)
          ON CONFLICT (informe_id, tarea_id) DO NOTHING;
        END IF;

        v_orden := v_orden + 1;
      END LOOP;
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- 7. RPC PARA GUARDAR AUDITORÍA DE INFORME MENSUAL (ATÓMICO Y SEGURO)
-- ==============================================================================

DROP FUNCTION IF EXISTS public.guardar_auditoria_informe_mensual(integer, integer, integer, integer, text, text, jsonb, jsonb);

CREATE OR REPLACE FUNCTION public.guardar_auditoria_informe_mensual(
  p_cliente_id integer,
  p_anio integer,
  p_mes integer,
  p_numero_informe integer,
  p_titulo text,
  p_conclusiones text,
  p_patios jsonb,       -- Array de [{ patio_id: int, porcentaje_ocupacion: num, observaciones: text }]
  p_tareas jsonb        -- Array de [{ tarea_id: int, completada: bool, detalle_adicional: text }]
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_role text;
  v_informe_id bigint;
  elem jsonb;
  v_patio_id integer;
  v_ocupacion numeric;
  v_obs text;
  v_tarea_id integer;
  v_completada boolean;
  v_detalle text;
  v_rsu_pct numeric := 0;
  v_rrpp_pct numeric := 0;
  v_tareas_arr jsonb := '[]'::jsonb;
BEGIN
  v_user_role := auth.jwt() ->> 'user_role';

  IF v_user_role NOT IN ('administrador', 'supervisor_global') THEN
    RAISE EXCEPTION 'No autorizado. Solo administradores o supervisores globales pueden auditar informes.';
  END IF;

  -- 1. Upsert en public.informes_mensuales
  INSERT INTO public.informes_mensuales (
    cliente_id,
    periodo_anio,
    periodo_mes,
    numero_informe,
    titulo,
    conclusiones,
    creado_por
  ) VALUES (
    p_cliente_id,
    p_anio,
    p_mes,
    p_numero_informe,
    COALESCE(p_titulo, 'Informe Mensual de Gestión de Residuos'),
    p_conclusiones,
    auth.uid()
  )
  ON CONFLICT (cliente_id, periodo_anio, periodo_mes) DO UPDATE SET
    numero_informe = EXCLUDED.numero_informe,
    titulo = EXCLUDED.titulo,
    conclusiones = EXCLUDED.conclusiones,
    updated_at = now()
  RETURNING id INTO v_informe_id;

  -- 2. Procesar Patios
  IF p_patios IS NOT NULL AND jsonb_typeof(p_patios) = 'array' THEN
    FOR elem IN SELECT * FROM jsonb_array_elements(p_patios) LOOP
      v_patio_id := (elem->>'patio_id')::integer;
      v_ocupacion := COALESCE((elem->>'porcentaje_ocupacion')::numeric, 0);
      v_obs := elem->>'observaciones';

      IF v_patio_id IS NOT NULL THEN
        INSERT INTO public.informes_patios (
          informe_id,
          patio_id,
          porcentaje_ocupacion,
          observaciones,
          updated_at
        ) VALUES (
          v_informe_id,
          v_patio_id,
          v_ocupacion,
          v_obs,
          now()
        )
        ON CONFLICT (informe_id, patio_id) DO UPDATE SET
          porcentaje_ocupacion = EXCLUDED.porcentaje_ocupacion,
          observaciones = EXCLUDED.observaciones,
          updated_at = now();

        -- Retrocompatibilidad: actualizar porcentajes en columnas legacy si coinciden con los códigos
        IF EXISTS (SELECT 1 FROM public.patios WHERE id = v_patio_id AND codigo = 'PATIO_RSU') THEN
          v_rsu_pct := v_ocupacion;
        ELSIF EXISTS (SELECT 1 FROM public.patios WHERE id = v_patio_id AND codigo = 'PATIO_RRPP') THEN
          v_rrpp_pct := v_ocupacion;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 3. Procesar Tareas
  IF p_tareas IS NOT NULL AND jsonb_typeof(p_tareas) = 'array' THEN
    FOR elem IN SELECT * FROM jsonb_array_elements(p_tareas) LOOP
      v_tarea_id := (elem->>'tarea_id')::integer;
      v_completada := COALESCE((elem->>'completada')::boolean, true);
      v_detalle := elem->>'detalle_adicional';

      IF v_tarea_id IS NOT NULL THEN
        INSERT INTO public.informes_tareas (
          informe_id,
          tarea_id,
          completada,
          detalle_adicional,
          updated_at
        ) VALUES (
          v_informe_id,
          v_tarea_id,
          v_completada,
          v_detalle,
          now()
        )
        ON CONFLICT (informe_id, tarea_id) DO UPDATE SET
          completada = EXCLUDED.completada,
          detalle_adicional = EXCLUDED.detalle_adicional,
          updated_at = now();

        -- Retrocompatibilidad: agregar nombres al array jsonb de tareas completadas
        IF v_completada THEN
          SELECT v_tareas_arr || jsonb_build_array(nombre)
          INTO v_tareas_arr
          FROM public.tareas_sitio
          WHERE id = v_tarea_id;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Actualizar columnas legacy de informes_mensuales para garantizar total compatibilidad
  UPDATE public.informes_mensuales
  SET
    ocupacion_patio_rsu_pct = CASE WHEN v_rsu_pct > 0 THEN v_rsu_pct ELSE ocupacion_patio_rsu_pct END,
    ocupacion_patio_rrpp_pct = CASE WHEN v_rrpp_pct > 0 THEN v_rrpp_pct ELSE ocupacion_patio_rrpp_pct END,
    tareas_sitio = CASE WHEN jsonb_array_length(v_tareas_arr) > 0 THEN v_tareas_arr ELSE tareas_sitio END
  WHERE id = v_informe_id;

  RETURN v_informe_id;
END;
$$;

-- ==============================================================================
-- 8. ACTUALIZAR RPC ANALÍTICO get_datos_informe_mensual
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
  v_informe_id bigint;
  v_patios jsonb;
  v_tareas jsonb;
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

  -- A. Resumen por corriente en el mes seleccionado
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

  -- F. Metadatos de informe mensual
  SELECT to_jsonb(inf) INTO v_metadatos_informe
  FROM public.informes_mensuales inf
  WHERE inf.cliente_id = p_cliente_id
    AND inf.periodo_anio = p_anio
    AND inf.periodo_mes = p_mes;

  v_informe_id := (v_metadatos_informe->>'id')::bigint;

  -- F.1. Patios del cliente con porcentaje auditado en este período
  SELECT jsonb_agg(sub) INTO v_patios
  FROM (
    SELECT 
      p.id AS patio_id,
      p.nombre AS patio_nombre,
      p.codigo AS patio_codigo,
      p.tipo AS patio_tipo,
      p.capacidad_nominal,
      p.unidad_capacidad,
      p.descripcion,
      COALESCE(ip.porcentaje_ocupacion, 0.00) AS porcentaje_ocupacion,
      ip.observaciones
    FROM public.patios p
    LEFT JOIN public.informes_patios ip 
      ON ip.patio_id = p.id 
      AND ip.informe_id = v_informe_id
    WHERE p.cliente_id = p_cliente_id
      AND p.activo = true
    ORDER BY p.id ASC
  ) sub;

  -- F.2. Tareas de sitio del cliente con estado completada en este informe
  SELECT jsonb_agg(sub) INTO v_tareas
  FROM (
    SELECT 
      ts.id AS tarea_id,
      ts.nombre AS tarea_nombre,
      ts.categoria AS tarea_categoria,
      ts.orden,
      COALESCE(it.completada, false) AS completada,
      it.detalle_adicional
    FROM public.tareas_sitio ts
    LEFT JOIN public.informes_tareas it 
      ON it.tarea_id = ts.id 
      AND it.informe_id = v_informe_id
    WHERE ts.cliente_id = p_cliente_id
      AND ts.activo = true
    ORDER BY ts.orden ASC, ts.id ASC
  ) sub;

  -- Compilación final del JSON
  v_resultado := jsonb_build_object(
    'periodo', jsonb_build_object(
      'anio', p_anio,
      'mes', p_mes,
      'fecha_desde', v_fecha_desde,
      'fecha_hasta', v_fecha_hasta
    ),
    'metadatos', COALESCE(v_metadatos_informe, '{}'::jsonb),
    'patios', COALESCE(v_patios, '[]'::jsonb),
    'tareas', COALESCE(v_tareas, '[]'::jsonb),
    'resumen_corrientes', COALESCE(v_resumen_corrientes, '[]'::jsonb),
    'resumen_sectores', COALESCE(v_resumen_sectores, '[]'::jsonb),
    'desvios', COALESCE(v_desvios, '[]'::jsonb),
    'acumulado_mensual', COALESCE(v_acumulado_mensual, '[]'::jsonb),
    'retiros', COALESCE(v_retiros, '[]'::jsonb)
  );

  RETURN v_resultado;
END;
$$;
