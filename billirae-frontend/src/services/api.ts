import axios from 'axios';

declare global {
  interface ImportMeta {
    env: Record<string, string>;
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const voiceService = {
  /**
   * Parse voice transcript into structured invoice data
   * @param audioText Voice transcript text in German
   * @returns Parsed invoice data
   */
  parseVoiceTranscript: async (audioText: string) => {
    try {
      const response = await api.post('/voice/transcribe', { audio_text: audioText });
      return response.data.data;
    } catch (error) {
      console.error('Error parsing voice transcript:', error);
      throw error;
    }
  },
  
  /**
   * Send audio data to backend for transcription using OpenAI Whisper
   * @param audioBlob Audio blob from microphone recording
   * @returns Transcribed text and parsed invoice data
   */
  transcribeAudio: async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const response = await api.post('/voice/parse', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  },
};

export const userService = {
  /**
   * Get user profile data
   * @returns User profile data
   */
  getProfile: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  
  /**
   * Update user profile data
   * @param profileData Updated profile data
   * @returns Updated user profile
   */
  updateProfile: async (profileData: any) => {
    try {
      const response = await api.put('/users/me', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
  
  /**
   * Export user data (GDPR)
   * @returns User data export
   */
  exportUserData: async () => {
    try {
      const response = await api.get('/gdpr/export-data');
      return response.data;
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  },
  
  /**
   * Delete user account (GDPR)
   * @returns Success message
   */
  deleteAccount: async () => {
    try {
      const response = await api.delete('/gdpr/delete-account');
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
};

export const profileService = {
  /**
   * Get business profile data
   * @returns Business profile data
   */
  getBusinessProfile: async () => {
    try {
      const response = await api.get('/profile/business');
      return response.data;
    } catch (error) {
      console.error('Error fetching business profile:', error);
      throw error;
    }
  },
  
  /**
   * Update business profile data
   * @param profileData Updated business profile data
   * @returns Success message
   */
  updateBusinessProfile: async (profileData: any) => {
    try {
      const response = await api.put('/profile/business', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating business profile:', error);
      throw error;
    }
  },
};

export const invoiceService = {
  /**
   * Generate PDF for an invoice
   * @param invoiceId Invoice ID
   * @returns PDF URL
   */
  generatePDF: async (invoiceId: string) => {
    try {
      const response = await api.post(`/invoices/${invoiceId}/generate-pdf`);
      return response.data;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  },
  
  /**
   * Get PDF for an invoice
   * @param invoiceId Invoice ID
   * @returns PDF blob
   */
  getPDF: async (invoiceId: string) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error getting PDF:', error);
      throw error;
    }
  },
  
  /**
   * Send invoice via email
   * @param invoiceId Invoice ID
   * @param emailData Email data
   * @param pdfData PDF data as base64 string or blob
   * @returns Success message
   */
  sendEmail: async (invoiceId: string, emailData: {
    recipient_email: string;
    subject?: string;
    message?: string;
    cc_emails?: string[];
    pdf_data?: string | Blob;
  }) => {
    try {
      let payload = { ...emailData };
      
      if (payload.pdf_data instanceof Blob) {
        const reader = new FileReader();
        const pdfBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64data = reader.result as string;
            resolve(base64data.split(',')[1]); // Remove the data URL prefix
          };
          reader.readAsDataURL(payload.pdf_data as Blob);
        });
        
        payload.pdf_data = pdfBase64;
      }
      
      const response = await api.post(`/invoice/email`, {
        invoice_id: invoiceId,
        ...payload
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  },
  
  /**
   * Create a new invoice
   * @param invoiceData Invoice data
   * @returns Created invoice
   */
  createInvoice: async (invoiceData: any) => {
    try {
      const response = await api.post('/invoices', invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },
  
  /**
   * Get all invoices
   * @returns List of invoices
   */
  getInvoices: async () => {
    try {
      const response = await api.get('/invoices');
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },
  
  /**
   * Get invoice by ID
   * @param invoiceId Invoice ID
   * @returns Invoice data
   */
  getInvoice: async (invoiceId: string) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }
  },
  
  /**
   * Update invoice
   * @param invoiceId Invoice ID
   * @param invoiceData Updated invoice data
   * @returns Updated invoice
   */
  updateInvoice: async (invoiceId: string, invoiceData: any) => {
    try {
      const response = await api.put(`/invoices/${invoiceId}`, invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },
  
  /**
   * Delete invoice
   * @param invoiceId Invoice ID
   * @returns Success message
   */
  deleteInvoice: async (invoiceId: string) => {
    try {
      const response = await api.delete(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }
};

import { supabase, SupabaseInvoice, SupabaseInvoiceItem, SupabaseCustomer } from './supabaseClient';

export const supabaseService = {
  /**
   * Save invoice data to Supabase
   * @param formData Invoice data from the frontend
   * @param invoiceId Optional invoice ID (for PDF generation)
   * @returns Saved invoice data and items
   */
  saveInvoice: async (formData: any, invoiceId?: string): Promise<{invoice: SupabaseInvoice, invoiceItem: SupabaseInvoiceItem}> => {
    try {
      console.log('Starting to save invoice to Supabase:', formData);
      
      const isTestMode = localStorage.getItem('test_mode') === 'true';
      
      const totalBeforeTax = formData.quantity * formData.unit_price;
      const total = totalBeforeTax + (totalBeforeTax * formData.tax_rate);
      
      const invoiceNumber = invoiceId ? `INV-${invoiceId}` : `INV-${Date.now()}`;
      
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id;
      
      if (!userId && !isTestMode) {
        throw new Error('User not authenticated. Please log in to save invoices.');
      }
      
      if (isTestMode) {
        console.log('Test mode detected, returning mock Supabase response');
        
        const mockInvoice: SupabaseInvoice = {
          id: 'mock-invoice-id-' + Date.now(),
          user_id: 'mock-user-id-' + Date.now(),
          client_id: 'mock-client-id-' + Date.now(),
          date: formData.invoice_date,
          inv_number: invoiceNumber,
          status: 'draft',
          created_at: new Date().toISOString()
        };
        
        const mockInvoiceItem: SupabaseInvoiceItem = {
          id: 'mock-item-id-' + Date.now(),
          invoice_id: mockInvoice.id || '', // Ensure it's never undefined
          service: formData.service,
          quantity: formData.quantity,
          unit_price: formData.unit_price,
          vat: formData.tax_rate,
          total: parseFloat(total.toFixed(2)),
          created_at: new Date().toISOString()
        };
        
        console.log('Successfully saved invoice to Supabase (mock):', { invoice: mockInvoice, invoiceItem: mockInvoiceItem });
        return { invoice: mockInvoice, invoiceItem: mockInvoiceItem };
      }
      
      let clientId: string;
      
      const { data: existingCustomers, error: customerError } = await supabase
        .from('public.customers')
        .select('id')
        .eq('customer_id', formData.client)
        .eq('user_id', userId)
        .limit(1);
      
      if (customerError) {
        console.error('Error checking for existing customer:', customerError);
        throw customerError;
      }
      
      if (existingCustomers && existingCustomers.length > 0) {
        clientId = existingCustomers[0].id;
        console.log('Using existing customer with ID:', clientId);
      } else {
        const newCustomer: SupabaseCustomer = {
          user_id: userId!,
          customer_id: formData.client,
          first_name: formData.client.split(' ')[0],
          last_name: formData.client.split(' ').slice(1).join(' ')
        };
        
        const { data: customerData, error: createCustomerError } = await supabase
          .from('public.customers')
          .insert(newCustomer)
          .select()
          .single();
        
        if (createCustomerError) {
          console.error('Error creating customer:', createCustomerError);
          throw createCustomerError;
        }
        
        clientId = customerData.id;
        console.log('Created new customer with ID:', clientId);
      }
      
      // Step 2: Create invoice
      const newInvoice: SupabaseInvoice = {
        user_id: userId!,
        client_id: clientId,
        date: formData.invoice_date,
        inv_number: invoiceNumber,
        status: 'draft'
      };
      
      const { data: createdInvoice, error: invoiceError } = await supabase
        .from('public.invoices')
        .insert(newInvoice)
        .select()
        .single();
      
      if (invoiceError) {
        console.error('Error creating invoice:', invoiceError);
        throw invoiceError;
      }
      
      console.log('Created invoice with ID:', createdInvoice.id);
      
      const newInvoiceItem: SupabaseInvoiceItem = {
        invoice_id: createdInvoice.id || '', // Ensure it's never undefined
        service: formData.service,
        quantity: formData.quantity,
        unit_price: formData.unit_price,
        vat: formData.tax_rate,
        total: parseFloat(total.toFixed(2))
      };
      
      const { data: invoiceItemData, error: invoiceItemError } = await supabase
        .from('public.invoice_items')
        .insert(newInvoiceItem)
        .select()
        .single();
      
      if (invoiceItemError) {
        console.error('Error creating invoice item:', invoiceItemError);
        throw invoiceItemError;
      }
      
      console.log('Created invoice item with ID:', invoiceItemData.id);
      
      console.log('Successfully saved invoice to Supabase:', { invoice: createdInvoice, invoiceItem: invoiceItemData });
      return { invoice: createdInvoice, invoiceItem: invoiceItemData };
    } catch (error) {
      console.error('Error saving invoice to Supabase:', error);
      throw error;
    }
  }
};

export default api;
