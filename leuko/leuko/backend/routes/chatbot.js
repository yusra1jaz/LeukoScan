const express = require('express');
const GeminiService = require('../services/geminiService');
const database = require('../models/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware
router.use(authMiddleware);

// Bot response with AI integration - User-specific conversations
router.post('/respond', async (req, res) => {
  try {
    const { prompt, chatId } = req.body;
    const userId = req.user.id;
    
    console.log('Received chat request:', { prompt, chatId, userId });
    
    let convId = chatId;
    
    // If no chatId provided, create a new chat for this user
    if (!convId) {
      const now = new Date().toISOString();
      const result = await database.run(
        'INSERT INTO chats (user_id, title, createdAt, updatedAt) VALUES (?, ?, ?, ?)',
        [userId, 'New Chat', now, now]
      );
      convId = result.id;
    }
    
    // Verify the chat belongs to the authenticated user
    const chat = await database.get('SELECT id FROM chats WHERE id = ? AND user_id = ?', [convId, userId]);
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found or access denied' });
    }
    
    // Add user message to database
    const userTimestamp = new Date().toISOString();
    await database.run(
      'INSERT INTO messages (chat_id, sender, text, timestamp) VALUES (?, ?, ?, ?)',
      [convId, 'user', prompt, userTimestamp]
    );
    
    // Generate AI response using Gemini (Google's free AI)
    const aiResponse = await GeminiService.generateResponse(prompt, convId, database);
    const cleanResponse = aiResponse.response;
    
    // Add AI response to database
    const botTimestamp = new Date().toISOString();
    await database.run(
      'INSERT INTO messages (chat_id, sender, text, timestamp) VALUES (?, ?, ?, ?)',
      [convId, 'assistant', cleanResponse, botTimestamp]
    );
    
    // Update chat's updatedAt timestamp
    await database.run('UPDATE chats SET updatedAt = ? WHERE id = ?', [botTimestamp, convId]);
    
    console.log(`AI Response: ${cleanResponse}`);
    
    res.json({
      response: cleanResponse,
      conversationId: convId,
      timestamp: botTimestamp,
      model: 'llama2-7b'
    });
    
  } catch (error) {
    console.error('Error generating response:', error.message);
    res.status(500).json({ 
      error: 'AI processing failed',
      details: error.message
    });
  }
});

module.exports = router;
