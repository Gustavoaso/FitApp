export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      alimentos_favoritos: {
        Row: {
          alimento_id: number;
          criado_em: string;
          id: string;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          alimento_id: number;
          criado_em?: string;
          id?: string;
          usuario_id: string;
        };
        Update: {
          alimento_id?: number;
          criado_em?: string;
          id?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'alimentos_favoritos_alimento_id_fkey';
            columns: ['alimento_id'];
            isOneToOne: false;
            referencedRelation: 'base_alimentos';
            referencedColumns: ['id'];
          },
        ];
      };
      alimentos_refeicao: {
        Row: {
          alimento_id: number | null;
          calorias: number;
          carboidratos: number;
          gorduras: number;
          id: string;
          nome: string;
          porcao_gramas: number;
          proteinas: number;
          refeicao_plano_id: string;
        };
        ComputedFields: never;
        Insert: {
          alimento_id?: number | null;
          calorias: number;
          carboidratos: number;
          gorduras: number;
          id?: string;
          nome: string;
          porcao_gramas: number;
          proteinas: number;
          refeicao_plano_id: string;
        };
        Update: {
          alimento_id?: number | null;
          calorias?: number;
          carboidratos?: number;
          gorduras?: number;
          id?: string;
          nome?: string;
          porcao_gramas?: number;
          proteinas?: number;
          refeicao_plano_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'alimentos_refeicao_alimento_id_fkey';
            columns: ['alimento_id'];
            isOneToOne: false;
            referencedRelation: 'base_alimentos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'alimentos_refeicao_refeicao_plano_id_fkey';
            columns: ['refeicao_plano_id'];
            isOneToOne: false;
            referencedRelation: 'refeicoes_plano';
            referencedColumns: ['id'];
          },
        ];
      };
      apelidos_usuario: {
        Row: {
          apelido: string;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          apelido: string;
          usuario_id?: string;
        };
        Update: {
          apelido?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      base_alimentos: {
        Row: {
          calorias_100g: number;
          carboidratos_100g: number;
          categoria: string;
          codigo_barras: string | null;
          criado_por: string | null;
          e_basico: boolean;
          embedding: string | null;
          fibras_100g: number | null;
          fonte: string;
          gorduras_100g: number;
          id: number;
          id_taco: number | null;
          is_curado: boolean;
          marca: string | null;
          nome: string;
          porcao_descricao: string | null;
          porcao_gramas: number | null;
          proteinas_100g: number;
        };
        ComputedFields: never;
        Insert: {
          calorias_100g: number;
          carboidratos_100g: number;
          categoria: string;
          codigo_barras?: string | null;
          criado_por?: string | null;
          e_basico?: boolean;
          embedding?: string | null;
          fibras_100g?: number | null;
          fonte?: string;
          gorduras_100g: number;
          id?: number;
          id_taco?: number | null;
          is_curado?: boolean;
          marca?: string | null;
          nome: string;
          porcao_descricao?: string | null;
          porcao_gramas?: number | null;
          proteinas_100g: number;
        };
        Update: {
          calorias_100g?: number;
          carboidratos_100g?: number;
          categoria?: string;
          codigo_barras?: string | null;
          criado_por?: string | null;
          e_basico?: boolean;
          embedding?: string | null;
          fibras_100g?: number | null;
          fonte?: string;
          gorduras_100g?: number;
          id?: number;
          id_taco?: number | null;
          is_curado?: boolean;
          marca?: string | null;
          nome?: string;
          porcao_descricao?: string | null;
          porcao_gramas?: number | null;
          proteinas_100g?: number;
        };
        Relationships: [];
      };
      base_conhecimento: {
        Row: {
          conteudo: string;
          embedding: string | null;
          fonte: string;
          id: number;
          niveis: string[];
          objetivos: string[];
          tema: string;
          tipo: string;
          titulo: string;
        };
        ComputedFields: never;
        Insert: {
          conteudo: string;
          embedding?: string | null;
          fonte: string;
          id?: number;
          niveis?: string[];
          objetivos?: string[];
          tema?: string;
          tipo: string;
          titulo: string;
        };
        Update: {
          conteudo?: string;
          embedding?: string | null;
          fonte?: string;
          id?: number;
          niveis?: string[];
          objetivos?: string[];
          tema?: string;
          tipo?: string;
          titulo?: string;
        };
        Relationships: [];
      };
      base_exercicios: {
        Row: {
          embedding: string | null;
          equipamento: string;
          gif_url: string | null;
          grupo_primario: string;
          grupo_secundario: string | null;
          id: string;
          id_externo: string | null;
          instrucoes: string;
          is_curado: boolean;
          nivel: string;
          nome: string;
          padrao_series: NonNullable<Json>;
          tipo_movimento: string;
        };
        ComputedFields: never;
        Insert: {
          embedding?: string | null;
          equipamento: string;
          gif_url?: string | null;
          grupo_primario: string;
          grupo_secundario?: string | null;
          id?: string;
          id_externo?: string | null;
          instrucoes?: string;
          is_curado?: boolean;
          nivel: string;
          nome: string;
          padrao_series?: NonNullable<Json>;
          tipo_movimento?: string;
        };
        Update: {
          embedding?: string | null;
          equipamento?: string;
          gif_url?: string | null;
          grupo_primario?: string;
          grupo_secundario?: string | null;
          id?: string;
          id_externo?: string | null;
          instrucoes?: string;
          is_curado?: boolean;
          nivel?: string;
          nome?: string;
          padrao_series?: NonNullable<Json>;
          tipo_movimento?: string;
        };
        Relationships: [];
      };
      dias_treino: {
        Row: {
          dia_semana: number;
          id: string;
          nome: string;
          plano_treino_id: string;
        };
        ComputedFields: never;
        Insert: {
          dia_semana: number;
          id?: string;
          nome: string;
          plano_treino_id: string;
        };
        Update: {
          dia_semana?: number;
          id?: string;
          nome?: string;
          plano_treino_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'dias_treino_plano_treino_id_fkey';
            columns: ['plano_treino_id'];
            isOneToOne: false;
            referencedRelation: 'planos_treino';
            referencedColumns: ['id'];
          },
        ];
      };
      exercicios_plano: {
        Row: {
          dia_treino_id: string;
          exercicio_id: string;
          id: string;
          nome: string;
          ordem: number;
          series: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          dia_treino_id: string;
          exercicio_id: string;
          id?: string;
          nome: string;
          ordem: number;
          series: NonNullable<Json>;
        };
        Update: {
          dia_treino_id?: string;
          exercicio_id?: string;
          id?: string;
          nome?: string;
          ordem?: number;
          series?: NonNullable<Json>;
        };
        Relationships: [
          {
            foreignKeyName: 'exercicios_plano_dia_treino_id_fkey';
            columns: ['dia_treino_id'];
            isOneToOne: false;
            referencedRelation: 'dias_treino';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'exercicios_plano_exercicio_id_fkey';
            columns: ['exercicio_id'];
            isOneToOne: false;
            referencedRelation: 'base_exercicios';
            referencedColumns: ['id'];
          },
        ];
      };
      grupo_checkins: {
        Row: {
          criado_em: string;
          data: string;
          grupo_id: string;
          id: string;
          kcal: number | null;
          minutos: number;
          nome_treino: string | null;
          pontos: number;
          sessao_id: string;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          criado_em?: string;
          data: string;
          grupo_id: string;
          id?: string;
          kcal?: number | null;
          minutos?: number;
          nome_treino?: string | null;
          pontos?: number;
          sessao_id: string;
          usuario_id: string;
        };
        Update: {
          criado_em?: string;
          data?: string;
          grupo_id?: string;
          id?: string;
          kcal?: number | null;
          minutos?: number;
          nome_treino?: string | null;
          pontos?: number;
          sessao_id?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'grupo_checkins_grupo_id_fkey';
            columns: ['grupo_id'];
            isOneToOne: false;
            referencedRelation: 'grupos';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'grupo_checkins_sessao_id_fkey';
            columns: ['sessao_id'];
            isOneToOne: false;
            referencedRelation: 'sessoes_treino';
            referencedColumns: ['id'];
          },
        ];
      };
      grupo_membros: {
        Row: {
          checkin_automatico: boolean;
          entrou_em: string;
          grupo_id: string;
          id: string;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          checkin_automatico?: boolean;
          entrou_em?: string;
          grupo_id: string;
          id?: string;
          usuario_id: string;
        };
        Update: {
          checkin_automatico?: boolean;
          entrou_em?: string;
          grupo_id?: string;
          id?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'grupo_membros_grupo_id_fkey';
            columns: ['grupo_id'];
            isOneToOne: false;
            referencedRelation: 'grupos';
            referencedColumns: ['id'];
          },
        ];
      };
      grupo_removidos: {
        Row: {
          grupo_id: string;
          removido_em: string;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          grupo_id: string;
          removido_em?: string;
          usuario_id: string;
        };
        Update: {
          grupo_id?: string;
          removido_em?: string;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'grupo_removidos_grupo_id_fkey';
            columns: ['grupo_id'];
            isOneToOne: false;
            referencedRelation: 'grupos';
            referencedColumns: ['id'];
          },
        ];
      };
      grupos: {
        Row: {
          codigo: string;
          criado_em: string;
          criador_id: string;
          duracao_semanas: number | null;
          encerrado_em: string | null;
          fim: string | null;
          id: string;
          inicio: string;
          modo: string;
          nome: string;
        };
        ComputedFields: never;
        Insert: {
          codigo: string;
          criado_em?: string;
          criador_id: string;
          duracao_semanas?: number | null;
          encerrado_em?: string | null;
          fim?: string | null;
          id?: string;
          inicio?: string;
          modo: string;
          nome: string;
        };
        Update: {
          codigo?: string;
          criado_em?: string;
          criador_id?: string;
          duracao_semanas?: number | null;
          encerrado_em?: string | null;
          fim?: string | null;
          id?: string;
          inicio?: string;
          modo?: string;
          nome?: string;
        };
        Relationships: [];
      };
      historico_peso: {
        Row: {
          criado_em: string;
          data: string;
          id: string;
          peso_kg: number;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          criado_em?: string;
          data?: string;
          id?: string;
          peso_kg: number;
          usuario_id: string;
        };
        Update: {
          criado_em?: string;
          data?: string;
          id?: string;
          peso_kg?: number;
          usuario_id?: string;
        };
        Relationships: [];
      };
      historico_series_executadas: {
        Row: {
          carga_kg: number;
          executado_em: string;
          exercicio_id: string;
          id: string;
          nome_exercicio: string;
          numero_serie: number;
          repeticoes: number;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          carga_kg?: number;
          executado_em?: string;
          exercicio_id: string;
          id?: string;
          nome_exercicio: string;
          numero_serie: number;
          repeticoes?: number;
          usuario_id: string;
        };
        Update: {
          carga_kg?: number;
          executado_em?: string;
          exercicio_id?: string;
          id?: string;
          nome_exercicio?: string;
          numero_serie?: number;
          repeticoes?: number;
          usuario_id?: string;
        };
        Relationships: [];
      };
      perfis: {
        Row: {
          altura_cm: number;
          atualizado_em: string;
          consentimento_saude_em: string | null;
          criado_em: string;
          frequencia_semanal: number | null;
          gordura_corporal: number | null;
          id: string;
          idade: number;
          nivel_atividade: string;
          nivel_experiencia: string;
          nome: string;
          objetivo: string | null;
          peso_kg: number;
          preferencias_json: Json | null;
          sexo: string;
          sistema_unidades: string | null;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          altura_cm: number;
          atualizado_em?: string;
          consentimento_saude_em?: string | null;
          criado_em?: string;
          frequencia_semanal?: number | null;
          gordura_corporal?: number | null;
          id?: string;
          idade: number;
          nivel_atividade: string;
          nivel_experiencia: string;
          nome: string;
          objetivo?: string | null;
          peso_kg: number;
          preferencias_json?: Json | null;
          sexo: string;
          sistema_unidades?: string | null;
          usuario_id: string;
        };
        Update: {
          altura_cm?: number;
          atualizado_em?: string;
          consentimento_saude_em?: string | null;
          criado_em?: string;
          frequencia_semanal?: number | null;
          gordura_corporal?: number | null;
          id?: string;
          idade?: number;
          nivel_atividade?: string;
          nivel_experiencia?: string;
          nome?: string;
          objetivo?: string | null;
          peso_kg?: number;
          preferencias_json?: Json | null;
          sexo?: string;
          sistema_unidades?: string | null;
          usuario_id?: string;
        };
        Relationships: [];
      };
      planos_dieta: {
        Row: {
          ativo: boolean;
          calorias_alvo: number;
          carboidratos_alvo_g: number;
          criado_em: string;
          gorduras_alvo_g: number;
          id: string;
          meta_agua: number;
          meta_agua_ml: number;
          meta_calorias: number;
          meta_calories: number;
          meta_carboidratos: number;
          meta_carboidratos_g: number;
          meta_carbs_g: number;
          meta_fat_g: number;
          meta_fats_g: number;
          meta_gorduras: number;
          meta_gorduras_g: number;
          meta_protein_g: number;
          meta_proteinas: number;
          meta_proteinas_g: number;
          proteinas_alvo_g: number;
          usuario_id: string;
          water_goal_ml: number;
        };
        ComputedFields: never;
        Insert: {
          ativo?: boolean;
          calorias_alvo: number;
          carboidratos_alvo_g: number;
          criado_em?: string;
          gorduras_alvo_g: number;
          id?: string;
          meta_agua?: number;
          meta_agua_ml: number;
          meta_calorias?: number;
          meta_calories?: number;
          meta_carboidratos?: number;
          meta_carboidratos_g?: number;
          meta_carbs_g?: number;
          meta_fat_g?: number;
          meta_fats_g?: number;
          meta_gorduras?: number;
          meta_gorduras_g?: number;
          meta_protein_g?: number;
          meta_proteinas?: number;
          meta_proteinas_g?: number;
          proteinas_alvo_g: number;
          usuario_id: string;
          water_goal_ml?: number;
        };
        Update: {
          ativo?: boolean;
          calorias_alvo?: number;
          carboidratos_alvo_g?: number;
          criado_em?: string;
          gorduras_alvo_g?: number;
          id?: string;
          meta_agua?: number;
          meta_agua_ml?: number;
          meta_calorias?: number;
          meta_calories?: number;
          meta_carboidratos?: number;
          meta_carboidratos_g?: number;
          meta_carbs_g?: number;
          meta_fat_g?: number;
          meta_fats_g?: number;
          meta_gorduras?: number;
          meta_gorduras_g?: number;
          meta_protein_g?: number;
          meta_proteinas?: number;
          meta_proteinas_g?: number;
          proteinas_alvo_g?: number;
          usuario_id?: string;
          water_goal_ml?: number;
        };
        Relationships: [];
      };
      planos_dieta_editaveis: {
        Row: {
          ativo: boolean;
          atualizado_em: string;
          criado_em: string;
          id: string;
          plano_ia_id: string | null;
          plano_json: NonNullable<Json>;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          id?: string;
          plano_ia_id?: string | null;
          plano_json: NonNullable<Json>;
          usuario_id: string;
        };
        Update: {
          ativo?: boolean;
          atualizado_em?: string;
          criado_em?: string;
          id?: string;
          plano_ia_id?: string | null;
          plano_json?: NonNullable<Json>;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'planos_dieta_editaveis_plano_ia_id_fkey';
            columns: ['plano_ia_id'];
            isOneToOne: false;
            referencedRelation: 'planos_ia_gerados';
            referencedColumns: ['id'];
          },
        ];
      };
      planos_ia_gerados: {
        Row: {
          criado_em: string;
          id: string;
          modelo_ia: string;
          plano_gerado: NonNullable<Json>;
          respostas_questionario: NonNullable<Json>;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          criado_em?: string;
          id?: string;
          modelo_ia?: string;
          plano_gerado: NonNullable<Json>;
          respostas_questionario: NonNullable<Json>;
          usuario_id: string;
        };
        Update: {
          criado_em?: string;
          id?: string;
          modelo_ia?: string;
          plano_gerado?: NonNullable<Json>;
          respostas_questionario?: NonNullable<Json>;
          usuario_id?: string;
        };
        Relationships: [];
      };
      planos_treino: {
        Row: {
          ativo: boolean;
          criado_em: string;
          dia_semana: string;
          dias_por_semana: number;
          exercicios: NonNullable<Json>;
          foco: string;
          id: string;
          nome: string;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          ativo?: boolean;
          criado_em?: string;
          dia_semana?: string;
          dias_por_semana: number;
          exercicios?: NonNullable<Json>;
          foco?: string;
          id?: string;
          nome: string;
          usuario_id: string;
        };
        Update: {
          ativo?: boolean;
          criado_em?: string;
          dia_semana?: string;
          dias_por_semana?: number;
          exercicios?: NonNullable<Json>;
          foco?: string;
          id?: string;
          nome?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      questionarios: {
        Row: {
          criado_em: string;
          id: string;
          respostas: NonNullable<Json>;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          criado_em?: string;
          id?: string;
          respostas: NonNullable<Json>;
          usuario_id: string;
        };
        Update: {
          criado_em?: string;
          id?: string;
          respostas?: NonNullable<Json>;
          usuario_id?: string;
        };
        Relationships: [];
      };
      receitas_usuario: {
        Row: {
          alimentos: NonNullable<Json>;
          atualizado_em: string;
          criado_em: string;
          descricao: string | null;
          id: string;
          nome: string;
          total_calorias: number;
          total_carboidratos: number;
          total_gorduras: number;
          total_proteinas: number;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          alimentos?: NonNullable<Json>;
          atualizado_em?: string;
          criado_em?: string;
          descricao?: string | null;
          id?: string;
          nome: string;
          total_calorias?: number;
          total_carboidratos?: number;
          total_gorduras?: number;
          total_proteinas?: number;
          usuario_id: string;
        };
        Update: {
          alimentos?: NonNullable<Json>;
          atualizado_em?: string;
          criado_em?: string;
          descricao?: string | null;
          id?: string;
          nome?: string;
          total_calorias?: number;
          total_carboidratos?: number;
          total_gorduras?: number;
          total_proteinas?: number;
          usuario_id?: string;
        };
        Relationships: [];
      };
      refeicoes_plano: {
        Row: {
          dia_semana: number;
          horario_sugerido: string | null;
          id: string;
          nome: string;
          plano_dieta_id: string;
          tipo: string;
        };
        ComputedFields: never;
        Insert: {
          dia_semana?: number;
          horario_sugerido?: string | null;
          id?: string;
          nome: string;
          plano_dieta_id: string;
          tipo: string;
        };
        Update: {
          dia_semana?: number;
          horario_sugerido?: string | null;
          id?: string;
          nome?: string;
          plano_dieta_id?: string;
          tipo?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'refeicoes_plano_plano_dieta_id_fkey';
            columns: ['plano_dieta_id'];
            isOneToOne: false;
            referencedRelation: 'planos_dieta';
            referencedColumns: ['id'];
          },
        ];
      };
      refeicoes_registradas: {
        Row: {
          alimentos: NonNullable<Json>;
          data: string;
          id: string;
          registrado_em: string;
          tipo: string;
          total_calorias: number;
          total_carboidratos: number;
          total_gorduras: number;
          total_proteinas: number;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          alimentos?: NonNullable<Json>;
          data?: string;
          id?: string;
          registrado_em?: string;
          tipo: string;
          total_calorias?: number;
          total_carboidratos?: number;
          total_gorduras?: number;
          total_proteinas?: number;
          usuario_id: string;
        };
        Update: {
          alimentos?: NonNullable<Json>;
          data?: string;
          id?: string;
          registrado_em?: string;
          tipo?: string;
          total_calorias?: number;
          total_carboidratos?: number;
          total_gorduras?: number;
          total_proteinas?: number;
          usuario_id?: string;
        };
        Relationships: [];
      };
      registro_refeicoes: {
        Row: {
          alimentos: NonNullable<Json>;
          concluida: boolean;
          data: string;
          id: string;
          id_refeicao: string;
          registrado_em: string;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          alimentos?: NonNullable<Json>;
          concluida?: boolean;
          data?: string;
          id?: string;
          id_refeicao: string;
          registrado_em?: string;
          usuario_id: string;
        };
        Update: {
          alimentos?: NonNullable<Json>;
          concluida?: boolean;
          data?: string;
          id?: string;
          id_refeicao?: string;
          registrado_em?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
      registros_agua: {
        Row: {
          data: string;
          id: string;
          meta_ml: number;
          total_ml: number;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          data?: string;
          id?: string;
          meta_ml: number;
          total_ml?: number;
          usuario_id: string;
        };
        Update: {
          data?: string;
          id?: string;
          meta_ml?: number;
          total_ml?: number;
          usuario_id?: string;
        };
        Relationships: [];
      };
      sessoes_treino: {
        Row: {
          data: string;
          dia_treino_id: string | null;
          duracao_minutos: number | null;
          exercicios_executados: NonNullable<Json>;
          finalizado_em: string | null;
          id: string;
          iniciado_em: string;
          kcal_estimadas: number | null;
          nome_treino: string | null;
          plano_treino_id: string | null;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          data?: string;
          dia_treino_id?: string | null;
          duracao_minutos?: number | null;
          exercicios_executados?: NonNullable<Json>;
          finalizado_em?: string | null;
          id?: string;
          iniciado_em?: string;
          kcal_estimadas?: number | null;
          nome_treino?: string | null;
          plano_treino_id?: string | null;
          usuario_id: string;
        };
        Update: {
          data?: string;
          dia_treino_id?: string | null;
          duracao_minutos?: number | null;
          exercicios_executados?: NonNullable<Json>;
          finalizado_em?: string | null;
          id?: string;
          iniciado_em?: string;
          kcal_estimadas?: number | null;
          nome_treino?: string | null;
          plano_treino_id?: string | null;
          usuario_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sessoes_treino_dia_treino_id_fkey';
            columns: ['dia_treino_id'];
            isOneToOne: false;
            referencedRelation: 'dias_treino';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sessoes_treino_plano_treino_id_fkey';
            columns: ['plano_treino_id'];
            isOneToOne: false;
            referencedRelation: 'planos_treino';
            referencedColumns: ['id'];
          },
        ];
      };
      tentativas_entrar_grupo: {
        Row: {
          criado_em: string;
          id: string;
          usuario_id: string;
        };
        ComputedFields: never;
        Insert: {
          criado_em?: string;
          id?: string;
          usuario_id: string;
        };
        Update: {
          criado_em?: string;
          id?: string;
          usuario_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      buscar_alimentos_rag: {
        Args: {
          limite_por_slot?: number;
          query_embedding: string;
          termos_excluidos?: string[];
          termos_proteina?: string[];
        };
        Returns: {
          calorias_100g: number;
          carboidratos_100g: number;
          categoria: string;
          gorduras_100g: number;
          id: number;
          nome: string;
          proteinas_100g: number;
          similaridade: number;
          slot: string;
        }[];
      };
      buscar_conhecimento_rag: {
        Args: {
          filtro_nivel?: string;
          filtro_objetivo?: string;
          limite?: number;
          query_embedding: string;
        };
        Returns: {
          conteudo: string;
          fonte: string;
          id: number;
          similaridade: number;
          tema: string;
          tipo: string;
          titulo: string;
        }[];
      };
      buscar_exercicios_rag: {
        Args: { filtro_equipamento?: string[]; limite_por_grupo?: number; query_embedding: string };
        Returns: {
          equipamento: string;
          grupo_primario: string;
          grupo_secundario: string;
          id: string;
          nivel: string;
          nome: string;
          similaridade: number;
          tipo_movimento: string;
        }[];
      };
      criar_grupo: { Args: { p_modo: string; p_nome: string; p_semanas?: number }; Returns: Json };
      definir_checkin_automatico: {
        Args: { p_ativo: boolean; p_grupo: string };
        Returns: undefined;
      };
      e_dono_plano_dieta: { Args: { plano: string }; Returns: boolean };
      e_dono_plano_treino: { Args: { plano: string }; Returns: boolean };
      encerrar_grupo: { Args: { p_grupo: string }; Returns: undefined };
      entrar_grupo: { Args: { p_codigo: string }; Returns: string | null };
      feed_grupo: {
        Args: { p_grupo: string; p_limite?: number };
        Returns: {
          apelido: string;
          criado_em: string;
          data: string;
          eh_voce: boolean;
          id: string;
          kcal: number;
          membro_id: string;
          minutos: number;
          nome_treino: string;
          pontos: number;
        }[];
      };
      grupo_contar_ativos: { Args: { p_usuario: string }; Returns: number };
      grupo_exigir_criador: { Args: { p_grupo: string }; Returns: undefined };
      grupo_exigir_membro: { Args: { p_grupo: string }; Returns: string };
      meus_grupos: {
        Args: Record<PropertyKey, never>;
        Returns: {
          checkin_automatico: boolean;
          codigo: string;
          duracao_semanas: number;
          eh_criador: boolean;
          encerrado: boolean;
          fim: string;
          id: string;
          inicio: string;
          membros: number;
          modo: string;
          nome: string;
        }[];
      };
      ranking_grupo: {
        Args: { p_grupo: string };
        Returns: {
          apelido: string;
          eh_voce: boolean;
          membro_id: string;
          minutos: number;
          pontos: number;
          posicao: number;
          treinos: number;
        }[];
      };
      remover_membro: { Args: { p_grupo: string; p_membro: string }; Returns: undefined };
      sair_grupo: { Args: { p_grupo: string }; Returns: undefined };
      salvar_plano_gerado: { Args: { p_dados: Json }; Returns: string };
      show_limit: { Args: Record<PropertyKey, never>; Returns: number };
      show_trgm: { Args: { '': string }; Returns: string[] };
      texto_sem_acento: { Args: { texto: string }; Returns: string };
      validar_compatibilidade_planejamento: { Args: Record<PropertyKey, never>; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
