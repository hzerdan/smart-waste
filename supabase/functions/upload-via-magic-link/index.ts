import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  // Manejo de preflight CORS (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método no permitido. Utilizar POST." }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Leer el contenido multipart/form-data
    const contentType = req.headers.get("content-type") || ""
    if (!contentType.includes("multipart/form-data")) {
      return new Response(JSON.stringify({ error: "Tipo de contenido inválido. Utilizar multipart/form-data." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const formData = await req.formData()
    const token = formData.get("token") as string
    const files = formData.getAll("files") as File[]

    if (!token) {
      return new Response(JSON.stringify({ error: "Falta el token de acceso." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: "No se enviaron archivos para subir." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    if (files.length > 5) {
      return new Response(JSON.stringify({ error: "Límite superado. Máximo 5 archivos por llamada." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Inicializar cliente Supabase con privilegios service_role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validar token llamando a la RPC
    const { data: validationData, error: validationError } = await supabase
      .rpc("validate_magic_link", { p_token: token })
      .single()

    if (validationError || !validationData) {
      return new Response(JSON.stringify({ error: "Error interno al validar token." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { valido, registro_id, mensaje } = validationData as {
      valido: boolean
      registro_id: number | null
      mensaje: string
    }

    if (!valido || !registro_id) {
      return new Response(JSON.stringify({ error: mensaje }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const uploadedPaths: string[] = []

    // Validar y subir cada archivo
    for (const file of files) {
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB > 10) {
        return new Response(JSON.stringify({ error: `Archivo ${file.name} supera el límite de 10MB.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
      if (!allowedTypes.includes(file.type)) {
        return new Response(JSON.stringify({ error: `Tipo de archivo no permitido: ${file.type}. Solo se aceptan JPEG, PNG y WEBP.` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // Nombre sanitizado y timestamp para evitar colisiones
      const timestamp = new Date().getTime()
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const storagePath = `${registro_id}/depositante/${timestamp}_${sanitizedName}`

      // Subir archivo a Storage
      const { error: uploadError } = await supabase.storage
        .from("residuos-fotos")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: true,
        })

      if (uploadError) {
        console.error("Error subiendo foto:", uploadError)
        return new Response(JSON.stringify({ error: `Error al subir el archivo ${file.name} a Storage.` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      uploadedPaths.push(storagePath)
    }

    // Marcar enlace como usado y registrar fotos en la base de datos
    const { error: markError } = await supabase.rpc("mark_magic_link_used", {
      p_token: token,
      p_foto_paths: uploadedPaths,
    })

    if (markError) {
      console.error("Error al marcar token usado:", markError)
      return new Response(JSON.stringify({ error: "Error al finalizar el flujo del token en base de datos." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true, fotos_subidas: uploadedPaths.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error("Error general en edge function:", err)
    return new Response(JSON.stringify({ error: "Error del servidor al procesar la solicitud." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
