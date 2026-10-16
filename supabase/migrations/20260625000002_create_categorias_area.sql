CREATE TABLE public.categorias_area (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text UNIQUE NOT NULL,
    descripcion text,
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
