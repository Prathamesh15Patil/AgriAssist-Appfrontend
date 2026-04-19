import axios from 'axios';

const API_URL = 'https://agrivisionbackend-judy.onrender.com/api/voice-to-text';

export const uploadAudio = async (fileUri: string, language?: string): Promise<string> => {
  try {
    const formData = new FormData();

    formData.append('audio', {
      uri: fileUri,
      name: 'voice.m4a',
      type: 'audio/m4a',
    } as any);

    if (language) {
      formData.append('language', language);
    }

    console.log('[Voice] Uploading to:', API_URL);

    const response = await axios.post(API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    console.log('[Voice] Upload success:', response.data);
    return response.data?.text || '';
  } catch (error) {
    console.error('[Voice] Upload failed - URL:', API_URL);

    throw error;
  }
};

