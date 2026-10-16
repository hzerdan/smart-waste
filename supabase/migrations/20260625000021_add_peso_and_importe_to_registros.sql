-- Migración 21: Agregar campos 'peso' e 'importe' a public.registros_ingreso y actualizar datos de muestra

-- 1. Agregar columnas en public.registros_ingreso
ALTER TABLE public.registros_ingreso
ADD COLUMN IF NOT EXISTS peso numeric(12, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS importe numeric(14, 2) DEFAULT NULL;

COMMENT ON COLUMN public.registros_ingreso.peso IS 'Peso del residuo en kilogramos (kg)';
COMMENT ON COLUMN public.registros_ingreso.importe IS 'Importe o costo monetario asociado al ingreso (opcional)';

-- 2. Poblar los registros de ingreso existentes con pesos e importes realistas
UPDATE public.registros_ingreso r
SET 
  peso = CASE 
    WHEN tr.nombre = 'Chatarra Metálica' THEN ROUND((RANDOM() * 2000 + 1500)::numeric, 2)
    WHEN tr.nombre = 'Residuos Peligrosos / Hidrocarburos' THEN ROUND((RANDOM() * 800 + 400)::numeric, 2)
    WHEN tr.nombre = 'Baterías y RAEE' THEN ROUND((RANDOM() * 600 + 200)::numeric, 2)
    WHEN tr.nombre = 'Plásticos / PET' THEN ROUND((RANDOM() * 500 + 150)::numeric, 2)
    WHEN tr.nombre = 'Cartón y Papel' THEN ROUND((RANDOM() * 400 + 100)::numeric, 2)
    WHEN tr.nombre = 'Orgánicos / Comedor' THEN ROUND((RANDOM() * 700 + 250)::numeric, 2)
    ELSE ROUND((RANDOM() * 500 + 100)::numeric, 2)
  END,
  importe = CASE
    WHEN r.id % 4 = 0 THEN NULL -- Algunos registros quedan sin importe para testear opcionalidad
    ELSE ROUND((RANDOM() * 85000 + 15000)::numeric, 2)
  END
FROM public.tipos_residuo tr
WHERE r.tipo_residuo_id = tr.id;
