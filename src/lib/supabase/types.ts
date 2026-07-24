export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      aporte_eventos: {
        Row: {
          aporte_id: string
          comprovante_documento_id: string | null
          data: string
          id: string
          valor_cents: number
        }
        Insert: {
          aporte_id: string
          comprovante_documento_id?: string | null
          data?: string
          id?: string
          valor_cents: number
        }
        Update: {
          aporte_id?: string
          comprovante_documento_id?: string | null
          data?: string
          id?: string
          valor_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "aporte_eventos_aporte_id_fkey"
            columns: ["aporte_id"]
            isOneToOne: false
            referencedRelation: "aportes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aporte_eventos_comprovante_documento_id_fkey"
            columns: ["comprovante_documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      aportes: {
        Row: {
          comprometido_cents: number
          id: string
          membro_id: string
          org_id: string
          prazo: string | null
        }
        Insert: {
          comprometido_cents: number
          id?: string
          membro_id: string
          org_id: string
          prazo?: string | null
        }
        Update: {
          comprometido_cents?: number
          id?: string
          membro_id?: string
          org_id?: string
          prazo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aportes_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aportes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          assinado_em: string | null
          documento_versao_id: string
          id: string
          membro_id: string
          provider: string | null
          provider_ref: string | null
          status: Database["public"]["Enums"]["status_assinatura"]
        }
        Insert: {
          assinado_em?: string | null
          documento_versao_id: string
          id?: string
          membro_id: string
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
        }
        Update: {
          assinado_em?: string | null
          documento_versao_id?: string
          id?: string
          membro_id?: string
          provider?: string | null
          provider_ref?: string | null
          status?: Database["public"]["Enums"]["status_assinatura"]
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_documento_versao_id_fkey"
            columns: ["documento_versao_id"]
            isOneToOne: false
            referencedRelation: "documento_versoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      atas: {
        Row: {
          corpo: string
          hash: string | null
          id: string
          publicada_em: string | null
          publicada_por: string | null
          reuniao_id: string
        }
        Insert: {
          corpo: string
          hash?: string | null
          id?: string
          publicada_em?: string | null
          publicada_por?: string | null
          reuniao_id: string
        }
        Update: {
          corpo?: string
          hash?: string | null
          id?: string
          publicada_em?: string | null
          publicada_por?: string | null
          reuniao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atas_publicada_por_fkey"
            columns: ["publicada_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atas_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          acao: string
          antes: Json | null
          ator_id: string | null
          criado_em: string
          depois: Json | null
          entidade: string
          entidade_id: string | null
          id: string
          ip: string | null
          org_id: string
        }
        Insert: {
          acao: string
          antes?: Json | null
          ator_id?: string | null
          criado_em?: string
          depois?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          org_id: string
        }
        Update: {
          acao?: string
          antes?: Json | null
          ator_id?: string | null
          criado_em?: string
          depois?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
          ip?: string | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_ator_id_fkey"
            columns: ["ator_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      canais: {
        Row: {
          arquivado: boolean
          descricao: string | null
          id: string
          nome: string
          org_id: string
          slug: string
        }
        Insert: {
          arquivado?: boolean
          descricao?: string | null
          id?: string
          nome: string
          org_id: string
          slug: string
        }
        Update: {
          arquivado?: boolean
          descricao?: string | null
          id?: string
          nome?: string
          org_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "canais_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      canal_membros: {
        Row: {
          adicionado_em: string
          canal_id: string
          id: string
          membro_id: string
        }
        Insert: {
          adicionado_em?: string
          canal_id: string
          id?: string
          membro_id: string
        }
        Update: {
          adicionado_em?: string
          canal_id?: string
          id?: string
          membro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canal_membros_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canal_membros_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      deliberacoes: {
        Row: {
          abre_em: string | null
          ata_id: string | null
          codigo: string
          corpo: string | null
          encerra_em: string | null
          id: string
          org_id: string
          origem_mensagem_id: string | null
          quorum_pct: number
          status: Database["public"]["Enums"]["status_deliberacao"]
          titulo: string
        }
        Insert: {
          abre_em?: string | null
          ata_id?: string | null
          codigo: string
          corpo?: string | null
          encerra_em?: string | null
          id?: string
          org_id: string
          origem_mensagem_id?: string | null
          quorum_pct: number
          status?: Database["public"]["Enums"]["status_deliberacao"]
          titulo: string
        }
        Update: {
          abre_em?: string | null
          ata_id?: string | null
          codigo?: string
          corpo?: string | null
          encerra_em?: string | null
          id?: string
          org_id?: string
          origem_mensagem_id?: string | null
          quorum_pct?: number
          status?: Database["public"]["Enums"]["status_deliberacao"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliberacoes_ata_id_fkey"
            columns: ["ata_id"]
            isOneToOne: false
            referencedRelation: "atas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliberacoes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliberacoes_origem_mensagem_id_fkey"
            columns: ["origem_mensagem_id"]
            isOneToOne: false
            referencedRelation: "mensagens"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_grupo_acessos: {
        Row: {
          grupo: string
          id: string
          membro_id: string
        }
        Insert: {
          grupo: string
          id?: string
          membro_id: string
        }
        Update: {
          grupo?: string
          id?: string
          membro_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documento_grupo_acessos_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      documento_versoes: {
        Row: {
          documento_id: string
          enviado_em: string
          enviado_por: string | null
          hash_sha256: string
          id: string
          storage_path: string
          versao: number
        }
        Insert: {
          documento_id: string
          enviado_em?: string
          enviado_por?: string | null
          hash_sha256: string
          id?: string
          storage_path: string
          versao: number
        }
        Update: {
          documento_id?: string
          enviado_em?: string
          enviado_por?: string | null
          hash_sha256?: string
          id?: string
          storage_path?: string
          versao?: number
        }
        Relationships: [
          {
            foreignKeyName: "documento_versoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documento_versoes_enviado_por_fkey"
            columns: ["enviado_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos: {
        Row: {
          codigo: string
          critico: boolean
          grupo: string
          id: string
          nome: string
          org_id: string
          responsavel_id: string | null
          status: Database["public"]["Enums"]["status_documento"]
          vence_em: string | null
        }
        Insert: {
          codigo: string
          critico?: boolean
          grupo: string
          id?: string
          nome: string
          org_id: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_documento"]
          vence_em?: string | null
        }
        Update: {
          codigo?: string
          critico?: boolean
          grupo?: string
          id?: string
          nome?: string
          org_id?: string
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["status_documento"]
          vence_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      encaminhamentos: {
        Row: {
          id: string
          org_id: string
          origem_id: string
          origem_tipo: string
          prazo: string
          responsavel_id: string
          status: Database["public"]["Enums"]["status_encaminhamento"]
          titulo: string
        }
        Insert: {
          id?: string
          org_id: string
          origem_id: string
          origem_tipo: string
          prazo: string
          responsavel_id: string
          status?: Database["public"]["Enums"]["status_encaminhamento"]
          titulo: string
        }
        Update: {
          id?: string
          org_id?: string
          origem_id?: string
          origem_tipo?: string
          prazo?: string
          responsavel_id?: string
          status?: Database["public"]["Enums"]["status_encaminhamento"]
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "encaminhamentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaminhamentos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      fase_itens: {
        Row: {
          concluido: boolean
          concluido_em: string | null
          concluido_por: string | null
          depende_documento_id: string | null
          fase_id: string
          id: string
          ordem: number
          titulo: string
        }
        Insert: {
          concluido?: boolean
          concluido_em?: string | null
          concluido_por?: string | null
          depende_documento_id?: string | null
          fase_id: string
          id?: string
          ordem: number
          titulo: string
        }
        Update: {
          concluido?: boolean
          concluido_em?: string | null
          concluido_por?: string | null
          depende_documento_id?: string | null
          fase_id?: string
          id?: string
          ordem?: number
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "fase_itens_concluido_por_fkey"
            columns: ["concluido_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fase_itens_depende_documento_id_fkey"
            columns: ["depende_documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fase_itens_fase_id_fkey"
            columns: ["fase_id"]
            isOneToOne: false
            referencedRelation: "fases"
            referencedColumns: ["id"]
          },
        ]
      }
      fases: {
        Row: {
          id: string
          inicio_previsto: string | null
          nome: string
          ordem: number
          org_id: string
          prazo: string | null
          responsavel_id: string | null
          trilho: Database["public"]["Enums"]["trilho_fase"]
        }
        Insert: {
          id?: string
          inicio_previsto?: string | null
          nome: string
          ordem: number
          org_id: string
          prazo?: string | null
          responsavel_id?: string | null
          trilho: Database["public"]["Enums"]["trilho_fase"]
        }
        Update: {
          id?: string
          inicio_previsto?: string | null
          nome?: string
          ordem?: number
          org_id?: string
          prazo?: string | null
          responsavel_id?: string | null
          trilho?: Database["public"]["Enums"]["trilho_fase"]
        }
        Relationships: [
          {
            foreignKeyName: "fases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fases_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      membros: {
        Row: {
          ativo: boolean
          email: string
          entrou_em: string
          id: string
          nome: string
          org_id: string
          papel: Database["public"]["Enums"]["papel_membro"]
          participacao_pct: number
          user_id: string | null
        }
        Insert: {
          ativo?: boolean
          email: string
          entrou_em?: string
          id?: string
          nome: string
          org_id: string
          papel: Database["public"]["Enums"]["papel_membro"]
          participacao_pct?: number
          user_id?: string | null
        }
        Update: {
          ativo?: boolean
          email?: string
          entrou_em?: string
          id?: string
          nome?: string
          org_id?: string
          papel?: Database["public"]["Enums"]["papel_membro"]
          participacao_pct?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "membros_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagem_versoes: {
        Row: {
          corpo_anterior: string
          editado_em: string
          id: string
          mensagem_id: string
        }
        Insert: {
          corpo_anterior: string
          editado_em?: string
          id?: string
          mensagem_id: string
        }
        Update: {
          corpo_anterior?: string
          editado_em?: string
          id?: string
          mensagem_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagem_versoes_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "mensagens"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          autor_id: string
          canal_id: string
          corpo: string
          criado_em: string
          editado_em: string | null
          id: string
          respondendo_a: string | null
        }
        Insert: {
          autor_id: string
          canal_id: string
          corpo: string
          criado_em?: string
          editado_em?: string | null
          id?: string
          respondendo_a?: string | null
        }
        Update: {
          autor_id?: string
          canal_id?: string
          corpo?: string
          criado_em?: string
          editado_em?: string | null
          id?: string
          respondendo_a?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_canal_id_fkey"
            columns: ["canal_id"]
            isOneToOne: false
            referencedRelation: "canais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_respondendo_a_fkey"
            columns: ["respondendo_a"]
            isOneToOne: false
            referencedRelation: "mensagens"
            referencedColumns: ["id"]
          },
        ]
      }
      movimentos: {
        Row: {
          aprovador_id: string | null
          categoria: string
          codigo: string
          competencia: string | null
          comprovante_documento_id: string | null
          descricao: string
          direcao: Database["public"]["Enums"]["direcao_movimento"]
          id: string
          org_id: string
          solicitante_id: string | null
          status: Database["public"]["Enums"]["status_movimento"]
          valor_cents: number
        }
        Insert: {
          aprovador_id?: string | null
          categoria: string
          codigo: string
          competencia?: string | null
          comprovante_documento_id?: string | null
          descricao: string
          direcao: Database["public"]["Enums"]["direcao_movimento"]
          id?: string
          org_id: string
          solicitante_id?: string | null
          status?: Database["public"]["Enums"]["status_movimento"]
          valor_cents: number
        }
        Update: {
          aprovador_id?: string | null
          categoria?: string
          codigo?: string
          competencia?: string | null
          comprovante_documento_id?: string | null
          descricao?: string
          direcao?: Database["public"]["Enums"]["direcao_movimento"]
          id?: string
          org_id?: string
          solicitante_id?: string | null
          status?: Database["public"]["Enums"]["status_movimento"]
          valor_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentos_aprovador_id_fkey"
            columns: ["aprovador_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_comprovante_documento_id_fkey"
            columns: ["comprovante_documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentos_solicitante_id_fkey"
            columns: ["solicitante_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          cnpj: string | null
          criada_em: string
          estagio: string
          id: string
          nome: string
        }
        Insert: {
          cnpj?: string | null
          criada_em?: string
          estagio?: string
          id?: string
          nome: string
        }
        Update: {
          cnpj?: string | null
          criada_em?: string
          estagio?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      registros: {
        Row: {
          codigo: string
          guardado_em: string
          guardado_por: string | null
          id: string
          mensagem_id: string
          org_id: string
          texto_snapshot: string
        }
        Insert: {
          codigo: string
          guardado_em?: string
          guardado_por?: string | null
          id?: string
          mensagem_id: string
          org_id: string
          texto_snapshot: string
        }
        Update: {
          codigo?: string
          guardado_em?: string
          guardado_por?: string | null
          id?: string
          mensagem_id?: string
          org_id?: string
          texto_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_guardado_por_fkey"
            columns: ["guardado_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      reuniao_pauta: {
        Row: {
          id: string
          item: string
          ordem: number
          proposto_por: string | null
          reuniao_id: string
        }
        Insert: {
          id?: string
          item: string
          ordem: number
          proposto_por?: string | null
          reuniao_id: string
        }
        Update: {
          id?: string
          item?: string
          ordem?: number
          proposto_por?: string | null
          reuniao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reuniao_pauta_proposto_por_fkey"
            columns: ["proposto_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reuniao_pauta_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "reunioes"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes: {
        Row: {
          codigo: string
          fim: string | null
          id: string
          inicio: string
          link: string | null
          org_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          codigo: string
          fim?: string | null
          id?: string
          inicio: string
          link?: string | null
          org_id: string
          tipo: string
          titulo: string
        }
        Update: {
          codigo?: string
          fim?: string | null
          id?: string
          inicio?: string
          link?: string | null
          org_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      sugestoes: {
        Row: {
          confianca: number | null
          criado_em: string
          id: string
          mensagem_id: string
          org_id: string
          payload: Json
          promovida_em: string | null
          promovida_por: string | null
          registro_id: string | null
          status: Database["public"]["Enums"]["status_sugestao"]
          tipo: Database["public"]["Enums"]["tipo_sugestao"]
        }
        Insert: {
          confianca?: number | null
          criado_em?: string
          id?: string
          mensagem_id: string
          org_id: string
          payload: Json
          promovida_em?: string | null
          promovida_por?: string | null
          registro_id?: string | null
          status?: Database["public"]["Enums"]["status_sugestao"]
          tipo: Database["public"]["Enums"]["tipo_sugestao"]
        }
        Update: {
          confianca?: number | null
          criado_em?: string
          id?: string
          mensagem_id?: string
          org_id?: string
          payload?: Json
          promovida_em?: string | null
          promovida_por?: string | null
          registro_id?: string | null
          status?: Database["public"]["Enums"]["status_sugestao"]
          tipo?: Database["public"]["Enums"]["tipo_sugestao"]
        }
        Relationships: [
          {
            foreignKeyName: "sugestoes_mensagem_id_fkey"
            columns: ["mensagem_id"]
            isOneToOne: false
            referencedRelation: "mensagens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sugestoes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sugestoes_promovida_por_fkey"
            columns: ["promovida_por"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
      votos: {
        Row: {
          criado_em: string
          deliberacao_id: string
          hash: string | null
          hash_anterior: string | null
          id: string
          justificativa: string | null
          membro_id: string
          peso_pct: number
          voto: Database["public"]["Enums"]["voto_enum"]
        }
        Insert: {
          criado_em?: string
          deliberacao_id: string
          hash?: string | null
          hash_anterior?: string | null
          id?: string
          justificativa?: string | null
          membro_id: string
          peso_pct: number
          voto: Database["public"]["Enums"]["voto_enum"]
        }
        Update: {
          criado_em?: string
          deliberacao_id?: string
          hash?: string | null
          hash_anterior?: string | null
          id?: string
          justificativa?: string | null
          membro_id?: string
          peso_pct?: number
          voto?: Database["public"]["Enums"]["voto_enum"]
        }
        Relationships: [
          {
            foreignKeyName: "votos_deliberacao_id_fkey"
            columns: ["deliberacao_id"]
            isOneToOne: false
            referencedRelation: "deliberacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votos_membro_id_fkey"
            columns: ["membro_id"]
            isOneToOne: false
            referencedRelation: "membros"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      membro_ativo_org: { Args: { check_org_id: string }; Returns: boolean }
      papel_atual: {
        Args: { check_org_id: string }
        Returns: Database["public"]["Enums"]["papel_membro"]
      }
      pode_ver_canal: { Args: { check_canal_id: string }; Returns: boolean }
      pode_ver_documento: {
        Args: { check_documento_id: string }
        Returns: boolean
      }
    }
    Enums: {
      direcao_movimento: "entrada" | "saida"
      papel_membro: "admin" | "socio" | "tecnico" | "convidado"
      status_assinatura: "pendente" | "assinada" | "recusada"
      status_deliberacao:
        | "rascunho"
        | "aberta"
        | "aprovada"
        | "rejeitada"
        | "expirada"
      status_documento:
        | "ausente"
        | "rascunho"
        | "revisao"
        | "aguarda_assinatura"
        | "assinado"
        | "vencido"
      status_encaminhamento: "aberto" | "concluido" | "cancelado"
      status_movimento:
        | "previsto"
        | "aguarda_aprovacao"
        | "aprovado"
        | "pago"
        | "rejeitado"
      status_sugestao: "pendente" | "promovida" | "descartada"
      tipo_sugestao:
        | "movimento"
        | "aporte"
        | "encaminhamento"
        | "documento"
        | "deliberacao"
      trilho_fase: "legal" | "op"
      voto_enum: "sim" | "nao" | "abstencao"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      direcao_movimento: ["entrada", "saida"],
      papel_membro: ["admin", "socio", "tecnico", "convidado"],
      status_assinatura: ["pendente", "assinada", "recusada"],
      status_deliberacao: [
        "rascunho",
        "aberta",
        "aprovada",
        "rejeitada",
        "expirada",
      ],
      status_documento: [
        "ausente",
        "rascunho",
        "revisao",
        "aguarda_assinatura",
        "assinado",
        "vencido",
      ],
      status_encaminhamento: ["aberto", "concluido", "cancelado"],
      status_movimento: [
        "previsto",
        "aguarda_aprovacao",
        "aprovado",
        "pago",
        "rejeitado",
      ],
      status_sugestao: ["pendente", "promovida", "descartada"],
      tipo_sugestao: [
        "movimento",
        "aporte",
        "encaminhamento",
        "documento",
        "deliberacao",
      ],
      trilho_fase: ["legal", "op"],
      voto_enum: ["sim", "nao", "abstencao"],
    },
  },
} as const

