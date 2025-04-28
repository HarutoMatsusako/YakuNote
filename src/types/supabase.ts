export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      summaries: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          original_text: string;
          summary: string;
          url: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          original_text: string;
          summary: string;
          url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          original_text?: string;
          summary?: string;
          url?: string | null;
        };
      };
      // 他のテーブルがあれば追加
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
