CREATE TABLE public.clientes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    razon_social text NOT NULL,
    cuit text UNIQUE NOT NULL,
    email_contacto text,
    telefono text,
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.areas (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nombre text NOT NULL,
    categoria_area_id INTEGER REFERENCES public.categorias_area(id),
    descripcion text,
    activo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    CONSTRAINT uq_area_por_cliente UNIQUE(cliente_id, nombre)
);
