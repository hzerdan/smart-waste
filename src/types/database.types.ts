export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: number
          cliente_id: number
          nombre: string
          categoria_area_id: number | null
          descripcion: string | null
          activo: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          cliente_id: number
          nombre: string
          categoria_area_id?: number | null
          descripcion?: string | null
          activo?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          cliente_id?: number
          nombre?: string
          categoria_area_id?: number | null
          descripcion?: string | null
          activo?: boolean | null
          created_at?: string | null
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
          }
        ]
      }
      categorias_area: {
        Row: {
          id: number
          nombre: string
          descripcion: string | null
          activo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          nombre: string
          descripcion?: string | null
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          nombre?: string
          descripcion?: string | null
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clientes: {
        Row: {
          id: number
          razon_social: string
          cuit: string
          email_contacto: string | null
          telefono: string | null
          activo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          razon_social: string
          cuit: string
          email_contacto?: string | null
          telefono?: string | null
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          razon_social?: string
          cuit?: string
          email_contacto?: string | null
          telefono?: string | null
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fotos_ingreso: {
        Row: {
          id: number
          registro_id: number
          storage_path: string
          subida_por_operador: boolean
          magic_link_id: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          registro_id: number
          storage_path: string
          subida_por_operador?: boolean
          magic_link_id?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          registro_id?: number
          storage_path?: string
          subida_por_operador?: boolean
          magic_link_id?: number | null
          created_at?: string | null
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
          }
        ]
      }
      magic_links: {
        Row: {
          id: number
          token: string
          registro_id: number
          generado_por: string
          usado: boolean | null
          expires_at: string
          used_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          token?: string
          registro_id: number
          generado_por: string
          usado?: boolean | null
          expires_at?: string
          used_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          token?: string
          registro_id?: number
          generado_por?: string
          usado?: boolean | null
          expires_at?: string
          used_at?: string | null
          created_at?: string | null
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
          }
        ]
      }
      operador_cliente: {
        Row: {
          id: number
          profile_id: string
          cliente_id: number
          created_at: string | null
        }
        Insert: {
          id?: number
          profile_id: string
          cliente_id: number
          created_at?: string | null
        }
        Update: {
          id?: number
          profile_id?: string
          cliente_id?: number
          created_at?: string | null
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
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          rol_id: number | null
          nombre_completo: string
          email: string
          activo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          rol_id?: number | null
          nombre_completo: string
          email: string
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          rol_id?: number | null
          nombre_completo?: string
          email?: string
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_rol_id_fkey"
            columns: ["rol_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
      }
      registros_ingreso: {
        Row: {
          id: number
          cliente_id: number
          area_id: number
          tipo_residuo_id: number
          operador_id: string
          depositante_nombre: string
          depositante_referencia: string | null
          peso: number
          importe: number | null
          fecha_hora_ingreso: string
          observaciones: string | null
          estado: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          cliente_id: number
          area_id: number
          tipo_residuo_id: number
          operador_id: string
          depositante_nombre: string
          depositante_referencia?: string | null
          peso?: number
          importe?: number | null
          fecha_hora_ingreso?: string
          observaciones?: string | null
          estado?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          cliente_id?: number
          area_id?: number
          tipo_residuo_id?: number
          operador_id?: string
          depositante_nombre?: string
          depositante_referencia?: string | null
          peso?: number
          importe?: number | null
          fecha_hora_ingreso?: string
          observaciones?: string | null
          estado?: string
          created_at?: string | null
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
          }
        ]
      }
      roles: {
        Row: {
          id: number
          nombre: string
          descripcion: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          nombre: string
          descripcion?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          nombre?: string
          descripcion?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      supervisor_cliente: {
        Row: {
          id: number
          profile_id: string
          cliente_id: number
          created_at: string | null
        }
        Insert: {
          id?: number
          profile_id: string
          cliente_id: number
          created_at?: string | null
        }
        Update: {
          id?: number
          profile_id?: string
          cliente_id?: number
          created_at?: string | null
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
          }
        ]
      }
      tipos_residuo: {
        Row: {
          id: number
          nombre: string
          descripcion: string | null
          requiere_foto: boolean | null
          activo: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          nombre: string
          descripcion?: string | null
          requiere_foto?: boolean | null
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          nombre?: string
          descripcion?: string | null
          requiere_foto?: boolean | null
          activo?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
