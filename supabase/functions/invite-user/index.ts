import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
}

Deno.serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado. Token de autorización ausente." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Inicializar cliente Supabase con credenciales de servicio exclusivas de Deno.env
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: "Variables de entorno de servidor no configuradas." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Validar token del usuario autenticado que realiza la llamada
    const token = authHeader.replace("Bearer ", "").trim()
    const { data: { user: callerUser }, error: callerError } = await supabaseAdmin.auth.getUser(token)

    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Sesión inválida o expirada." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // Validar que el usuario que llama tenga el rol de 'administrador'
    const { data: callerProfile, error: profileCheckError } = await supabaseAdmin
      .from("profiles")
      .select("rol_id, roles(nombre)")
      .eq("id", callerUser.id)
      .single()

    const roleName = (callerProfile as { roles?: { nombre: string } | null })?.roles?.nombre

    if (profileCheckError || roleName !== "administrador") {
      return new Response(
        JSON.stringify({ error: "Acceso denegado. Se requiere rol de Administrador para esta operación." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    // Procesar cuerpo de la petición
    const body = await req.json().catch(() => ({}))
    const action = body.action || "invite"

    // ACCIÓN 1: Listar usuarios con estado de invitación
    if (action === "list") {
      // 1. Obtener usuarios de auth.users (para verificar invited_at vs confirmed_at)
      const { data: authData, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000,
      })

      if (authListError) {
        return new Response(JSON.stringify({ error: authListError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      // 2. Obtener perfiles de public.profiles
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select(`
          id,
          nombre_completo,
          email,
          rol_id,
          activo,
          created_at,
          roles(id, nombre, descripcion),
          supervisor_cliente(cliente_id, clientes(id, razon_social)),
          operador_cliente(cliente_id, clientes(id, razon_social))
        `)
        .order("created_at", { ascending: false })

      if (profilesError) {
        return new Response(JSON.stringify({ error: profilesError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const authMap = new Map<string, { invited_at?: string | null; confirmed_at?: string | null }>()
      for (const u of authData.users) {
        authMap.set(u.id, {
          invited_at: u.invited_at,
          confirmed_at: u.confirmed_at,
        })
      }

      const enrichedUsers = (profilesData || []).map((p: any) => {
        const authInfo = authMap.get(p.id)
        const isPending = !!(authInfo?.invited_at && !authInfo?.confirmed_at)
        const supervisorRel = Array.isArray(p.supervisor_cliente)
          ? p.supervisor_cliente[0]
          : p.supervisor_cliente
        const operadorRel = Array.isArray(p.operador_cliente)
          ? p.operador_cliente[0]
          : p.operador_cliente

        const clientRel = supervisorRel || operadorRel

        return {
          id: p.id,
          nombre_completo: p.nombre_completo,
          email: p.email,
          rol_id: p.rol_id,
          rol_nombre: p.roles?.nombre || null,
          rol_descripcion: p.roles?.descripcion || null,
          cliente_id: clientRel?.cliente_id || null,
          cliente_nombre: clientRel?.clientes?.razon_social || null,
          activo: p.activo,
          invitacion_pendiente: isPending,
          created_at: p.created_at,
        }
      })

      return new Response(JSON.stringify({ success: true, users: enrichedUsers }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // ACCIÓN 2: Invitar nuevo usuario
    if (action === "invite") {
      const { email, nombre_completo, rol_id, cliente_id } = body

      if (!email || !nombre_completo || !rol_id) {
        return new Response(
          JSON.stringify({ error: "Faltan datos obligatorios (email, nombre_completo, rol_id)." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }

      const roleIdNum = Number(rol_id)

      // Validar si el rol es supervisor_cliente (ID 3) u operador de cliente (ID 4)
      if ((roleIdNum === 3 || roleIdNum === 4) && !cliente_id) {
        return new Response(
          JSON.stringify({ error: "El cliente asignado es obligatorio para este rol." }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        )
      }

      const cleanEmail = String(email).trim().toLowerCase()
      const cleanNombre = String(nombre_completo).trim()
      const redirectTo = body.redirect_to || "http://localhost:5173/establecer-password"

      // Enviar invitación vía Supabase Auth Admin
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        cleanEmail,
        {
          redirectTo,
          data: {
            nombre_completo: cleanNombre,
          },
        }
      )

      if (inviteError) {
        return new Response(JSON.stringify({ error: inviteError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const newUserId = inviteData.user.id

      // Upsert perfil
      const { error: profileUpsertError } = await supabaseAdmin
        .from("profiles")
        .upsert({
          id: newUserId,
          nombre_completo: cleanNombre,
          email: cleanEmail,
          rol_id: roleIdNum,
          activo: true,
          updated_at: new Date().toISOString(),
        })

      if (profileUpsertError) {
        console.error("Error upserting profile:", profileUpsertError)
      }

      // Si es supervisor_cliente, asociar en supervisor_cliente
      if (roleIdNum === 3 && cliente_id) {
        const { error: scError } = await supabaseAdmin
          .from("supervisor_cliente")
          .upsert({
            profile_id: newUserId,
            cliente_id: Number(cliente_id),
          })

        if (scError) {
          console.error("Error linking supervisor_cliente:", scError)
        }
      }

      // Si es operador de cliente, asociar en operador_cliente
      if (roleIdNum === 4 && cliente_id) {
        const { error: ocError } = await supabaseAdmin
          .from("operador_cliente")
          .upsert({
            profile_id: newUserId,
            cliente_id: Number(cliente_id),
          })

        if (ocError) {
          console.error("Error linking operador_cliente:", ocError)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Invitación enviada con éxito a ${cleanEmail}.`,
          user: inviteData.user,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    return new Response(JSON.stringify({ error: "Acción no reconocida." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error interno del servidor"
    console.error("Error en invite-user:", err)
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
