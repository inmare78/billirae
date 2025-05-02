import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
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
   * @param text Voice transcript text in German
   * @returns Parsed invoice data
   */
  parseVoiceTranscript: async (text: string) => {
    try {
      const response = await api.post('/voice/parse', { text });
      return response.data.parsed_data;
    } catch (error) {
      console.error('Error parsing voice transcript:', error);
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
      const response = await api.get('/users/profile');
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
      const response = await api.put('/users/profile', profileData);
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
      const response = await api.get('/users/export');
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
      const response = await api.delete('/users/account');
      return response.data;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  },
};

export default api;
