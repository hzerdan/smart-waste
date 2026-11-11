-- Poblado de datos de referencia - Ganfeng Lithium / Litio Minera Argentina (LMA)
-- Proyecto Mariana (Salar de Llullallaico) - Período Setiembre 2026 e Histórico

DO $$
DECLARE
  v_cliente_id integer;
  v_operador_id uuid;
  v_area_cocina integer;
  v_area_jsc integer;
  v_area_geologia integer;
  v_area_campamento integer;
  v_area_operaciones integer;
  v_area_ma26 integer;
  v_area_terminal integer;
  v_area_pozo integer;
  v_area_construccion integer;
  v_area_mantenimiento integer;
  v_area_almacen integer;
  v_area_servicios integer;
  v_area_ambiente integer;
  v_area_obrador integer;
  v_area_3100 integer;
  v_area_parque_solar integer;
  v_area_piletas integer;
  v_area_7800 integer;
  
  v_tr_rsu integer;
  v_tr_plastico integer;
  v_tr_carton integer;
  v_tr_madera integer;
  v_tr_geomembrana integer;
  v_tr_chatarra integer;
  v_tr_tarimas integer;
  v_tr_bolsones_kcl integer;
  v_tr_y8 integer;
  v_tr_y9 integer;
  v_tr_y12 integer;
  v_tr_y48_solidos integer;
  v_tr_y48_suelo integer;
  v_tr_y31 integer;
  
  v_cont_lma integer;
  v_cont_conosur integer;
  v_cont_agv integer;
  v_cont_secorp integer;
  v_cont_biotec integer;
  v_cont_vial integer;
  v_cont_geo integer;
  
  v_um_kg integer;
  v_um_litros integer;
  v_um_unid integer;
  v_cat_campamento integer;
  v_cat_taller integer;
  v_cat_planta integer;
  v_cat_admin integer;
