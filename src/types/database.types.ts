export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          activo: boolean | null
          categoria_area_id: number | null
          cliente_id: number
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          categoria_area_id?: number | null
          cliente_id: number
          created_at?: string | null
          descripcion?: string | null
          id?: never
          nombre: string
        }
        Update: {
          activo?: boolean | null
          categoria_area_id?: number | null
          cliente_id?: number
          created_at?: string | null
          descripcion?: string | null
          id?: never
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_categoria_area_id_fkey"
            columns: ["categoria_area_id"]
            isOneToOne: false
            referencedRelation: "categorias_area"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "areas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_area: {
        Row: {
          activo: boolean | null
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: never
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          id?: never
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      clasificaciones_residuo: {
        Row: {
          activo: boolean
          codigo: string
          color_hex: string
          created_at: string
          descripcion: string | null
          id: number
          nombre: string
          orden_reporte: number
        }
        Insert: {
          activo?: boolean
          codigo: string
          color_hex?: string
          created_at?: string
          descripcion?: string | null
          id?: never
          nombre: string
          orden_reporte?: number
        }
        Update: {
          activo?: boolean
          codigo?: string
          color_hex?: string
          created_at?: string
          descripcion?: string | null
          id?: never
          nombre?: string
          orden_reporte?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean | null
          created_at: string | null
          cuit: string
          email_contacto: string | null
          id: number
          razon_social: string
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          cuit: string
          email_contacto?: string | null
          id?: never
          razon_social: string
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          cuit?: string
          email_contacto?: string | null
          id?: never
          razon_social?: string
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      codigos_y: {
        Row: {
          activo: boolean
          codigo: string
          corriente_normativa: string
          created_at: string
          descripcion_legal: string
          id: number
          nombre_comun: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          corriente_normativa?: string
          created_at?: string
          descripcion_legal: string
          id?: never
          nombre_comun: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          corriente_normativa?: string
          created_at?: string
          descripcion_legal?: string
          id?: never
          nombre_comun?: string
        }
        Relationships: []
      }
      contratistas: {
        Row: {
          activo: boolean
          cliente_id: number
          contacto: string | null
          created_at: string
          cuit: string | null
          id: number
          nombre_fantasia: string
          razon_social: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cliente_id: number
          contacto?: string | null
          created_at?: string
          cuit?: string | null
          id?: never
          nombre_fantasia: string
          razon_social?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cliente_id?: number
          contacto?: string | null
          created_at?: string
          cuit?: string | null
          id?: never
          nombre_fantasia?: string
          razon_social?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contratistas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      fotos_ingreso: {
        Row: {
          created_at: string | null
          id: number
          magic_link_id: number | null
          registro_id: number
          storage_path: string
          subida_por_operador: boolean
        }
        Insert: {
          created_at?: string | null
          id?: never
          magic_link_id?: number | null
          registro_id: number
          storage_path: string
          subida_por_operador?: boolean
        }
        Update: {
          created_at?: string | null
          id?: never
          magic_link_id?: number | null
          registro_id?: number
          storage_path?: string
          subida_por_operador?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fotos_ingreso_magic_link_id_fkey"
            columns: ["magic_link_id"]
            isOneToOne: false
            referencedRelation: "magic_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fotos_ingreso_registro_id_fkey"
            columns: ["registro_id"]
            isOneToOne: false
            referencedRelation: "registros_ingreso"
            referencedColumns: ["id"]
          },
        ]
      }
      informes_mensuales: {
        Row: {
          cliente_id: number
          conclusiones: string | null
          creado_por: string | null
          created_at: string
          id: number
          numero_informe: number | null
          ocupacion_patio_rrpp_pct: number | null
          ocupacion_patio_rsu_pct: number | null
          periodo_anio: number
          periodo_mes: number
          tareas_sitio: Json
          titulo: string
          updated_at: string
        }
        Insert: {
          cliente_id: number
          conclusiones?: string | null
          creado_por?: string | null
          created_at?: string
          id?: never
          numero_informe?: number | null
          ocupacion_patio_rrpp_pct?: number | null
          ocupacion_patio_rsu_pct?: number | null
          periodo_anio: number
          periodo_mes: number
          tareas_sitio?: Json
          titulo?: string
          updated_at?: string
        }
        Update: {
          cliente_id?: number
          conclusiones?: string | null
          creado_por?: string | null
          created_at?: string
          id?: never
          numero_informe?: number | null
          ocupacion_patio_rrpp_pct?: number | null
          ocupacion_patio_rsu_pct?: number | null
          periodo_anio?: number
          periodo_mes?: number
          tareas_sitio?: Json
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "informes_mensuales_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "informes_mensuales_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_links: {
        Row: {
          created_at: string | null
          expires_at: string
          generado_por: string
          id: number
          registro_id: number
          token: string
          usado: boolean | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          generado_por: string
          id?: never
          registro_id: number
          token?: string
          usado?: boolean | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          generado_por?: string
          id?: never
          registro_id?: number
          token?: string
          usado?: boolean | null
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "magic_links_generado_por_fkey"
            columns: ["generado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "magic_links_registro_id_fkey"
            columns: ["registro_id"]
            isOneToOne: false
            referencedRelation: "registros_ingreso"
            referencedColumns: ["id"]
          },
        ]
      }
      operador_cliente: {
        Row: {
          cliente_id: number
          created_at: string | null
          id: number
          profile_id: string
        }
        Insert: {
          cliente_id: number
          created_at?: string | null
          id?: never
          profile_id: string
        }
        Update: {
          cliente_id?: number
          created_at?: string | null
          id?: never
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operador_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operador_cliente_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean | null
          created_at: string | null
          email: string
          id: string
          nombre_completo: string
          rol_id: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          email: string
          id: string
          nombre_completo: string
          rol_id?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          nombre_completo?: string
          rol_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_ingreso: {
        Row: {
          area_id: number
          cantidad_bultos: number | null
          cliente_id: number
          contratista_id: number | null
          created_at: string | null
          depositante_nombre: string
          depositante_referencia: string | null
          es_desvio: boolean
          estado: string
          fecha_hora_ingreso: string
          id: number
          importe: number | null
          motivo_desvio: string | null
          observaciones: string | null
          operador_id: string
          peso: number
          tipo_residuo_id: number
          unidad_medida_id: number
          updated_at: string | null
        }
        Insert: {
          area_id: number
          cantidad_bultos?: number | null
          cliente_id: number
          contratista_id?: number | null
          created_at?: string | null
          depositante_nombre: string
          depositante_referencia?: string | null
          es_desvio?: boolean
          estado?: string
          fecha_hora_ingreso?: string
          id?: never
          importe?: number | null
          motivo_desvio?: string | null
          observaciones?: string | null
          operador_id: string
          peso?: number
          tipo_residuo_id: number
          unidad_medida_id: number
          updated_at?: string | null
        }
        Update: {
          area_id?: number
          cantidad_bultos?: number | null
          cliente_id?: number
          contratista_id?: number | null
          created_at?: string | null
          depositante_nombre?: string
          depositante_referencia?: string | null
          es_desvio?: boolean
          estado?: string
          fecha_hora_ingreso?: string
          id?: never
          importe?: number | null
          motivo_desvio?: string | null
          observaciones?: string | null
          operador_id?: string
          peso?: number
          tipo_residuo_id?: number
          unidad_medida_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registros_ingreso_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ingreso_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ingreso_contratista_id_fkey"
            columns: ["contratista_id"]
            isOneToOne: false
            referencedRelation: "contratistas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ingreso_operador_id_fkey"
            columns: ["operador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ingreso_tipo_residuo_id_fkey"
            columns: ["tipo_residuo_id"]
            isOneToOne: false
            referencedRelation: "tipos_residuo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_ingreso_unidad_medida_id_fkey"
            columns: ["unidad_medida_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_retiro: {
        Row: {
          autorizado_por: string | null
          cantidad: number
          cliente_id: number
          created_at: string
          empresa_transportista: string
          fecha_retiro: string
          id: number
          lugar_egreso: string | null
          numero_remito: string
          observaciones: string | null
          responsable_patio: string | null
          tipo_residuo_id: number
          unidad_medida_id: number
          updated_at: string
        }
        Insert: {
          autorizado_por?: string | null
          cantidad?: number
          cliente_id: number
          created_at?: string
          empresa_transportista: string
          fecha_retiro?: string
          id?: never
          lugar_egreso?: string | null
          numero_remito: string
          observaciones?: string | null
          responsable_patio?: string | null
          tipo_residuo_id: number
          unidad_medida_id: number
          updated_at?: string
        }
        Update: {
          autorizado_por?: string | null
          cantidad?: number
          cliente_id?: number
          created_at?: string
          empresa_transportista?: string
          fecha_retiro?: string
          id?: never
          lugar_egreso?: string | null
          numero_remito?: string
          observaciones?: string | null
          responsable_patio?: string | null
          tipo_residuo_id?: number
          unidad_medida_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_retiro_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_retiro_tipo_residuo_id_fkey"
            columns: ["tipo_residuo_id"]
            isOneToOne: false
            referencedRelation: "tipos_residuo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_retiro_unidad_medida_id_fkey"
            columns: ["unidad_medida_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          id?: never
          nombre: string
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          id?: never
          nombre?: string
        }
        Relationships: []
      }
      supervisor_cliente: {
        Row: {
          cliente_id: number
          created_at: string | null
          id: number
          profile_id: string
        }
        Insert: {
          cliente_id: number
          created_at?: string | null
          id?: never
          profile_id: string
        }
        Update: {
          cliente_id?: number
          created_at?: string | null
          id?: never
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_cliente_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supervisor_cliente_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_residuo: {
        Row: {
          activo: boolean | null
          clasificacion_id: number
          codigo_y_id: number | null
          created_at: string | null
          descripcion: string | null
          id: number
          nombre: string
          requiere_foto: boolean | null
          unidad_medida_defecto_id: number
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          clasificacion_id: number
          codigo_y_id?: number | null
          created_at?: string | null
          descripcion?: string | null
          id?: never
          nombre: string
          requiere_foto?: boolean | null
          unidad_medida_defecto_id: number
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          clasificacion_id?: number
          codigo_y_id?: number | null
          created_at?: string | null
          descripcion?: string | null
          id?: never
          nombre?: string
          requiere_foto?: boolean | null
          unidad_medida_defecto_id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tipos_residuo_clasificacion_id_fkey"
            columns: ["clasificacion_id"]
            isOneToOne: false
            referencedRelation: "clasificaciones_residuo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_residuo_codigo_y_id_fkey"
            columns: ["codigo_y_id"]
            isOneToOne: false
            referencedRelation: "codigos_y"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tipos_residuo_unidad_medida_defecto_id_fkey"
            columns: ["unidad_medida_defecto_id"]
            isOneToOne: false
            referencedRelation: "unidades_medida"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_medida: {
        Row: {
          activo: boolean
          codigo: string
          created_at: string
          es_pesable: boolean
          id: number
          nombre: string
          simbolo: string
        }
        Insert: {
          activo?: boolean
          codigo: string
          created_at?: string
          es_pesable?: boolean
          id?: never
          nombre: string
          simbolo: string
        }
        Update: {
          activo?: boolean
          codigo?: string
          created_at?: string
          es_pesable?: boolean
          id?: never
          nombre?: string
          simbolo?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      generate_magic_link: { Args: { p_registro_id: number }; Returns: Json }
      get_dashboard_cliente: {
        Args: { p_fecha_desde: string; p_fecha_hasta: string }
        Returns: {
          area_id: number
          area_nombre: string
          categoria_area_nombre: string
          tipo_residuo_id: number
          tipo_residuo_nombre: string
          total_ingresos: number
        }[]
      }
      get_dashboard_global: {
        Args: { p_fecha_desde: string; p_fecha_hasta: string }
        Returns: {
          categoria_area_id: number
          categoria_area_nombre: string
          cliente_id: number
          razon_social: string
          tipo_residuo_id: number
          tipo_residuo_nombre: string
          total_ingresos: number
        }[]
      }
      get_datos_informe_mensual: {
        Args: { p_anio: number; p_cliente_id: number; p_mes: number }
        Returns: Json
      }
      get_resumen_operador: {
        Args: {
          p_fecha_desde: string
          p_fecha_hasta: string
          p_operador_id: string
        }
        Returns: {
          cliente_id: number
          fotos_subidas: number
          magic_links_generados: number
          razon_social: string
          registros_creados: number
        }[]
      }
      mark_magic_link_used: {
        Args: { p_foto_paths: string[]; p_token: string }
        Returns: undefined
      }
      validate_magic_link: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
