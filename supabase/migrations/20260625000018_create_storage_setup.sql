-- Inicializar el bucket privado de fotos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'residuos-fotos',
    'residuos-fotos',
    false, -- Privado: requiere signed URLs para lectura externa
    10485760, -- Límite de 10MB por archivo
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;


-- Política de subida (INSERT) para operadores autenticados
-- Verifica que suban a: /{registro_id}/operador/{filename}
-- Y que el registro_id corresponda a un registro que pueden visualizar según RLS
CREATE POLICY "Permitir subida a operadores autorizados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'residuos-fotos' AND
    (auth.jwt() ->> 'user_role') = 'operador' AND
    (storage.foldername(name))[1] ~ '^[0-9]+$' AND
    (storage.foldername(name))[2] = 'operador' AND
    EXISTS (
        SELECT 1 FROM public.registros_ingreso r
        WHERE r.id = ((storage.foldername(name))[1])::bigint
    )
);

-- Política de lectura (SELECT) para usuarios autenticados
-- Permite leer a cualquier usuario autenticado con permisos sobre el registro de ingreso
CREATE POLICY "Permitir lectura de fotos de registros accesibles"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'residuos-fotos' AND
    (storage.foldername(name))[1] ~ '^[0-9]+$' AND
    EXISTS (
        SELECT 1 FROM public.registros_ingreso r
        WHERE r.id = ((storage.foldername(name))[1])::bigint
    )
);