BEGIN
  -- 1. Obtener un operador de referencia
  SELECT id INTO v_operador_id FROM public.profiles WHERE activo = true LIMIT 1;
  IF v_operador_id IS NULL THEN
    SELECT id INTO v_operador_id FROM auth.users LIMIT 1;
  END IF;

  -- 2. Asegurar Unidades de Medida
  SELECT id INTO v_um_kg FROM public.unidades_medida WHERE codigo = 'kg' LIMIT 1;
  SELECT id INTO v_um_litros FROM public.unidades_medida WHERE codigo = 'litros' LIMIT 1;
  SELECT id INTO v_um_unid FROM public.unidades_medida WHERE codigo = 'unidades' LIMIT 1;

  -- 3. Crear / Asegurar Cliente: Litio Minera Argentina (Ganfeng Lithium)
  INSERT INTO public.clientes (razon_social, cuit, email_contacto, telefono, activo)
  VALUES ('Litio Minera Argentina S.A. (Ganfeng Lithium)', '30-71489201-9', 'ambiente.mariana@ganfenglithium.com', '+54 387 421 9800', true)
  ON CONFLICT (cuit) DO UPDATE SET 
    razon_social = EXCLUDED.razon_social,
    email_contacto = EXCLUDED.email_contacto
  RETURNING id INTO v_cliente_id;

  -- 4. Contratistas de Ganfeng / LMA
  INSERT INTO public.contratistas (cliente_id, nombre_fantasia, razon_social)
  VALUES 
    (v_cliente_id, 'LMA Propio', 'Litio Minera Argentina S.A.'),
    (v_cliente_id, 'CONOSUR', 'Transportes y Servicios Conosur S.A.'),
    (v_cliente_id, 'AGV', 'AGV Servicios Mineros S.R.L.'),
    (v_cliente_id, 'SECORP', 'Secorp Seguridad Integral S.A.'),
    (v_cliente_id, 'BIOTEC', 'Biotec Saneamiento Ambiental S.A.'),
    (v_cliente_id, 'VIAL CARRIL', 'Vial Carril Movimientos de Suelo S.A.'),
    (v_cliente_id, 'GEO', 'Geología & Perforaciones S.A.')
  ON CONFLICT (cliente_id, nombre_fantasia) DO UPDATE SET razon_social = EXCLUDED.razon_social;

  SELECT id INTO v_cont_lma FROM public.contratistas WHERE cliente_id = v_cliente_id AND nombre_fantasia = 'LMA Propio';
  SELECT id INTO v_cont_conosur FROM public.contratistas WHERE cliente_id = v_cliente_id AND nombre_fantasia = 'CONOSUR';
  SELECT id INTO v_cont_agv FROM public.contratistas WHERE cliente_id = v_cliente_id AND nombre_fantasia = 'AGV';
  SELECT id INTO v_cont_secorp FROM public.contratistas WHERE cliente_id = v_cliente_id AND nombre_fantasia = 'SECORP';
  SELECT id INTO v_cont_biotec FROM public.contratistas WHERE cliente_id = v_cliente_id AND nombre_fantasia = 'BIOTEC';
  SELECT id INTO v_cont_vial FROM public.contratistas WHERE cliente_id = v_cliente_id AND nombre_fantasia = 'VIAL CARRIL';
  SELECT id INTO v_cont_geo FROM public.contratistas WHERE cliente_id = v_cliente_id AND nombre_fantasia = 'GEO';

  -- 5. Categorías de Área
  SELECT id INTO v_cat_campamento FROM public.categorias_area WHERE nombre ILIKE '%Campamento%' LIMIT 1;
  SELECT id INTO v_cat_taller FROM public.categorias_area WHERE nombre ILIKE '%Taller%' LIMIT 1;
  SELECT id INTO v_cat_planta FROM public.categorias_area WHERE nombre ILIKE '%Planta%' LIMIT 1;
  SELECT id INTO v_cat_admin FROM public.categorias_area WHERE nombre ILIKE '%Admin%' LIMIT 1;

  -- 6. Áreas / Sectores de Litio Minera Argentina (Proyecto Mariana)
  INSERT INTO public.areas (cliente_id, nombre, categoria_area_id, activo)
  VALUES
    (v_cliente_id, 'Cocina', v_cat_campamento, true),
    (v_cliente_id, 'JSC', v_cat_campamento, true),
    (v_cliente_id, 'Campamento', v_cat_campamento, true),
    (v_cliente_id, 'Geología', v_cat_planta, true),
    (v_cliente_id, 'Operaciones 4000', v_cat_planta, true),
    (v_cliente_id, 'MA 26 PP 13.1', v_cat_planta, true),
    (v_cliente_id, 'Terminal - Puesto sur', v_cat_admin, true),
    (v_cliente_id, 'Pozo y Pileta', v_cat_planta, true),
    (v_cliente_id, 'Construcción', v_cat_taller, true),
    (v_cliente_id, 'Mantenimiento', v_cat_taller, true),
    (v_cliente_id, 'Almacén', v_cat_admin, true),
    (v_cliente_id, 'Servicios Auxiliares', v_cat_taller, true),
    (v_cliente_id, 'Ambiente', v_cat_admin, true),
    (v_cliente_id, 'Obrador', v_cat_taller, true),
    (v_cliente_id, 'Área 3100', v_cat_planta, true),
    (v_cliente_id, 'Parque Solar', v_cat_planta, true),
    (v_cliente_id, 'Piletas', v_cat_planta, true),
    (v_cliente_id, 'Área 7800', v_cat_planta, true)
  ON CONFLICT DO NOTHING;

  SELECT id INTO v_area_cocina FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Cocina' LIMIT 1;
  SELECT id INTO v_area_jsc FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'JSC' LIMIT 1;
  SELECT id INTO v_area_campamento FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Campamento' LIMIT 1;
  SELECT id INTO v_area_geologia FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Geología' LIMIT 1;
  SELECT id INTO v_area_operaciones FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Operaciones 4000' LIMIT 1;
  SELECT id INTO v_area_ma26 FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'MA 26 PP 13.1' LIMIT 1;
  SELECT id INTO v_area_terminal FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Terminal - Puesto sur' LIMIT 1;
  SELECT id INTO v_area_pozo FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Pozo y Pileta' LIMIT 1;
  SELECT id INTO v_area_construccion FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Construcción' LIMIT 1;
  SELECT id INTO v_area_mantenimiento FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Mantenimiento' LIMIT 1;
  SELECT id INTO v_area_almacen FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Almacén' LIMIT 1;
  SELECT id INTO v_area_servicios FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Servicios Auxiliares' LIMIT 1;
  SELECT id INTO v_area_ambiente FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Ambiente' LIMIT 1;
  SELECT id INTO v_area_obrador FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Obrador' LIMIT 1;
  SELECT id INTO v_area_3100 FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Área 3100' LIMIT 1;
  SELECT id INTO v_area_parque_solar FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Parque Solar' LIMIT 1;
  SELECT id INTO v_area_piletas FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Piletas' LIMIT 1;
  SELECT id INTO v_area_7800 FROM public.areas WHERE cliente_id = v_cliente_id AND nombre = 'Área 7800' LIMIT 1;

  -- 7. Tipos de Residuo
  SELECT id INTO v_tr_rsu FROM public.tipos_residuo WHERE nombre ILIKE '%RSU%' LIMIT 1;
  SELECT id INTO v_tr_plastico FROM public.tipos_residuo WHERE nombre ILIKE '%Plástico%' LIMIT 1;
  SELECT id INTO v_tr_carton FROM public.tipos_residuo WHERE nombre ILIKE '%Cartón%' LIMIT 1;
  SELECT id INTO v_tr_madera FROM public.tipos_residuo WHERE nombre ILIKE '%Madera%' LIMIT 1;
  SELECT id INTO v_tr_geomembrana FROM public.tipos_residuo WHERE nombre ILIKE '%Geomembrana%' LIMIT 1;
  SELECT id INTO v_tr_chatarra FROM public.tipos_residuo WHERE nombre ILIKE '%Chatarra%' LIMIT 1;
  SELECT id INTO v_tr_tarimas FROM public.tipos_residuo WHERE nombre ILIKE '%Tarimas%' LIMIT 1;
  IF v_tr_tarimas IS NULL THEN v_tr_tarimas := v_tr_madera; END IF;
  SELECT id INTO v_tr_bolsones_kcl FROM public.tipos_residuo WHERE nombre ILIKE '%Bolsones%' LIMIT 1;
  SELECT id INTO v_tr_y8 FROM public.tipos_residuo WHERE codigo_y_id = (SELECT id FROM public.codigos_y WHERE codigo = 'Y8' LIMIT 1) LIMIT 1;
  SELECT id INTO v_tr_y9 FROM public.tipos_residuo WHERE codigo_y_id = (SELECT id FROM public.codigos_y WHERE codigo = 'Y9' LIMIT 1) LIMIT 1;
  SELECT id INTO v_tr_y12 FROM public.tipos_residuo WHERE codigo_y_id = (SELECT id FROM public.codigos_y WHERE codigo = 'Y12' LIMIT 1) LIMIT 1;
  SELECT id INTO v_tr_y48_solidos FROM public.tipos_residuo WHERE nombre ILIKE '%Sólidos Contaminados%' LIMIT 1;
  SELECT id INTO v_tr_y48_suelo FROM public.tipos_residuo WHERE nombre ILIKE '%Suelo Contaminado%' LIMIT 1;
  SELECT id INTO v_tr_y31 FROM public.tipos_residuo WHERE codigo_y_id = (SELECT id FROM public.codigos_y WHERE codigo = 'Y31' LIMIT 1) LIMIT 1;

  -- 8. Limpiar datos previos de LMA en Setiembre 2026 para re-poblar limpiamente
  DELETE FROM public.registros_ingreso WHERE cliente_id = v_cliente_id;
  DELETE FROM public.registros_retiro WHERE cliente_id = v_cliente_id;
  DELETE FROM public.informes_mensuales WHERE cliente_id = v_cliente_id;

  -- ==============================================================================
  -- 9. INSERTAR GENERACIÓN DE SETIEMBRE 2026 (TABLA 7 & TABLA 1 DEL INFORME)
  -- ==============================================================================

  -- LMA Cocina
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES 
    (v_cliente_id, v_area_cocina, v_tr_rsu, v_operador_id, v_cont_lma, 'Chofer Cocina 1', '2026-09-02 11:30:00-03', 1633, 9920.95, v_um_kg, 'completo'),
    (v_cliente_id, v_area_cocina, v_tr_plastico, v_operador_id, v_cont_lma, 'Chofer Cocina 1', '2026-09-03 14:15:00-03', 192, 502.40, v_um_kg, 'completo'),
    (v_cliente_id, v_area_cocina, v_tr_carton, v_operador_id, v_cont_lma, 'Chofer Cocina 2', '2026-09-04 16:40:00-03', 282, 854.75, v_um_kg, 'completo'),
    (v_cliente_id, v_area_cocina, v_tr_chatarra, v_operador_id, v_cont_lma, 'Personal Mantenimiento', '2026-09-10 10:00:00-03', 1, 11.50, v_um_kg, 'completo');

  -- LMA JSC (Campamento / Catering)
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES 
    (v_cliente_id, v_area_jsc, v_tr_rsu, v_operador_id, v_cont_lma, 'Chofer JSC 1', '2026-09-05 09:20:00-03', 1022, 2874.90, v_um_kg, 'completo'),
    (v_cliente_id, v_area_jsc, v_tr_plastico, v_operador_id, v_cont_lma, 'Chofer JSC 1', '2026-09-06 10:10:00-03', 3, 8.60, v_um_kg, 'completo'),
    (v_cliente_id, v_area_jsc, v_tr_carton, v_operador_id, v_cont_lma, 'Chofer JSC 2', '2026-09-07 15:30:00-03', 11, 29.50, v_um_kg, 'completo');

  -- CONOSUR Geologia
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES 
    (v_cliente_id, v_area_geologia, v_tr_rsu, v_operador_id, v_cont_conosur, 'Cuadrilla Conosur', '2026-09-08 12:00:00-03', 81, 1152.90, v_um_kg, 'completo'),
    (v_cliente_id, v_area_geologia, v_tr_plastico, v_operador_id, v_cont_conosur, 'Cuadrilla Conosur', '2026-09-09 13:00:00-03', 25, 71.95, v_um_kg, 'completo'),
    (v_cliente_id, v_area_geologia, v_tr_carton, v_operador_id, v_cont_conosur, 'Cuadrilla Conosur', '2026-09-10 14:00:00-03', 2, 6.00, v_um_kg, 'completo');

  -- LMA Campamento
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES 
    (v_cliente_id, v_area_campamento, v_tr_rsu, v_operador_id, v_cont_lma, 'Chofer Campamento', '2026-09-11 08:30:00-03', 37, 718.85, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_plastico, v_operador_id, v_cont_lma, 'Chofer Campamento', '2026-09-11 11:30:00-03', 1, 5.40, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_carton, v_operador_id, v_cont_lma, 'Chofer Campamento', '2026-09-11 14:00:00-03', 4, 21.20, v_um_kg, 'completo');

  -- LMA Operaciones 4000
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES 
    (v_cliente_id, v_area_operaciones, v_tr_rsu, v_operador_id, v_cont_lma, 'Operador Planta 4000', '2026-09-12 10:00:00-03', 44, 542.30, v_um_kg, 'completo'),
    (v_cliente_id, v_area_operaciones, v_tr_plastico, v_operador_id, v_cont_lma, 'Operador Planta 4000', '2026-09-12 11:00:00-03', 15, 48.15, v_um_kg, 'completo'),
    (v_cliente_id, v_area_operaciones, v_tr_carton, v_operador_id, v_cont_lma, 'Operador Planta 4000', '2026-09-12 14:30:00-03', 3, 9.20, v_um_kg, 'completo'),
    (v_cliente_id, v_area_operaciones, v_tr_bolsones_kcl, v_operador_id, v_cont_lma, 'Operador Planta 4000', '2026-09-12 16:00:00-03', 10, 10.00, v_um_unid, 'completo');

  -- AGV MA 26 PP 13.1 / PP 19
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES 
    (v_cliente_id, v_area_ma26, v_tr_rsu, v_operador_id, v_cont_agv, 'Conductor AGV', '2026-09-13 09:40:00-03', 30, 370.20, v_um_kg, 'completo'),
    (v_cliente_id, v_area_ma26, v_tr_plastico, v_operador_id, v_cont_agv, 'Conductor AGV', '2026-09-13 11:20:00-03', 15, 46.25, v_um_kg, 'completo'),
    (v_cliente_id, v_area_ma26, v_tr_carton, v_operador_id, v_cont_agv, 'Conductor AGV', '2026-09-13 15:00:00-03', 3, 8.20, v_um_kg, 'completo'),
    (v_cliente_id, v_area_ma26, v_tr_chatarra, v_operador_id, v_cont_agv, 'Conductor AGV', '2026-09-14 10:00:00-03', 2, 15.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_ma26, v_tr_geomembrana, v_operador_id, v_cont_agv, 'Conductor AGV', '2026-09-14 11:00:00-03', 1, 6.00, v_um_kg, 'completo');

  -- SECORP Terminal - Puesto Sur
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES 
    (v_cliente_id, v_area_terminal, v_tr_rsu, v_operador_id, v_cont_secorp, 'Guardia Terminal', '2026-09-15 08:00:00-03', 23, 287.30, v_um_kg, 'completo'),
    (v_cliente_id, v_area_terminal, v_tr_plastico, v_operador_id, v_cont_secorp, 'Guardia Terminal', '2026-09-15 10:00:00-03', 6, 15.75, v_um_kg, 'completo'),
    (v_cliente_id, v_area_terminal, v_tr_carton, v_operador_id, v_cont_secorp, 'Guardia Terminal', '2026-09-15 14:00:00-03', 1, 2.10, v_um_kg, 'completo');

  -- LMA Pozos y Piletas & Piletas GEO & Area 7800 (Inertes y RSU)
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES 
    (v_cliente_id, v_area_pozo, v_tr_rsu, v_operador_id, v_cont_lma, 'Operador Pozos', '2026-09-16 09:00:00-03', 22, 264.60, v_um_kg, 'completo'),
    (v_cliente_id, v_area_pozo, v_tr_chatarra, v_operador_id, v_cont_lma, 'Operador Pozos', '2026-09-16 11:00:00-03', 2, 40.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_pozo, v_tr_geomembrana, v_operador_id, v_cont_lma, 'Operador Pozos', '2026-09-16 11:30:00-03', 1, 13.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_piletas, v_tr_geomembrana, v_operador_id, v_cont_geo, 'GEO Cuadrilla', '2026-09-17 10:00:00-03', 1, 18.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_7800, v_tr_geomembrana, v_operador_id, v_cont_lma, 'LMA Mari 2', '2026-09-18 15:00:00-03', 2, 280.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_3100, v_tr_madera, v_operador_id, v_cont_lma, 'LMA Area 3100', '2026-09-19 14:00:00-03', 10, 150.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_3100, v_tr_chatarra, v_operador_id, v_cont_lma, 'LMA Area 3100', '2026-09-19 14:30:00-03', 1, 30.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_construccion, v_tr_rsu, v_operador_id, v_cont_lma, 'LMA Construcción', '2026-09-20 10:00:00-03', 22, 235.05, v_um_kg, 'completo'),
    (v_cliente_id, v_area_construccion, v_tr_plastico, v_operador_id, v_cont_lma, 'LMA Construcción', '2026-09-20 11:30:00-03', 23, 104.50, v_um_kg, 'completo'),
    (v_cliente_id, v_area_construccion, v_tr_carton, v_operador_id, v_cont_lma, 'LMA Construcción', '2026-09-20 15:00:00-03', 11, 51.70, v_um_kg, 'completo'),
    (v_cliente_id, v_area_construccion, v_tr_madera, v_operador_id, v_cont_lma, 'LMA Construcción', '2026-09-20 16:00:00-03', 15, 150.00, v_um_kg, 'completo');

  -- ==============================================================================
  -- 10. INSERTAR RESIDUOS PELIGROSOS (RRPP) DE SETIEMBRE 2026 (TABLA 5 DEL INFORME)
  -- ==============================================================================

  -- Líquidos: Y8 (340 L) e Y9 (405 L)
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES 
    (v_cliente_id, v_area_mantenimiento, v_tr_y8, v_operador_id, v_cont_lma, 'Taller Central LMA', '2026-09-08 14:00:00-03', 1, 340.00, v_um_litros, 'completo'),
    (v_cliente_id, v_area_mantenimiento, v_tr_y9, v_operador_id, v_cont_lma, 'Planta Efluentes / Taller', '2026-09-12 11:00:00-03', 3, 405.00, v_um_litros, 'completo');

  -- Sólidos: Pinturas Y12 (15 kg), Y48 sólidos (1090 kg), Suelos Y48 (1273 kg), Compuesto plomo Y31 (13 unid)
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES 
    (v_cliente_id, v_area_construccion, v_tr_y12, v_operador_id, v_cont_lma, 'Pintores Obra', '2026-09-15 16:00:00-03', 2, 15.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_mantenimiento, v_tr_y48_solidos, v_operador_id, v_cont_lma, 'Mantenimiento Mecánico', '2026-09-18 10:30:00-03', 49, 1090.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_operaciones, v_tr_y48_suelo, v_operador_id, v_cont_lma, 'Remediación Salar', '2026-09-22 17:00:00-03', 11, 1273.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_mantenimiento, v_tr_y31, v_operador_id, v_cont_lma, 'Electricidad & Baterías', '2026-09-25 15:00:00-03', 1, 13.00, v_um_unid, 'completo');

  -- ==============================================================================
  -- 11. INSERTAR DESVÍOS OPERATIVOS (TABLA 4 DEL INFORME)
  -- ==============================================================================

  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, es_desvio, motivo_desvio, observaciones, estado)
  VALUES 
    (v_cliente_id, v_area_cocina, v_tr_rsu, v_operador_id, v_cont_lma, 'JSC Cocina', '2026-09-04 18:00:00-03', 29, 79.70, v_um_kg, true, 'Decomiso', 'Alimentos vencidos decomisados del servicio de comedor', 'completo'),
    (v_cliente_id, v_area_geologia, v_tr_rsu, v_operador_id, v_cont_conosur, 'Cono Sur Chofer', '2026-09-11 17:30:00-03', 1, 5.30, v_um_kg, true, 'Mezcla c/ reciclable', 'Bolsa negra con botellas plásticas sin separar en origen', 'completo'),
    (v_cliente_id, v_area_mantenimiento, v_tr_plastico, v_operador_id, v_cont_lma, 'LMA Mantenimiento', '2026-09-17 11:20:00-03', 2, 16.10, v_um_kg, true, 'Mezcla c/ inerte', 'Bolsón de reciclables con retazos de mangueras y alambres', 'completo'),
    (v_cliente_id, v_area_mantenimiento, v_tr_y48_solidos, v_operador_id, v_cont_lma, 'LMA Mantenimiento', '2026-09-24 16:45:00-03', 1, 7.50, v_um_kg, true, 'Mezcla de Y48', 'Presencia de trapos impregnados con hidrocarburo en bolsa común', 'completo');

  -- ==============================================================================
  -- 12. INSERTAR HISTÓRICO MULTIMENSUAL (MARZO A AGOSTO 2026 PARA TABLA 2 Y 6)
  -- ==============================================================================

  -- Marzo
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES
    (v_cliente_id, v_area_campamento, v_tr_rsu, v_operador_id, v_cont_lma, 'Histórico', '2026-03-15 12:00:00-03', 2894, 17798.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_plastico, v_operador_id, v_cont_lma, 'Histórico', '2026-03-15 12:00:00-03', 273, 830.35, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_carton, v_operador_id, v_cont_lma, 'Histórico', '2026-03-15 12:00:00-03', 391, 1368.40, v_um_kg, 'completo'),
    (v_cliente_id, v_area_mantenimiento, v_tr_y8, v_operador_id, v_cont_lma, 'Histórico', '2026-03-15 12:00:00-03', 1, 1865.00, v_um_litros, 'completo');

  -- Abril
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES
    (v_cliente_id, v_area_campamento, v_tr_rsu, v_operador_id, v_cont_lma, 'Histórico', '2026-04-15 12:00:00-03', 2569, 15027.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_plastico, v_operador_id, v_cont_lma, 'Histórico', '2026-04-15 12:00:00-03', 257, 634.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_carton, v_operador_id, v_cont_lma, 'Histórico', '2026-04-15 12:00:00-03', 280, 1021.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_mantenimiento, v_tr_y8, v_operador_id, v_cont_lma, 'Histórico', '2026-04-15 12:00:00-03', 1, 360.00, v_um_litros, 'completo');

  -- Mayo
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES
    (v_cliente_id, v_area_campamento, v_tr_rsu, v_operador_id, v_cont_lma, 'Histórico', '2026-05-15 12:00:00-03', 3018, 17197.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_plastico, v_operador_id, v_cont_lma, 'Histórico', '2026-05-15 12:00:00-03', 399, 954.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_carton, v_operador_id, v_cont_lma, 'Histórico', '2026-05-15 12:00:00-03', 407, 1396.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_mantenimiento, v_tr_y8, v_operador_id, v_cont_lma, 'Histórico', '2026-05-15 12:00:00-03', 1, 470.00, v_um_litros, 'completo');

  -- Junio
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES
    (v_cliente_id, v_area_campamento, v_tr_rsu, v_operador_id, v_cont_lma, 'Histórico', '2026-06-15 12:00:00-03', 2673, 14468.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_plastico, v_operador_id, v_cont_lma, 'Histórico', '2026-06-15 12:00:00-03', 255, 707.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_carton, v_operador_id, v_cont_lma, 'Histórico', '2026-06-15 12:00:00-03', 315, 1100.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_mantenimiento, v_tr_y8, v_operador_id, v_cont_lma, 'Histórico', '2026-06-15 12:00:00-03', 1, 2010.00, v_um_litros, 'completo');

  -- Julio
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES
    (v_cliente_id, v_area_campamento, v_tr_rsu, v_operador_id, v_cont_lma, 'Histórico', '2026-07-15 12:00:00-03', 2559, 14613.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_plastico, v_operador_id, v_cont_lma, 'Histórico', '2026-07-15 12:00:00-03', 258, 711.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_carton, v_operador_id, v_cont_lma, 'Histórico', '2026-07-15 12:00:00-03', 379, 1097.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_mantenimiento, v_tr_y8, v_operador_id, v_cont_lma, 'Histórico', '2026-07-15 12:00:00-03', 1, 650.00, v_um_litros, 'completo');

  -- Agosto
  INSERT INTO public.registros_ingreso (cliente_id, area_id, tipo_residuo_id, operador_id, contratista_id, depositante_nombre, fecha_hora_ingreso, cantidad_bultos, peso, unidad_medida_id, estado)
  VALUES
    (v_cliente_id, v_area_campamento, v_tr_rsu, v_operador_id, v_cont_lma, 'Histórico', '2026-08-15 12:00:00-03', 2752, 16109.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_plastico, v_operador_id, v_cont_lma, 'Histórico', '2026-08-15 12:00:00-03', 301, 931.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_campamento, v_tr_carton, v_operador_id, v_cont_lma, 'Histórico', '2026-08-15 12:00:00-03', 359, 1310.00, v_um_kg, 'completo'),
    (v_cliente_id, v_area_operaciones, v_tr_y48_suelo, v_operador_id, v_cont_lma, 'Histórico', '2026-08-15 12:00:00-03', 2, 65.00, v_um_kg, 'completo');

  -- ==============================================================================
  -- 13. RETIROS DE RESIDUOS DE SITIO (TABLA 3 & TABLA 9 DEL INFORME)
  -- ==============================================================================

  INSERT INTO public.registros_retiro (cliente_id, tipo_residuo_id, fecha_retiro, numero_remito, cantidad, unidad_medida_id, lugar_egreso, empresa_transportista, autorizado_por, responsable_patio)
  VALUES
    (v_cliente_id, v_tr_rsu, '2026-09-07', '0002-00000488', 7020.00, v_um_kg, 'Patio de RSU', 'Smart Waste', 'Hernan Banbuira', 'Alejandro'),
    (v_cliente_id, v_tr_tarimas, '2026-09-13', '0002-00000845', 64.00, v_um_unid, 'Patio de CME', 'LMA Almacén', 'Hernan Banbuira', 'Mauro'),
    (v_cliente_id, v_tr_bolsones_kcl, '2026-09-13', '0002-00000845', 7.00, v_um_unid, 'Patio de RSU', 'LMA Almacén', 'Hernan Banbuira', 'Mauro'),
    (v_cliente_id, v_tr_y8, '2026-09-16', '0002-00000846', 7000.00, v_um_litros, 'Patio de RRPP', 'LSA Transportes', 'Hernan Banbuira', 'Alejandro'),
    (v_cliente_id, v_tr_y9, '2026-09-16', '0002-00000846', 5000.00, v_um_litros, 'Patio de RRPP', 'LSA Transportes', 'Hernan Banbuira', 'Alejandro'),
    (v_cliente_id, v_tr_rsu, '2026-09-16', '0002-00000845', 3140.00, v_um_kg, 'Patio de RSU', 'Smart Waste', 'Hernan Banbuira', 'Alejandro'),
    (v_cliente_id, v_tr_plastico, '2026-09-17', '0002-00000547', 2120.00, v_um_kg, 'Patio de RSU', 'Smart Waste', 'Hernan Banbuira', 'Alejandro'),
    (v_cliente_id, v_tr_rsu, '2026-09-17', '0002-00000493', 3140.00, v_um_kg, 'Parque Solar', 'Smart Waste', 'Hernan Banbuira', 'Alejandro'),
    (v_cliente_id, v_tr_rsu, '2026-09-22', '0002-00000493', 9920.00, v_um_kg, 'Patio de RSU', 'Smart Waste', 'Hernan Banbuira', 'Angel Rozo'),
    (v_cliente_id, v_tr_rsu, '2026-09-24', '0002-00000847', 2060.00, v_um_kg, 'Parque Solar', 'Smart Waste', 'Maria Diaz', 'Angel Rozo'),
    (v_cliente_id, v_tr_rsu, '2026-09-30', '0002-00000796', 1560.00, v_um_kg, 'Patio de RSU', 'Smart Waste', 'Hernan Banbuira', 'Angel Rozo'),
    (v_cliente_id, v_tr_rsu, '2026-09-30', '0002-00000797', 1980.00, v_um_kg, 'Parque Solar', 'Smart Waste', 'Maria Diaz', 'Angel Rozo');

  -- ==============================================================================
  -- 14. METADATOS Y BITÁCORA DEL INFORME MENSUAL N° 7 (SETIEMBRE 2026)
  -- ==============================================================================

  INSERT INTO public.informes_mensuales (
    cliente_id, 
    periodo_anio, 
    periodo_mes, 
    numero_informe, 
    titulo, 
    ocupacion_patio_rsu_pct, 
    ocupacion_patio_rrpp_pct, 
    tareas_sitio, 
    conclusiones, 
    creado_por
  )
  VALUES (
    v_cliente_id,
    2026,
    9,
    7,
    'Informe Mensual de Gestión de Residuos No Peligrosos y Peligrosos - Proyecto Mariana',
    20.00,
    30.00,
    jsonb_build_array(
      'Recepción, pesaje y carga de RSU en la compactadora.',
      'Recepción, pesaje y carga de PET, cartón y papel en la compactadora.',
      'Recepción, pesaje y segregación de residuos peligrosos (RRPP).',
      'Acondicionamiento, orden y limpieza del Patio de RSU.',
      'Acondicionamiento, orden y limpieza del Patio de RRPP.',
      'Enfardado de bolsones Big Bags de KCL y compactación de rollos de cartón.',
      'Corte y traslado de geomembranas en Mari 2 hacia Patio de residuos.',
      'Muestreo y remediación de suelo contaminado con hidrocarburos (Y48).',
      'Cortes de telas y mangueras para muestra de laboratorio.',
      'Carga de camiones con fardos, pallets y tambores de retiro oficial.',
      'Soporte a Medio Ambiente: armado de 40 kits antiderrames para camionetas de faena.',
      'Soporte en Planta de Efluentes: lectura de caudalímetro, cambio de soplador, purga y limpieza de sedimentadores.'
    ),
    '➢ En Setiembre se generaron 16.959 kg de RSU, 1.267 kg de Cartón y 984 kg de Plástico en LMA.' || chr(10) ||
    '➢ Los sectores de mayor generación de RSU en sitio son la Cocina y Campamento de JSC.' || chr(10) ||
    '➢ Se detectaron 3 (tres) desvíos de RSU y 1 de RRPP, procediendo a su readecuación y registro en bitácora.' || chr(10) ||
    '➢ La categoría de RRPP de mayor generación en este mes fueron los suelos contaminados (Y48).' || chr(10) ||
    '➢ Se realizaron 7 retiros de residuos del Proyecto hacia destino final autorizado.' || chr(10) ||
    '➢ Tanto el Patio de RSU como el de RRPP se mantienen en condiciones óptimas de orden y limpieza con Baja Ocupación (20% y 30%).',
    v_operador_id
  )
  ON CONFLICT (cliente_id, periodo_anio, periodo_mes) DO UPDATE SET
    numero_informe = EXCLUDED.numero_informe,
    ocupacion_patio_rsu_pct = EXCLUDED.ocupacion_patio_rsu_pct,
    ocupacion_patio_rrpp_pct = EXCLUDED.ocupacion_patio_rrpp_pct,
    tareas_sitio = EXCLUDED.tareas_sitio,
    conclusiones = EXCLUDED.conclusiones;

END $$;
