require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Twilio credentials with validation
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Debug: Check if credentials are loaded (don't log full values for security)
console.log('🔍 Environment check:');
console.log('TWILIO_ACCOUNT_SID:', accountSid ? `Set (${accountSid.substring(0, 8)}...)` : 'NOT SET');
console.log('TWILIO_AUTH_TOKEN:', authToken ? `Set (${authToken.substring(0, 8)}...)` : 'NOT SET');

// Validate credentials before creating client
if (!accountSid || !authToken) {
  console.error('❌ Missing Twilio credentials! Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
  process.exit(1);
}

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

// Simple chatbot responses
const responses = {
  'hello': 'Hello! 👋 How can I help you today?',
  'hi': 'Hi there! 😊 What can I do for you?',
  'help': 'I can help you with:\n• General questions\n• Information about our services\n• Just type your message and I\'ll do my best to assist!',
  'bye': 'Goodbye! 👋 Have a great day!',
  'thanks': 'You\'re welcome! 😊 Is there anything else I can help you with?',
  'default': 'I\'m a simple chatbot. Try saying "hello", "help", or ask me a question!'
};

// Function to generate bot response
function generateResponse(userMessage) {
  const message = userMessage.toLowerCase().trim();
  
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
  
  // Default response
  return responses['default'];
}

// Function to handle incoming WhatsApp messages
function handleIncomingMessage(req, res) {
  console.log('📱 Incoming message:', req.body);
  
  const incomingMessage = req.body.Body;
  const from = req.body.From;
  const to = req.body.To;
  
  // Validate required fields
  if (!incomingMessage || !from || !to) {
    console.error('❌ Missing required fields in webhook payload');
    return res.status(400).send('Missing required fields');
  }
  
  // Generate response
  const botResponse = generateResponse(incomingMessage);
  
  console.log(`🤖 Sending response to ${from}: "${botResponse}"`);
  
  // Send response back to WhatsApp
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
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp Chatbot Server is running!',
    endpoints: {
      webhook: '/webhook',
      health: '/health'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`🤖 WhatsApp Chatbot server running on port ${port}`);
  console.log(`📱 Webhook URL: http://localhost:${port}/webhook`);
  console.log(`💚 Health check: http://localhost:${port}/health`);
});

module.exports = app; 