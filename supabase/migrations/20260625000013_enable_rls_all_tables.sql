-- Habilitar RLS en todas las tablas
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_area ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipos_residuo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registros_ingreso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.magic_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_ingreso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisor_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operador_cliente ENABLE ROW LEVEL SECURITY;

-- Helpers/Políticas globales para ADMIN y SUPERVISOR GLOBAL
CREATE POLICY admin_all ON public.roles FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- ROLES
CREATE POLICY roles_select ON public.roles FOR SELECT TO authenticated USING (true);

-- PROFILES
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
USING (
    id = auth.uid() OR
    auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global') OR
    (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND rol_id = 4) -- puede ver perfiles de operadores (rol_id = 4 es operador)
);
CREATE POLICY profiles_admin ON public.profiles FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- CATEGORIAS_AREA
CREATE POLICY categorias_select ON public.categorias_area FOR SELECT TO authenticated USING (true);
CREATE POLICY categorias_admin ON public.categorias_area FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- CLIENTES
CREATE POLICY clientes_select ON public.clientes FOR SELECT TO authenticated
USING (
    auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global') OR
    (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND id = (auth.jwt() ->> 'cliente_id')::integer) OR
    (auth.jwt() ->> 'user_role' = 'operador' AND (
        NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()) OR
        id IN (SELECT cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid())
    ))
);
CREATE POLICY clientes_admin ON public.clientes FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- AREAS
CREATE POLICY areas_select ON public.areas FOR SELECT TO authenticated
USING (
    auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global') OR
    (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND cliente_id = (auth.jwt() ->> 'cliente_id')::integer) OR
    (auth.jwt() ->> 'user_role' = 'operador' AND (
        NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()) OR
        cliente_id IN (SELECT cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid())
    ))
);
CREATE POLICY areas_admin ON public.areas FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- TIPOS_RESIDUO
CREATE POLICY tipos_residuo_select ON public.tipos_residuo FOR SELECT TO authenticated USING (true);
CREATE POLICY tipos_residuo_admin ON public.tipos_residuo FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- REGISTROS_INGRESO
CREATE POLICY registros_select ON public.registros_ingreso FOR SELECT TO authenticated
USING (
    auth.jwt() ->> 'user_role' IN ('administrador', 'supervisor_global') OR
    (auth.jwt() ->> 'user_role' = 'supervisor_cliente' AND cliente_id = (auth.jwt() ->> 'cliente_id')::integer) OR
    (auth.jwt() ->> 'user_role' = 'operador' AND (
        NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()) OR
        cliente_id IN (SELECT cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid())
    ))
);
CREATE POLICY registros_insert ON public.registros_ingreso FOR INSERT TO authenticated
WITH CHECK (
    auth.jwt() ->> 'user_role' = 'operador' AND (
        NOT EXISTS (SELECT 1 FROM public.operador_cliente WHERE profile_id = auth.uid()) OR
        cliente_id IN (SELECT cliente_id FROM public.operador_cliente WHERE profile_id = auth.uid())
    )
);
CREATE POLICY registros_update ON public.registros_ingreso FOR UPDATE TO authenticated
USING (
    auth.jwt() ->> 'user_role' = 'operador' AND operador_id = auth.uid()
);
CREATE POLICY registros_admin ON public.registros_ingreso FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- MAGIC_LINKS
CREATE POLICY magic_links_operador ON public.magic_links FOR ALL TO authenticated
USING (
    auth.jwt() ->> 'user_role' = 'operador' AND generado_por = auth.uid()
)
WITH CHECK (
    auth.jwt() ->> 'user_role' = 'operador' AND generado_por = auth.uid()
);
CREATE POLICY magic_links_admin ON public.magic_links FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- FOTOS_INGRESO
CREATE POLICY fotos_select ON public.fotos_ingreso FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.registros_ingreso r
        WHERE r.id = registro_id
    )
);
CREATE POLICY fotos_insert_operador ON public.fotos_ingreso FOR INSERT TO authenticated
WITH CHECK (
    auth.jwt() ->> 'user_role' = 'operador' AND subida_por_operador = true AND magic_link_id IS NULL
);
CREATE POLICY fotos_admin ON public.fotos_ingreso FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- SUPERVISOR_CLIENTE
CREATE POLICY supervisor_cliente_select ON public.supervisor_cliente FOR SELECT TO authenticated USING (true);
CREATE POLICY supervisor_cliente_admin ON public.supervisor_cliente FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');

-- OPERADOR_CLIENTE
CREATE POLICY operador_cliente_select ON public.operador_cliente FOR SELECT TO authenticated USING (true);
CREATE POLICY operador_cliente_admin ON public.operador_cliente FOR ALL TO authenticated USING (auth.jwt() ->> 'user_role' = 'administrador');
