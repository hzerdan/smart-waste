CREATE TABLE public.fotos_ingreso (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    registro_id BIGINT NOT NULL REFERENCES public.registros_ingreso(id) ON DELETE CASCADE,
    storage_path text NOT NULL,
    subida_por_operador boolean NOT NULL DEFAULT false,
    magic_link_id BIGINT REFERENCES public.magic_links(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT foto_origen_valido CHECK (
        (subida_por_operador = true AND magic_link_id IS NULL) OR
        (subida_por_operador = false AND magic_link_id IS NOT NULL)
    )
);
