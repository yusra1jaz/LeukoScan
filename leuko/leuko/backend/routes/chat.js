const express = require('express');
const database = require('../models/database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get all chats for the authenticated user (without messages for faster loading)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await database.all('SELECT id, title, createdAt, updatedAt FROM chats WHERE user_id = ? ORDER BY updatedAt DESC', [userId]);
    
    // Add empty messages array for each chat
    const chatsWithMessages = chats.map(chat => ({
      ...chat,
      messages: []
    }));
    
    res.json(chatsWithMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new chat for the authenticated user
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date().toISOString();
    const result = await database.run('INSERT INTO chats (user_id, title, createdAt, updatedAt) VALUES (?, ?, ?, ?)', [userId, 'New Chat', now, now]);
    
    res.json({ 
      id: result.id, 
      title: 'New Chat', 
      messages: [], 
      createdAt: now, 
      updatedAt: now 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get messages for a specific chat
router.get('/:id/messages', async (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    const userId = req.user.id;
    
    if (Number.isNaN(chatId)) {
      return res.status(400).json({ message: 'Invalid chat id' });
    }

    // Verify the chat belongs to the authenticated user
    const chat = await database.get('SELECT id FROM chats WHERE id = ? AND user_id = ?', [chatId, userId]);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    const messages = await database.all('SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC', [chatId]);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add message to chat
router.post('/:id/messages', async (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    const { sender, text, timestamp } = req.body;
    const ts = timestamp || new Date().toISOString();
    
    const result = await database.run('INSERT INTO messages (chat_id, sender, text, timestamp) VALUES (?, ?, ?, ?)',
      [chatId, sender, text, ts]
    );
    
    await database.run('UPDATE chats SET updatedAt = ? WHERE id = ?', [ts, chatId]);
    
    res.json({ 
      id: result.id, 
      chat_id: chatId, 
      sender, 
      text, 
      timestamp: ts 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update chat title
router.put('/:id/title', async (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    const userId = req.user.id;
    const { title } = req.body;
    
    if (Number.isNaN(chatId)) {
      return res.status(400).json({ message: 'Invalid chat id' });
    }

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Verify the chat belongs to the authenticated user
    const chat = await database.get('SELECT id FROM chats WHERE id = ? AND user_id = ?', [chatId, userId]);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    await database.run('UPDATE chats SET title = ? WHERE id = ?', [title.trim(), chatId]);
    
    res.json({ success: true, title: title.trim() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a chat and its messages (only if it belongs to the authenticated user)
router.delete('/:id', async (req, res) => {
  try {
    const chatId = parseInt(req.params.id);
    const userId = req.user.id;
    
    if (Number.isNaN(chatId)) {
      return res.status(400).json({ message: 'Invalid chat id' });
    }

    // First check if the chat belongs to the authenticated user
    const chat = await database.get('SELECT id FROM chats WHERE id = ? AND user_id = ?', [chatId, userId]);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    // First delete messages for this chat
    await database.run('DELETE FROM messages WHERE chat_id = ?', [chatId]);
    
    // Then delete the chat itself
    const result = await database.run('DELETE FROM chats WHERE id = ?', [chatId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
