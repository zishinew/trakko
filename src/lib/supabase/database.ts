import type { Contact, StoreEvent, MailJob, ProducerTools } from '../tools';
import type { Store, Beat, License, BeatFile, Order, StripeAccount } from '../types';
type Table<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] };
export type Database = {
  public: {
    Tables: {
      store_tools: Table<{ store_id: string; config: ProducerTools; updated_at: string }>;
      contacts: Table<Contact>;
      store_events: Table<StoreEvent>;
      mail_jobs: Table<MailJob>;
      profiles: Table<{ id: string; email: string; created_at: string }>;
      stores: Table<Store>;
      beats: Table<Beat>;
      licenses: Table<Omit<License, 'deliverables'>>;
      license_deliverables: Table<{ license_id: string; kind: 'mp3' | 'wav' | 'stems' }>;
      beat_files: Table<BeatFile>;
      orders: Table<Order>;
      stripe_accounts: Table<StripeAccount>;
      play_events: Table<{
        id: string;
        store_id: string;
        beat_id: string;
        created_at: string;
        visitor_hash: string;
      }>;
      upload_intents: Table<{
        id: string;
        store_id: string;
        beat_id: string | null;
        kind: string;
        path: string;
        name: string;
        size: number;
        content_type: string;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      claim_receipts: { Args: { batch_size: number }; Returns: MailJob[] };
      store_play_counts: {
        Args: { target_store: string };
        Returns: { total: number; week: number; month: number }[];
      };
      save_license: {
        Args: { payload: Record<string, unknown>; included: string[] };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
