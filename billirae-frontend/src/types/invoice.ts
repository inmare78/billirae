import { SupabaseInvoice, SupabaseInvoiceItem } from '../services/supabaseClient';

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
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

export interface InvoiceData {
  id?: string;
  user_id?: string;
  client_id: string;
  date: string;
  inv_number?: string;
  notes?: string;
  status?: string;
  created_at?: string;
  items: InvoiceItem[];
  currency?: string;
  language?: string;
}

export const mapVoiceDataToInvoiceData = (voiceData: {
  client: string;
  service: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  invoice_date: string;
  currency: string;
  language: string;
}): InvoiceData => {
  const total = voiceData.quantity * voiceData.unit_price;
  
  return {
    client_id: voiceData.client, // This will be replaced with actual client_id later
    date: voiceData.invoice_date,
    currency: voiceData.currency,
    language: voiceData.language,
    items: [
      {
        service: voiceData.service,
        quantity: voiceData.quantity,
        unit_price: voiceData.unit_price,
        vat: voiceData.tax_rate,
        total: total
      }
    ]
  };
};

export const mapSupabaseToInvoiceData = (
  invoice: SupabaseInvoice, 
  invoiceItems: SupabaseInvoiceItem[]
): InvoiceData => {
  return {
    id: invoice.id,
    user_id: invoice.user_id,
    client_id: invoice.client_id,
    date: invoice.date,
    inv_number: invoice.inv_number,
    notes: invoice.notes,
    status: invoice.status,
    created_at: invoice.created_at,
    items: invoiceItems.map(item => ({
      id: item.id,
      invoice_id: item.invoice_id,
      position_order: item.position_order,
      service: item.service,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount: item.discount,
      vat: item.vat,
      tax_note: item.tax_note,
      total: item.total,
      created_at: item.created_at
    }))
  };
};
