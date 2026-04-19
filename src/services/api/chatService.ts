import axios from 'axios';

const API_URL = 'https://agrivisionbackend-judy.onrender.com/api/chat';
// ⚠️ Replace with your IP (not localhost)

export const sendChatMessage = async (query: string, language: string) => {
  try {
    const response = await axios.post(API_URL, {
      query,
      language,
    });

    return response.data;
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
};

export const generateSpeech = async (text: string, language: string) => {
  try {
    const response = await axios.post(`${API_URL}/speech`, {
      text,
      language,
    });

    return response.data.audioUrl;
  } catch (error) {
    console.error('Speech API error:', error);
    throw error;
  }
};