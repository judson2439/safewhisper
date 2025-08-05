import CryptoJS from 'crypto-js';

// Simple shared secret for all conversations (in production, this would be more sophisticated)
const CONVERSATION_SECRET = 'skram-shared-conversation-key-2025';

export function encryptMessage(message: string, conversationId: string, participantIds: string[]): string {
  try {
    console.log('Encrypting message:', message);
    
    // Use a simple shared key that all members can access
    const encrypted = CryptoJS.AES.encrypt(message, CONVERSATION_SECRET).toString();
    console.log('Encryption successful');
    return encrypted;
  } catch (error) {
    console.error('Encryption failed:', error);
    return message; // Return original message if encryption fails
  }
}

export function decryptMessage(encryptedMessage: string, conversationId: string, participantIds: string[]): string {
  try {
    console.log('Decrypting message...');
    
    // Use the same shared key for decryption
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, CONVERSATION_SECRET);
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      console.warn('Decryption produced empty result');
      return encryptedMessage; // Return original if decryption fails
    }
    
    console.log('Decryption successful:', decryptedText);
    return decryptedText;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedMessage; // Return original message if decryption fails
  }
}