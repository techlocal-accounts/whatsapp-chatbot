require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Twilio credentials with validation
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// OpenAI configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// In-memory storage for conversation history per user
const userConversations = new Map();

// Debug: Check if credentials are loaded (don't log full values for security)
console.log('🔍 Environment check:');
console.log('TWILIO_ACCOUNT_SID:', accountSid ? `Set (${accountSid.substring(0, 8)}...)` : 'NOT SET');
console.log('TWILIO_AUTH_TOKEN:', authToken ? `Set (${authToken.substring(0, 8)}...)` : 'NOT SET');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `Set (${process.env.OPENAI_API_KEY.substring(0, 8)}...)` : 'NOT SET');

// Validate credentials before creating client
if (!accountSid || !authToken || accountSid === 'your_account_sid_here' || authToken === 'your_auth_token_here') {
  console.warn('⚠️  Twilio credentials not properly configured. WhatsApp features will be disabled.');
  console.warn('   To enable WhatsApp, set real TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in .env file');
} else {
  const client = twilio(accountSid, authToken);
  
  // Validate Twilio client on startup
  console.log('🔧 Testing Twilio connection...');
  client.api.accounts(accountSid)
    .fetch()
    .then(account => {
      console.log('✅ Twilio connection successful! Account:', account.friendlyName);
    })
    .catch(err => {
      console.error('❌ Twilio connection failed:', err.message);
      console.error('   Please check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    });
}

// Initialize Twilio client if credentials are valid
let client = null;
if (accountSid && authToken && accountSid !== 'your_account_sid_here' && authToken !== 'your_auth_token_here') {
  client = twilio(accountSid, authToken);
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OpenAI API key not set. Summarization features will be disabled.');
}

// Enhanced responses with summarization commands
const responses = {
  'hello': 'Hello! 👋 How can I help you today?',
  'hi': 'Hi there! 😊 What can I do for you?',
  'help': `I can help you with:
• General questions
• Information about our services
• 📝 **Message Summarization**: 
  - Send "summarize" to get a summary of our recent conversation
  - Send "clear history" to clear your message history
  - Your messages are automatically stored for summarization
• Just type your message and I'll do my best to assist!`,
  'bye': 'Goodbye! 👋 Have a great day!',
  'thanks': 'You\'re welcome! 😊 Is there anything else I can help you with?',
  'default': 'I\'m a smart chatbot with summarization features! Try saying "hello", "help", "summarize", or ask me a question!'
};

// Function to store user message in conversation history
function storeMessage(phoneNumber, message, isBot = false) {
  if (!userConversations.has(phoneNumber)) {
    userConversations.set(phoneNumber, []);
  }
  
  const conversation = userConversations.get(phoneNumber);
  conversation.push({
    timestamp: new Date(),
    message: message,
    isBot: isBot
  });
  
  // Keep only last 50 messages to manage memory
  if (conversation.length > 50) {
    conversation.splice(0, conversation.length - 50);
  }
}

// Function to get conversation history for a user
function getConversationHistory(phoneNumber) {
  return userConversations.get(phoneNumber) || [];
}

// Function to clear conversation history
function clearConversationHistory(phoneNumber) {
  userConversations.delete(phoneNumber);
}

// Function to summarize conversation using OpenAI
async function summarizeConversation(phoneNumber) {
  const conversation = getConversationHistory(phoneNumber);
  
  if (conversation.length === 0) {
    return "No conversation history found to summarize.";
  }
  
  if (!process.env.OPENAI_API_KEY) {
    return "Summarization feature is not available. Please configure OpenAI API key.";
  }
  
  try {
    // Format conversation for summarization
    const conversationText = conversation
      .map(msg => `${msg.isBot ? 'Bot' : 'User'}: ${msg.message}`)
      .join('\n');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes conversations. Provide a concise, clear summary of the key points and topics discussed in the conversation."
        },
        {
          role: "user",
          content: `Please summarize this conversation:\n\n${conversationText}`
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });
    
    return `📝 **Conversation Summary:**\n\n${completion.choices[0].message.content}`;
    
  } catch (error) {
    console.error('❌ Error generating summary:', error);
    return "Sorry, I couldn't generate a summary right now. Please try again later.";
  }
}

// Function to generate bot response
async function generateResponse(userMessage, phoneNumber) {
  const message = userMessage.toLowerCase().trim();
  
  // Handle summarization commands
  if (message === 'summarize' || message === 'summary') {
    return await summarizeConversation(phoneNumber);
  }
  
  if (message === 'clear history' || message === 'clear') {
    clearConversationHistory(phoneNumber);
    return "✅ Your conversation history has been cleared!";
  }
  
  if (message === 'history' || message === 'my history') {
    const history = getConversationHistory(phoneNumber);
    if (history.length === 0) {
      return "No conversation history found.";
    }
    return `📋 You have ${history.length} messages in your history. Send "summarize" to get a summary or "clear history" to clear it.`;
  }
  
  // Check for exact matches first
  if (responses[message]) {
    return responses[message];
  }
  
  // Check for partial matches
  if (message.includes('hello') || message.includes('hi')) {
    return responses['hello'];
  }
  
  if (message.includes('help') || message.includes('support')) {
    return responses['help'];
  }
  
  if (message.includes('bye') || message.includes('goodbye')) {
    return responses['bye'];
  }
  
  if (message.includes('thank') || message.includes('thanks')) {
    return responses['thanks'];
  }
  
  // Add some fun responses
  if (message.includes('joke')) {
    return 'Why don\'t scientists trust atoms? Because they make up everything! 😄';
  }
  
  if (message.includes('weather')) {
    return 'I wish I could check the weather for you! 🌤️ Try checking your weather app or asking a voice assistant.';
  }
  
  if (message.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}`;
  }
  
  // Enhanced AI response for general questions
  if (process.env.OPENAI_API_KEY && message.length > 10) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful WhatsApp chatbot assistant. Provide helpful, concise responses. Keep responses under 300 characters for WhatsApp compatibility."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      });
      
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('❌ Error generating AI response:', error);
      // Fall through to default response
    }
  }
  
  // Default response
  return responses['default'];
}

// Function to handle incoming WhatsApp messages
async function handleIncomingMessage(req, res) {
  console.log('📱 Incoming message:', req.body);
  
  const incomingMessage = req.body.Body;
  const from = req.body.From;
  const to = req.body.To;
  
  // Validate required fields
  if (!incomingMessage || !from || !to) {
    console.error('❌ Missing required fields in webhook payload');
    return res.status(400).send('Missing required fields');
  }
  
  // Store user message in conversation history
  storeMessage(from, incomingMessage, false);
  
  // Generate response
  const botResponse = await generateResponse(incomingMessage, from);
  
  // Store bot response in conversation history
  storeMessage(from, botResponse, true);
  
  console.log(`🤖 Sending response to ${from}: "${botResponse}"`);
  
  // Send response back to WhatsApp
  if (client) { // Only send if client is initialized
    client.messages
      .create({
        body: botResponse,
        from: to, // This is your Twilio WhatsApp number
        to: from  // This is the user's WhatsApp number
      })
      .then(message => {
        console.log('✅ Message sent successfully! SID:', message.sid);
        res.status(200).send('Message sent');
      })
      .catch(error => {
        console.error('❌ Error sending message:', error);
        console.error('   Status:', error.status);
        console.error('   Code:', error.code);
        console.error('   Message:', error.message);
        if (error.moreInfo) {
          console.error('   More info:', error.moreInfo);
        }
        res.status(500).send('Error sending message');
      });
  } else {
    console.warn('⚠️  Twilio client not initialized. Cannot send message to WhatsApp.');
    res.status(503).json({ 
      error: 'WhatsApp service unavailable',
      message: 'Twilio credentials not configured. Check your .env file.',
      botResponse: botResponse // Still return the bot response for testing
    });
  }
}

// Webhook endpoint for receiving WhatsApp messages
app.post('/webhook', handleIncomingMessage);

// Also handle webhook at root path (in case Twilio is configured to post to /)
app.post('/', (req, res) => {
  console.log('📱 Webhook received at root path "/" - processing message');
  handleIncomingMessage(req, res);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    features: {
      summarization: !!process.env.OPENAI_API_KEY,
      conversationStorage: true,
      whatsapp: !!client
    }
  });
});

// Test endpoint for trying the chatbot without WhatsApp
app.post('/test-chat', async (req, res) => {
  try {
    const { message, phoneNumber = 'test-user' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Store user message
    storeMessage(phoneNumber, message, false);
    
    // Generate response
    const botResponse = await generateResponse(message, phoneNumber);
    
    // Store bot response
    storeMessage(phoneNumber, botResponse, true);
    
    res.json({
      userMessage: message,
      botResponse: botResponse,
      conversationLength: getConversationHistory(phoneNumber).length
    });
    
  } catch (error) {
    console.error('❌ Error in test chat:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp Chatbot Server with AI Summarization is running!',
    endpoints: {
      webhook: '/webhook',
      health: '/health',
      testChat: '/test-chat (POST)'
    },
    features: {
      summarization: !!process.env.OPENAI_API_KEY,
      conversationStorage: true,
      whatsapp: !!client
    },
    usage: {
      testChat: 'POST to /test-chat with {"message": "your message"} to test the bot without WhatsApp'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`🤖 WhatsApp Chatbot server running on port ${port}`);
  console.log(`📱 Webhook URL: http://localhost:${port}/webhook`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
  console.log(`🧠 AI Features: ${process.env.OPENAI_API_KEY ? 'Enabled' : 'Disabled (add OPENAI_API_KEY to enable)'}`);
});

module.exports = app; 