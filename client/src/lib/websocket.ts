import { encryptMessage } from './encryption';

export interface WebSocketMessage {
  type: 'authenticate' | 'join_conversation' | 'send_message' | 'typing' | 'new_message' | 'user_typing' | 'authenticated' | 'authentication_failed' | 'error';
  [key: string]: any;
}

export class SecureChatWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageHandlers: Map<string, (message: any) => void> = new Map();
  private isAuthenticated = false;

  constructor(private userId: string) {
    console.log('SecureChatWebSocket constructor called for user:', userId);
    this.connect();
  }

  private connect() {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.authenticate();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.attemptReconnect();
    }
  }

  private authenticate() {
    if (!this.isAuthenticated) {
      console.log('WebSocket authenticating with userId:', this.userId);
      this.send({
        type: 'authenticate',
        userId: this.userId,
      });
    }
  }

  public getAuthenticatedStatus() {
    return this.isAuthenticated;
  }

  public getConnectionState() {
    return {
      readyState: this.ws?.readyState,
      isAuthenticated: this.isAuthenticated,
      wsReadyStateText: this.ws?.readyState === WebSocket.CONNECTING ? 'CONNECTING' : 
                       this.ws?.readyState === WebSocket.OPEN ? 'OPEN' :
                       this.ws?.readyState === WebSocket.CLOSING ? 'CLOSING' :
                       this.ws?.readyState === WebSocket.CLOSED ? 'CLOSED' : 'UNKNOWN'
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Handle authentication success
    if (message.type === 'authenticated') {
      console.log('WebSocket authentication confirmed by server');
      this.isAuthenticated = true;
    } else if (message.type === 'authentication_failed') {
      console.log('WebSocket authentication failed');
      this.isAuthenticated = false;
    }

    // Debug: Log all incoming WebSocket messages
    console.log('WebSocket message received:', message.type, message);
    
    // Skip WebSocket decryption - let MessageList handle it with proper participant data
    // This ensures all members can decrypt using the same conversation key
    if (message.type === 'new_message' && message.message?.content) {
      console.log('NEW MESSAGE RECEIVED:', {
        content: message.message.content,
        isEncrypted: message.message.content.startsWith('U2FsdGVkX1'),
        hasParticipantIds: !!message.message.participantIds,
        participantIds: message.message.participantIds
      });
    }

    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message);
    }
  }

  public send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Encryption disabled - send messages as plain text
      if (message.type === 'send_message' && message.content) {
        console.log('Sending message (no encryption):', message.content);
      }
      
      console.log('WebSocket sending message:', JSON.stringify(message));
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. State:', this.ws?.readyState);
    }
  }

  public onMessage(type: string, handler: (message: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  public joinConversation(conversationId: string) {
    this.send({
      type: 'join_conversation',
      conversationId,
    });
  }

  public sendMessage(conversationId: string, content: string, attachments?: any[], messageType = 'text', participantIds?: string[]) {
    console.log('WebSocket sendMessage called:', {
      conversationId,
      content,
      attachments,
      isAuthenticated: this.isAuthenticated,
      wsReadyState: this.ws?.readyState,
      wsUserId: this.userId,
      messageType,
      participantIds,
      wsReady: this.ws?.readyState === WebSocket.OPEN
    });
    
    this.send({
      type: 'send_message',
      conversationId,
      content,
      messageType,
      participantIds,
      attachments: attachments || [],
    });
  }

  public sendTyping(conversationId: string, isTyping: boolean) {
    this.send({
      type: 'typing',
      conversationId,
      isTyping,
    });
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
