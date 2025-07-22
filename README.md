# WhatsApp Chatbot with Twilio

A simple yet powerful WhatsApp chatbot built with Node.js, Express, and Twilio's WhatsApp API.

## Features

- 🤖 Automated responses to common messages
- 📱 WhatsApp integration via Twilio
- 🔄 Webhook-based message handling
- 🎭 Customizable response logic
- 🚀 Easy deployment ready

## Prerequisites

Before you begin, ensure you have:

1. **Node.js** (version 14 or higher)
2. **npm** or **yarn**
3. **Twilio Account** with WhatsApp integration
4. **ngrok** (for local development) or a hosting service

## Quick Setup

### 1. Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### 2. Set Up Twilio

1. **Create a Twilio Account**: Go to [twilio.com](https://www.twilio.com) and sign up
2. **Get WhatsApp Sandbox**: In your Twilio Console, go to Messaging > Try it out > Send a WhatsApp message
3. **Find Your Credentials**: 
   - Account SID: Found in your Twilio Console Dashboard
   - Auth Token: Found in your Twilio Console Dashboard (click the eye icon to reveal)

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Twilio credentials:
   ```
   TWILIO_ACCOUNT_SID=your_actual_account_sid
   TWILIO_AUTH_TOKEN=your_actual_auth_token
   PORT=3000
   ```

### 4. Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

The server will start on `http://localhost:3000`

### 5. Expose Your Local Server (for Development)

Install ngrok if you haven't already:
```bash
# Install ngrok
npm install -g ngrok

# In a new terminal, expose your local server
ngrok http 3000
```

Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)

### 6. Configure Twilio Webhook

1. Go to your Twilio Console
2. Navigate to Messaging > Settings > WhatsApp sandbox settings
3. Set the webhook URL to: `https://your-ngrok-url.ngrok.io/webhook`
4. Set the HTTP method to `POST`
5. Save the configuration

## Testing Your Bot

1. **Join the Sandbox**: Send the join code to your Twilio WhatsApp sandbox number
2. **Start Chatting**: Send messages like:
   - "hello" - Get a greeting
   - "help" - See available commands
   - "joke" - Get a random joke
   - "time" - Get current time
   - "weather" - Get weather info prompt

## Customizing Responses

Edit the `responses` object in `server.js` to add your own custom responses:

```javascript
const responses = {
  'your_trigger': 'Your custom response here',
  // Add more responses...
};
```

You can also modify the `generateResponse()` function to add more complex logic.

## API Endpoints

- `GET /` - Server status and information
- `POST /webhook` - Twilio webhook for incoming messages
- `GET /health` - Health check endpoint

## Deployment

### Deploy to Heroku

1. Create a Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Set environment variables:
   ```bash
   heroku config:set TWILIO_ACCOUNT_SID=your_sid
   heroku config:set TWILIO_AUTH_TOKEN=your_token
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

4. Update your Twilio webhook URL to: `https://your-app-name.herokuapp.com/webhook`

### Deploy to Other Platforms

The app can be deployed to any Node.js hosting service:
- **Railway**: Connect your GitHub repo and deploy
- **Render**: Push to GitHub and auto-deploy
- **DigitalOcean App Platform**: Deploy from GitHub
- **AWS EC2**: Use PM2 for process management

## Troubleshooting

### Common Issues

1. **"Cannot POST /webhook"**: Make sure your server is running and the URL is correct
2. **No responses from bot**: Check that your Twilio credentials are correct in the `.env` file
3. **Webhook not receiving messages**: Ensure your ngrok URL is HTTPS and properly configured in Twilio
4. **Message sending fails**: Verify your Twilio Account SID and Auth Token

### Debugging

- Check server logs in the terminal
- Use the `/health` endpoint to verify the server is running
- Test webhook delivery in the Twilio Console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Next Steps

Consider adding:
- 🧠 AI integration (OpenAI, Google Dialogflow)
- 💾 Database storage for conversation history
- 🔒 User authentication and sessions
- 📊 Analytics and metrics
- 🌐 Multi-language support
- 🎯 Intent recognition and NLP 