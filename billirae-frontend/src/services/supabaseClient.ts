import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are missing. Please check your .env file.');
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

export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      return { connected: false, error };
    }
    
    return { connected: true, data };
  } catch (error) {
    console.error('Supabase connection test exception:', error);
    return { connected: false, error };
  }
};
