require('dotenv').config();
const twilio = require('twilio');

console.log('🔧 Testing Twilio Configuration...\n');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

console.log('Environment Variables:');
console.log('TWILIO_ACCOUNT_SID:', accountSid ? `✅ Set (${accountSid.substring(0, 8)}...)` : '❌ NOT SET');
console.log('TWILIO_AUTH_TOKEN:', authToken ? `✅ Set (${authToken.substring(0, 8)}...)` : '❌ NOT SET');
console.log('');

if (!accountSid || !authToken) {
  console.error('❌ Missing credentials! Please check your .env file or environment variables.');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

// Test account access
console.log('Testing account access...');
client.api.accounts(accountSid)
  .fetch()
  .then(account => {
    console.log('✅ Account access successful!');
    console.log(`   Account Name: ${account.friendlyName}`);
    console.log(`   Account SID: ${account.sid}`);
    console.log(`   Status: ${account.status}`);
    console.log('');
    
    // Test getting WhatsApp numbers
    console.log('Checking WhatsApp numbers...');
    return client.incomingPhoneNumbers.list({limit: 20});
  })
  .then(incomingPhoneNumbers => {
    const whatsappNumbers = incomingPhoneNumbers.filter(number => 
      number.capabilities.sms && number.phoneNumber.includes('whatsapp:')
    );
    
    if (whatsappNumbers.length > 0) {
      console.log('✅ WhatsApp numbers found:');
      whatsappNumbers.forEach(number => {
        console.log(`   ${number.phoneNumber} (${number.friendlyName})`);
      });
    } else {
      console.log('⚠️  No WhatsApp numbers found. Make sure you have a Twilio WhatsApp sandbox or approved number.');
    }
    console.log('');
    console.log('🎉 Twilio configuration test completed successfully!');
  })
  .catch(error => {
    console.error('❌ Twilio test failed:', error.message);
    console.error('   Status:', error.status);
    console.error('   Code:', error.code);
    if (error.moreInfo) {
      console.error('   More info:', error.moreInfo);
    }
    console.log('');
    console.log('💡 Common solutions:');
    console.log('   1. Double-check your TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN');
    console.log('   2. Make sure the credentials are from the correct Twilio project');
    console.log('   3. Verify your Twilio account is active and not suspended');
    process.exit(1);
  }); 