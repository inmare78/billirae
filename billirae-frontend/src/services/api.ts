import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export default api;
