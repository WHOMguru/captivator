// Hand-authored to match supabase/migrations. Regenerate with
// `supabase gen types typescript --project-id <ref> > types/database.ts`
// once the Supabase CLI can reach the project; keep the shape in sync until then.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type QuestionType = 'multiple_choice' | 'word_cloud' | 'open_text' | 'ranking';

export type SessionStatus = 'draft' | 'active' | 'ended';

export type PollState = 'pending' | 'open' | 'closed';

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
      sessions: {
        Row: {
          id: string;
          workshop_id: string;
          session_code: string;
          status: SessionStatus;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workshop_id: string;
          session_code: string;
          status?: SessionStatus;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workshop_id?: string;
          session_code?: string;
          status?: SessionStatus;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_workshop_id_fkey';
            columns: ['workshop_id'];
            referencedRelation: 'workshops';
            referencedColumns: ['id'];
          },
        ];
      };
      session_questions: {
        Row: {
          id: string;
          session_id: string;
          question_id: string;
          launch_order: number;
          poll_state: PollState;
          results_revealed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          question_id: string;
          launch_order?: number;
          poll_state?: PollState;
          results_revealed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          question_id?: string;
          launch_order?: number;
          poll_state?: PollState;
          results_revealed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'session_questions_session_id_fkey';
            columns: ['session_id'];
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'session_questions_question_id_fkey';
            columns: ['question_id'];
            referencedRelation: 'questions';
            referencedColumns: ['id'];
          },
        ];
      };
      participants: {
        Row: {
          id: string;
          session_id: string;
          display_name: string | null;
          joined_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          display_name?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          display_name?: string | null;
          joined_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'participants_session_id_fkey';
            columns: ['session_id'];
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      responses: {
        Row: {
          id: string;
          session_question_id: string;
          participant_id: string;
          payload: Json;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_question_id: string;
          participant_id: string;
          payload?: Json;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_question_id?: string;
          participant_id?: string;
          payload?: Json;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'responses_session_question_id_fkey';
            columns: ['session_question_id'];
            referencedRelation: 'session_questions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'responses_participant_id_fkey';
            columns: ['participant_id'];
            referencedRelation: 'participants';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_session_code: {
        Args: { code: string };
        Returns: { id: string; status: SessionStatus }[];
      };
    };
    Enums: {
      question_type: QuestionType;
      session_status: SessionStatus;
      poll_state: PollState;
    };
    CompositeTypes: Record<string, never>;
  };
};
