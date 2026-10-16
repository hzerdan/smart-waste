CREATE TABLE public.supervisor_cliente (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT uq_supervisor_cliente UNIQUE(profile_id, cliente_id)
);
