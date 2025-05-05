import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are not set. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface SupabaseInvoice {
  id?: string;
  created_at?: string;
  customer: string;
  service: string;
  quantity: number;
  unit_price: number;
  vat: number;
  date: string;
  total?: number;
  invoice_number?: string;
}
