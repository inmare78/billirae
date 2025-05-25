import api from './api';

export const invoiceService = {
  /**
   * Generate a PDF for a specific invoice
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
   * Send an invoice via email
   * @param invoiceId Invoice ID
   * @param emailData Email data (recipient, subject, message, cc)
   * @returns Success response
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
      console.error('Error sending invoice email:', error);
      throw error;
    }
  },
  
  /**
   * Get the PDF URL for a specific invoice
   * @param invoiceId Invoice ID
   * @returns PDF URL
   */
  getPDFUrl: (invoiceId: string) => {
    return `${api.defaults.baseURL}/invoices/${invoiceId}/pdf`;
  },
  
  /**
   * Create a new invoice from parsed voice data
   * @param invoiceData Invoice data from voice parsing
   * @returns Created invoice
   */
  createInvoice: async (invoiceData: Record<string, unknown>) => {
    try {
      const response = await api.post('/invoices', invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  },
  
  /**
   * Get a list of invoices
   * @param page Page number
   * @param limit Items per page
   * @returns List of invoices
   */
  getInvoices: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/invoices?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }
  },
  
  /**
   * Get a specific invoice by ID
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
   * Update an invoice
   * @param invoiceId Invoice ID
   * @param invoiceData Updated invoice data
   * @returns Updated invoice
   */
  updateInvoice: async (invoiceId: string, invoiceData: Record<string, unknown>) => {
    try {
      const response = await api.put(`/invoices/${invoiceId}`, invoiceData);
      return response.data;
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }
  },
  
  /**
   * Delete an invoice
   * @param invoiceId Invoice ID
   * @returns Success response
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

export default invoiceService;
