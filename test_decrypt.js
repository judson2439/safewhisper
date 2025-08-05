// Quick test to verify decryption works
const CryptoJS = require('crypto-js');

const CONVERSATION_SECRET = 'skram-shared-conversation-key-2025';
const encryptedMessage = 'U2FsdGVkX1/la7/zKkG7VBZftA7GVTjswUgO2B8hLA8=';

console.log('Testing decryption...');
console.log('Encrypted:', encryptedMessage);

try {
  const decrypted = CryptoJS.AES.decrypt(encryptedMessage, CONVERSATION_SECRET);
  const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
  
  console.log('Decrypted:', decryptedText);
  console.log('Success:', !!decryptedText);
} catch (error) {
  console.error('Error:', error);
}