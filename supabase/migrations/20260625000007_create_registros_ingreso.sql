CREATE TABLE public.registros_ingreso (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE RESTRICT,
    area_id INTEGER NOT NULL REFERENCES public.areas(id) ON DELETE RESTRICT,
    tipo_residuo_id INTEGER NOT NULL REFERENCES public.tipos_residuo(id) ON DELETE RESTRICT,
    operador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    depositante_nombre text NOT NULL,
    depositante_referencia text,
    fecha_hora_ingreso timestamptz NOT NULL DEFAULT now(),
    observaciones text,
    estado text NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'completo', 'con_observaciones'
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
