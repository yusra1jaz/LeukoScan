const axios = require('axios');

class GeminiService {
  static async generateResponse(prompt, chatId = null, db = null) {
    try {
      if (!prompt.trim()) {
        throw new Error('Please provide a prompt');
      }

      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey || apiKey === 'your_groq_api_key_here') {
        throw new Error('Please add your Groq API key to .env file');
      }

      console.log('Using Groq API...');

      // Call Groq API with Llama model
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        }, {
          timeout: 20000,
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const cleanResponse = response.data.choices?.[0]?.message?.content || 'I apologize, but I had trouble generating a response.';
      
      console.log('Groq response received successfully');

      return {
        response: cleanResponse,
        conversationId: chatId,
        timestamp: new Date().toISOString(),
        model: 'llama-3.1-8b (Groq)'
      };

    } catch (error) {
      console.error('Groq API Error:', error.message);
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      
      // Wait and retry once for rate limits
      if (error.response?.status === 429) {
        console.log('Rate limited, waiting 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
          const retryResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: 'llama-3.1-8b-instant',
              messages: [
                {
                  role: 'user',
                  content: prompt
                }
              ],
              max_tokens: 1500,
              temperature: 0.7
            }, {
              timeout: 20000,
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          const cleanResponse = retryResponse.data.choices?.[0]?.message?.content || 'I apologize, but I had trouble generating a response.';
          console.log('Retry successful!');
          
          return {
            response: cleanResponse,
            conversationId: chatId,
            timestamp: new Date().toISOString(),
            model: 'llama-3.1-8b (Groq)'
          };
          
        } catch (retryError) {
          console.error('Retry failed:', retryError.message);
          throw new Error('API is busy. Please try again.');
        }
      }
      
      throw new Error(`API Error: ${error.message}`);
    }
  }
}

module.exports = GeminiService;
