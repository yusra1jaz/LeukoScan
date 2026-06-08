import React, { useState, useEffect, useRef } from "react";
import { Send, User, Bot, Menu, X, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/auth/AuthContext";
interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}
interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const ChatbotFinal: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load conversations from API on mount
  useEffect(() => {
    if (!user) {
      console.log('No user found, skipping chat load');
      return;
    }
    console.log('Loading conversations for user:', user);
    const loadConversations = async () => {
      try {
        console.log('Making API call to:', `${API_URL}/api/chats`);
        
        const response = await axios.get(`${API_URL}/api/chats`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 5000 // 5 second timeout
        });
        
        console.log('API response:', response.data);
        
        if (response.data && Array.isArray(response.data)) {
          console.log('Found', response.data.length, 'chats');
          
          const formattedConversations = response.data.map((chat: any) => ({
            id: chat.id.toString(),
            title: chat.title,
            messages: [], // Start with empty messages
            createdAt: new Date(chat.createdAt)
          }));
          
          console.log('Formatted conversations:', formattedConversations);
          setConversations(formattedConversations);
          
          // Auto-select and load the most recent chat
          if (formattedConversations.length > 0) {
            const mostRecentChat = formattedConversations[0];
            console.log('Auto-selecting chat:', mostRecentChat);
            setCurrentConversation(mostRecentChat);
            
            // Load messages for the most recent chat
            try {
              console.log('Loading messages for chat:', mostRecentChat.id);
              const messagesResponse = await axios.get(`${API_URL}/api/chats/${mostRecentChat.id}/messages`, {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json'
                },
                timeout: 5000
              });
              
              console.log('Messages response:', messagesResponse.data);
              
              const chatWithMessages = {
                ...mostRecentChat,
                messages: (messagesResponse.data as any[]).map((msg: any) => ({
                  id: msg.id.toString(),
                  text: msg.text,
                  sender: msg.sender,
                  timestamp: new Date(msg.timestamp)
                }))
              };
              
              console.log('Chat with messages:', chatWithMessages);
              setCurrentConversation(chatWithMessages);
              setConversations(prev => 
                prev.map(c => c.id === mostRecentChat.id ? chatWithMessages : c)
              );
            } catch (error) {
              console.error("Error loading recent chat messages:", error);
            }
          } else {
            console.log('No conversations found');
          }
        }
      } catch (error) {
        console.error("Error loading conversations:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorResponse = (error as any).response?.data || errorMessage;
        console.error("Error details:", errorResponse);
        // If API fails, start with empty state instead of hanging
        setConversations([]);
        setCurrentConversation(null);
      } finally {
        setIsLoaded(true);
      }
    };

    loadConversations();
  }, [user]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [menuOpenId]);
  const handleSendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    let chatId = currentConversation?.id;
    // Create new conversation if none exists
    if (!chatId) {
      try {
        const response = await axios.post(`${API_URL}/api/chats`, {}, {
          withCredentials: true,
          timeout: 5000
        });
        const newChat = response.data as any;
        // Use the actual first message as the title (like ChatGPT does)
        const chatTitle = inputText.length > 50 ? inputText.substring(0, 50) + "..." : inputText; 
        // Update the chat title immediately
        await axios.put(`${API_URL}/api/chats/${newChat.id}/title`, {
          title: chatTitle
        }, {
          withCredentials: true,
          timeout: 5000
        }); 
        const formattedConversation: Conversation = {
          id: newChat.id.toString(),
          title: chatTitle,
          messages: [],
          createdAt: new Date(newChat.createdAt)
        };
        setConversations(prev => [formattedConversation, ...prev]);
        setCurrentConversation(formattedConversation);
        chatId = newChat.id.toString();
      } catch (error) {
        console.error("Error creating new chat:", error);
        setIsTyping(false);
        return;
      }
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };
    // Add user message to current conversation
    if (currentConversation) {
      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, userMessage],
      };
      setCurrentConversation(updatedConversation);
      setConversations(prev => 
        prev.map(conv => conv.id === chatId ? updatedConversation : conv)
      );
    }
    setInputText("");
    setIsTyping(true);
    try {
      // Call AI backend with authentication
      const response = await axios.post(`${API_URL}/chatbot/respond`, {
        prompt: inputText,
        chatId: chatId,
      }, {
        withCredentials: true,
        timeout: 10000 // 10 second timeout for AI response
      });
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: (response.data as any).response || 'Sorry, I had trouble processing that.',
        sender: "bot",
        timestamp: new Date(),
      };
      // Add bot message to current conversation
      if (currentConversation) {
        const conversationWithBot = {
          ...currentConversation,
          messages: [...currentConversation.messages, userMessage, botMessage],
        };
        setCurrentConversation(conversationWithBot);
        setConversations(prev => 
          prev.map(conv => conv.id === chatId ? conversationWithBot : conv)
        );
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      console.error("Error details:", error.response?.data || error.message);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `❌ Error: ${error.response?.data?.error || error.message || "Unknown error occurred"}`,
        sender: "bot",
        timestamp: new Date(),
      };
      if (currentConversation) {
        const updatedConversation = {
          ...currentConversation,
          messages: [...currentConversation.messages, errorMessage],
        };
        setCurrentConversation(updatedConversation);
        setConversations(prev => 
          prev.map(conv => conv.id === chatId ? updatedConversation : conv)
        );
      }
    } finally {
      setIsTyping(false);
    }
  };
  const handleNewChat = async () => {
    // Don't create a chat immediately - wait for first message to generate title
    // This mimics ChatGPT behavior where you start typing and the chat gets a title later
    setCurrentConversation(null);
  };
  const handleDeleteConversation = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/api/chats/${id}`, {
        withCredentials: true
      });
      const updatedConversations = conversations.filter((conv) => conv.id !== id);
      setConversations(updatedConversations);
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };
  const handleRenameConversation = (id: string, newTitle: string) => {
    const updatedConversations = conversations.map((conv) =>
      conv.id === id ? { ...conv, title: newTitle } : conv
    );
    setConversations(updatedConversations);
    if (currentConversation?.id === id) {
      setCurrentConversation({ ...currentConversation, title: newTitle });
    }
  };
  const switchChat = async (chatId: string) => {
    try {
      // Load messages for this specific chat
      const response = await axios.get(`${API_URL}/api/chats/${chatId}/messages`, {
        withCredentials: true,
        timeout: 5000
      });
      const chat = conversations.find((c) => c.id === chatId);
      if (chat) {
        const updatedChat = {
          ...chat,
          messages: (response.data as any[]).map((msg: any) => ({
            id: msg.id.toString(),
            text: msg.text,
            sender: msg.sender,
            timestamp: new Date(msg.timestamp)
          }))
        };
        setCurrentConversation(updatedChat);
        // Update the conversation in the list
        setConversations(prev => 
          prev.map(c => c.id === chatId ? updatedChat : c)
        );
      }
    } catch (error) {
      console.error("Error loading chat messages:", error);
      const chat = conversations.find((c) => c.id === chatId);
      if (chat) {
        setCurrentConversation({
          ...chat,
          messages: []
        });
      }
    }
  };
  const toggleMenu = (id: string) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };
  const navigate = useNavigate();
  const handleClearChats = async () => {
    if (confirm("Are you sure you want to clear all chat history?")) {
      try {
        // Delete all conversations
        for (const conversation of conversations) {
          await axios.delete(`${API_URL}/api/chats/${conversation.id}`, {
            withCredentials: true
          });
        }
        setConversations([]);
        setCurrentConversation(null);
      } catch (error) {
        console.error("Error clearing chats:", error);
      }
    }
  };
  const filteredConversations = conversations;
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {!isLoaded ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading chat history...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Top Options Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  title="Open sidebar"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <h1 className="text-xl font-semibold text-gray-800">AI Chatbot</h1>
            </div>
            <div className="flex items-center gap-2">
            </div>
          </div>
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div
              className={`${
                sidebarOpen ? "w-80" : "w-0"
              } bg-white border-r border-gray-200 transition-all duration-300 ease-in-out`}
            >
              {sidebarOpen && (
                <div className="p-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg"
                      title="Close sidebar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* New Chat Button */}
                  <button
                    onClick={handleNewChat}
                    className="w-full mb-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    New Chat
                  </button>
                  {/* Clear Chats Button */}
                  <button
                    onClick={handleClearChats}
                    className="w-full mb-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    Clear All Chats
                  </button>
                  {/* Conversations List */}
                  <div className="space-y-2">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          currentConversation?.id === conversation.id
                            ? "bg-indigo-50 border-indigo-200"
                            : "bg-white border-gray-200 hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          switchChat(conversation.id);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-800 truncate">
                              {conversation.title}
                            </h3>
                          </div>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMenu(conversation.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                              title="Options"
                            >
                              <Menu className="w-4 h-4" />
                            </button>
                            {menuOpenId === conversation.id && (
                              <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newTitle = prompt(
                                      "Enter new title:",
                                      conversation.title
                                    );
                                    if (newTitle) {
                                      handleRenameConversation(conversation.id, newTitle);
                                    }
                                    toggleMenu(conversation.id);
                                  }}
                                  className="w-full text-left px-3 py-1 hover:bg-gray-100 flex items-center gap-2 text-sm"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  Rename
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (confirm("Delete this conversation?")) {
                                      handleDeleteConversation(conversation.id);
                                    }
                                    toggleMenu(conversation.id);
                                  }}
                                  className="w-full text-left px-3 py-1 hover:bg-gray-100 flex items-center gap-2 text-sm"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Main Chat Area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-32">
                {currentConversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    } mb-4`}
                  >
                    {message.sender === "user" ? (
                      <div
                        className="max-w-xs lg:max-w-md px-4 py-3 rounded-lg bg-indigo-600 text-white"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4" />
                          <span className="text-xs text-gray-200">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-base leading-relaxed">{message.text}</p>
                      </div>
                    ) : (
                      <div className="w-full max-w-4xl">
                        <div className="flex items-center gap-2 mb-2 justify-center">
                          <Bot className="w-4 h-4 text-gray-600" />
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div 
                          className="text-base leading-relaxed text-gray-800 text-left w-full"
                          dangerouslySetInnerHTML={{ 
                            __html: message.text
                              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n\n/g, '</p><p>')
                              .replace(/\n/g, '<br>')
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-gray-100 text-gray-900 border border-gray-200 rounded-lg px-4 py-3 w-full max-w-4xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className="w-4 h-4" />
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <span className="text-sm">AI is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Exact ChatGPT Input Bar */}
                <div className="max-w-2xl mx-auto px-4">
                  <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg ring-2 ring-gray-400">
                    <div className="flex gap-3 p-3">
                      <div className="flex-1 relative">
                        <textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Send a message..."
                          className="w-full resize-none border-0 bg-transparent py-3 px-4 pr-12 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-0"
                          rows={1}
                          disabled={isTyping}
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputText.trim() || isTyping}
                          className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-gray-600 disabled:text-gray-300"
                          title="Send message"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default ChatbotFinal;
