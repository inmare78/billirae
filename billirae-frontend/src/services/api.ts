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
   * @returns Success message
   */
  sendEmail: async (invoiceId: string, emailData: {
    recipient_email: string;
    subject?: string;
    message?: string;
    cc_emails?: string[];
  }) => {
    try {
      const response = await api.post(`/invoices/${invoiceId}/send-email`, emailData);
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

export default api;
