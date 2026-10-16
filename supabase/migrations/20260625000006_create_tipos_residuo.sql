CREATE TABLE public.tipos_residuo (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text UNIQUE NOT NULL,
    descripcion text,
    requiere_foto boolean DEFAULT false,
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
