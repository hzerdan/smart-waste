CREATE TABLE public.magic_links (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token text UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
    registro_id BIGINT NOT NULL REFERENCES public.registros_ingreso(id) ON DELETE CASCADE,
    generado_por UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    usado boolean DEFAULT false,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '2 hours'),
    used_at timestamptz,
    created_at timestamptz DEFAULT now()
);
