// Hand-authored to match supabase/migrations. Regenerate with
// `supabase gen types typescript --project-id <ref> > types/database.ts`
// once the Supabase CLI can reach the project; keep the shape in sync until then.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type QuestionType = 'multiple_choice' | 'word_cloud' | 'open_text' | 'ranking';

export type Database = {
  public: {
    Tables: {
      workshops: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          workshop_id: string;
          type: QuestionType;
          prompt: string;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workshop_id: string;
          type: QuestionType;
          prompt: string;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workshop_id?: string;
          type?: QuestionType;
          prompt?: string;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_workshop_id_fkey';
            columns: ['workshop_id'];
            referencedRelation: 'workshops';
            referencedColumns: ['id'];
          },
        ];
      };
      slide_links: {
        Row: {
          id: string;
          question_id: string;
          slide_id: string;
          deck_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          slide_id: string;
          deck_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          slide_id?: string;
          deck_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'slide_links_question_id_fkey';
            columns: ['question_id'];
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      question_type: QuestionType;
    };
    CompositeTypes: Record<string, never>;
  };
};
