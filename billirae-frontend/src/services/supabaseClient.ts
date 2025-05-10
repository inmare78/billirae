import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables are missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface SupabaseCustomer {
  id?: string;
  user_id?: string;
  customer_id: string;
  email?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

export interface SupabaseInvoice {
  id?: string;
  user_id?: string;
  client_id: string;
  date: string;
  inv_number: string;
  notes?: string;
  status?: string;
  created_at?: string;
}

export interface SupabaseInvoiceItem {
  id?: string;
  invoice_id: string;
  position_order?: number;
  service: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  vat: number;
  tax_note?: string;
  total?: number;
  created_at?: string;
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
