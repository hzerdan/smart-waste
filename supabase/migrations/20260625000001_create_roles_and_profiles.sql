CREATE TABLE public.roles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre text UNIQUE NOT NULL,
    descripcion text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rol_id INTEGER REFERENCES public.roles(id),
    nombre_completo text NOT NULL,
    email text NOT NULL,
    activo boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

INSERT INTO public.roles (nombre, descripcion) VALUES
    ('administrador', 'Acceso total al sistema'),
    ('supervisor_global', 'Dashboard consolidado de todos los clientes'),
    ('supervisor_cliente', 'Dashboard de su empresa únicamente'),
    ('operador', 'Registro de ingresos y generación de magic links');
