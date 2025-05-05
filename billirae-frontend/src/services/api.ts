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

import { supabase, SupabaseInvoice } from './supabaseClient';

export const supabaseService = {
  /**
   * Save invoice data to Supabase
   * @param invoiceData Invoice data from the frontend
   * @param invoiceId Optional invoice ID (for PDF generation)
   * @returns Saved invoice data
   */
  saveInvoice: async (invoiceData: any, invoiceId?: string): Promise<SupabaseInvoice> => {
    try {
      console.log('Starting to save invoice to Supabase:', invoiceData);
      
      const isTestMode = localStorage.getItem('test_mode') === 'true';
      
      const totalBeforeTax = invoiceData.quantity * invoiceData.unit_price;
      const total = totalBeforeTax + (totalBeforeTax * invoiceData.tax_rate);
      
      const invoiceNumber = invoiceId ? `INV-${invoiceId}` : undefined;
      
      const supabaseInvoice: SupabaseInvoice = {
        customer: invoiceData.client,
        service: invoiceData.service,
        quantity: invoiceData.quantity,
        unit_price: invoiceData.unit_price,
        vat: invoiceData.tax_rate,
        date: invoiceData.invoice_date,
        total: parseFloat(total.toFixed(2)),
        invoice_number: invoiceNumber
      };
      
      console.log('Prepared invoice data for Supabase:', supabaseInvoice);
      
      if (isTestMode) {
        console.log('Test mode detected, returning mock Supabase response');
        
        const mockData: SupabaseInvoice = {
          ...supabaseInvoice,
          id: 'mock-id-' + Date.now(),
          created_at: new Date().toISOString()
        };
        
        console.log('Successfully saved invoice to Supabase (mock):', mockData);
        return mockData;
      }
      
      const { data, error } = await supabase
        .from('invoices')
        .insert(supabaseInvoice)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error details:', error.message, error.details, error.code);
        throw error;
      }
      
      console.log('Successfully saved invoice to Supabase:', data);
      return data;
    } catch (error) {
      console.error('Error saving invoice to Supabase:', error);
      throw error;
    }
  }
};

export default api;
