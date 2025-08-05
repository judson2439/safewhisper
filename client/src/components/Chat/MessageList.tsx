import { useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lock, Clock, CheckCheck } from "lucide-react";
import TypingIndicator from "./TypingIndicator";
import { decryptMessage } from "@/lib/encryption";
import { MessageReactions } from "./MessageReactions";
import { AttachmentDisplay } from "./AttachmentDisplay";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  expiresAt: string;
  messageType: string;
  reactions?: MessageReaction[];
  attachments?: Array<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: string;
  }>;
  sender: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImageUrl?: string;
  };
}

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  conversationId?: string;
  participantIds?: string[];
  typingUsers: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }>;
}

export default function MessageList({ messages, currentUserId, conversationId, participantIds, typingUsers }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const scrollToBottom = (immediate = false) => {
    if (immediate) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Also scroll to bottom on initial load - immediate scroll
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom(true); // Immediate scroll on initial load
    }, 50); // Reduced delay for faster initial positioning
    return () => clearTimeout(timer);
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleReactionUpdate = () => {
    // Invalidate messages query to refetch with new reactions
    queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  const getDeleteProgress = (expiresAt: string) => {
    const now = new Date().getTime();
    const created = now - (24 * 60 * 60 * 1000); // 24 hours ago
    const expiry = new Date(expiresAt).getTime();
    const totalDuration = expiry - created;
    const elapsed = now - created;
    
    return Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  };

  // Encryption disabled - display messages as-is
  const decryptMessageContent = (content: string, senderId: string) => {
    return content; // Return content without any processing
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
      {/* System Message */}
      <div className="flex justify-center">
        <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm flex items-center space-x-2">
          <Clock className="w-4 h-4 text-orange-500" />
          <span>Messages auto-delete in 24 hours</span>
        </div>
      </div>

      {messages.map((message) => {
        const isOwnMessage = message.senderId === currentUserId;
        const timeRemaining = getTimeRemaining(message.expiresAt);
        const deleteProgress = getDeleteProgress(message.expiresAt);

        return (
          <div
            key={message.id}
            className={`flex items-start space-x-3 message-fade-in ${
              isOwnMessage ? "justify-end" : ""
            }`}
          >
            {!isOwnMessage && (
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={message.sender.profileImageUrl} />
                <AvatarFallback>
                  {(message.sender.username?.[0] || message.sender.firstName?.[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}

            <div className={`flex-1 max-w-xs lg:max-w-md ${isOwnMessage ? "text-right" : ""}`}>
              <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? "justify-end" : ""}`}>
                {!isOwnMessage && (
                  <span className="text-sm font-medium text-gray-900">
                    {message.sender.username || message.sender.firstName || "Unknown"}
                  </span>
                )}
                <span className="text-xs text-gray-500">
                  {formatTime(message.createdAt)}
                </span>
                <Lock className="w-3 h-3 text-success" />
                {isOwnMessage && (
                  <span className="text-sm font-medium text-gray-900">You</span>
                )}
              </div>

              <div
                className={`rounded-lg p-3 message-content secure-content ${
                  message.messageType === 'secure' ? "" : 
                  isOwnMessage
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-gray-100 dark:bg-gray-800 rounded-tl-none"
                }`}
              >
                {(() => {
                  console.log('MessageList DEBUG - Processing message:', {
                    messageId: message.id,
                    messageType: message.messageType,
                    content: message.content ? 'HAS_CONTENT' : 'NO_CONTENT',
                    isSecure: message.messageType === 'secure'
                  });
                  return null;
                })()}
                {message.content && message.messageType === 'secure' ? (
                  <div className="p-4 rounded-lg border" style={{backgroundColor: '#fefce8', borderColor: '#fde047', color: '#ca8a04'}}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-5 w-5" style={{color: '#ca8a04'}}>🛡️</div>
                        <span className="text-sm font-bold" style={{color: '#ca8a04'}}>
                          CONFIDENTIAL MESSAGE
                        </span>
                      </div>
                      <div className="h-4 w-4" style={{color: '#ca8a04'}}>🔒</div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        Confidential Message requiring authentication to view content.
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-gray-400 to-gray-600 animate-pulse"></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">ENCRYPTED</span>
                      </div>
                      
                      <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-sm py-2 px-4 rounded">
                        🛡️ Authenticate to View Message
                      </button>
                    </div>
                  </div>
                ) : message.content && (
                  <p className={`secure-content ${isOwnMessage ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>
                    {decryptMessageContent(message.content, message.senderId)}
                  </p>
                )}
                
                {/* File attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className={message.content ? "mt-3" : ""}>
                    <AttachmentDisplay 
                      attachments={message.attachments}
                      variant="message"
                    />
                  </div>
                )}
              </div>

              {/* Message reactions */}
              {conversationId && (
                <MessageReactions
                  messageId={message.id}
                  reactions={message.reactions || []}
                  currentUserId={currentUserId}
                  onReactionUpdate={handleReactionUpdate}
                />
              )}

              <div className={`mt-1 flex items-center ${isOwnMessage ? "justify-between" : "justify-between"}`}>
                {isOwnMessage && (
                  <span className="text-xs text-gray-400 mr-2">{timeRemaining}</span>
                )}
                
                <div className="flex-1 bg-gray-200 rounded-full h-1">
                  <div
                    className="bg-warning h-1 rounded-full transition-all duration-1000"
                    style={{ width: `${100 - deleteProgress}%` }}
                    title={`Auto-delete in ${timeRemaining}`}
                  />
                </div>

                {!isOwnMessage && (
                  <span className="text-xs text-gray-400 ml-2">{timeRemaining}</span>
                )}

                {isOwnMessage && (
                  <div className="flex items-center space-x-1 ml-2">
                    <CheckCheck className="w-3 h-3 text-success" />
                  </div>
                )}
              </div>
            </div>

            {isOwnMessage && (
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-primary text-white">
                  Y
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        );
      })}

      {/* Typing Indicators */}
      {typingUsers.map((user) => (
        <TypingIndicator key={user.id} user={user} />
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
