import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, Video, Phone, Info, Users, Lock, Clock, Settings, Edit, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { AddMemberDialog } from "./AddMemberDialog";
import { EditNameDialog } from "./EditNameDialog";
import { SecureChatWebSocket } from "@/lib/websocket";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  expiresAt: string;
  messageType: string;
  sender: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  isGroup: boolean;
  members: Array<{
    isAdmin: boolean;
    user: {
      id: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
      profileImageUrl?: string;
    };
  }>;
}

interface ChatAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  onToggleSidebar: () => void;
  currentUserId: string;
  websocket: SecureChatWebSocket | null;
}

export default function ChatArea({
  conversation,
  messages,
  onToggleSidebar,
  currentUserId,
  websocket,
}: ChatAreaProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Array<{
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }>>([]);

  useEffect(() => {
    if (!websocket) return;

    websocket.onMessage('user_typing', (data) => {
      if (data.conversationId === conversation?.id) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.id !== data.user.id);
          if (data.isTyping) {
            return [...filtered, data.user];
          }
          return filtered;
        });

        // Auto-remove typing indicator after 3 seconds
        if (data.isTyping) {
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.id !== data.user.id));
          }, 3000);
        }
      }
    });
  }, [websocket, conversation?.id]);

  const handleSendMessage = (content: string, attachments?: any[]) => {
    if (websocket && conversation) {
      websocket.sendMessage(conversation.id, content, attachments);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (websocket && conversation) {
      websocket.sendTyping(conversation.id, isTyping);
    }
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to SecureChat</h2>
          <p className="text-gray-600 max-w-md">Select a conversation from the sidebar to start messaging securely with end-to-end encryption</p>
        </div>
      </div>
    );
  }

  const isCurrentUserAdmin = conversation?.members.find(
    member => member.user.id === currentUserId
  )?.isAdmin === true;

  const getConversationDisplayName = () => {
    if (conversation.isGroup) {
      return conversation.name;
    }
    
    const otherMember = conversation.members?.find(m => m.user.id !== currentUserId);
    if (otherMember && otherMember.user) {
      return otherMember.user.username || otherMember.user.firstName || otherMember.user.email || "Unknown User";
    }
    
    // Fallback: extract username from "Direct: user1 & user2" format
    if (conversation.name.startsWith('Direct: ')) {
      const usernames = conversation.name.replace('Direct: ', '').split(' & ');
      // Return the username that's not the current user's
      return usernames.find(name => name !== (currentUserId)) || usernames[0] || "Unknown User";
    }
    
    return conversation.name;
  };

  return (
    <div className="flex-1 flex flex-col screenshot-protection secure-content bg-white">
      {/* Chat Header - Mobile responsive */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-6 py-3 md:py-4 flex-shrink-0 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden hover:bg-gray-100 min-h-[44px] min-w-[44px] p-2"
              onClick={onToggleSidebar}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </Button>
            
            <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                {conversation.isGroup ? (
                  <span className="text-white font-bold text-sm">#</span>
                ) : (
                  <span className="text-white font-bold text-sm">
                    {getConversationDisplayName().charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">
                  {conversation.isGroup ? "# " : ""}
                  {getConversationDisplayName()}
                </h2>
                <div className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-green-500" />
                    <span className="hidden sm:inline">Encrypted</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">{conversation.members.length} members</span>
                  <span className="hidden md:inline">•</span>
                  <div className="hidden md:flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>24h auto-delete</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
            {/* Hide video/phone buttons on mobile */}
            <Button 
              variant="ghost" 
              size="sm" 
              title="Video Call"
              className="hidden md:flex min-h-[44px] min-w-[44px] p-2"
            >
              <Video className="w-4 h-4 text-gray-600" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              title="Voice Call"
              className="hidden md:flex min-h-[44px] min-w-[44px] p-2"
            >
              <Phone className="w-4 h-4 text-gray-600" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  title="Conversation Settings" 
                  className="border-gray-300 hover:bg-gray-50 min-h-[44px] min-w-[44px] p-2"
                >
                  <Settings className="w-4 h-4 text-gray-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="secure-content">
                <DropdownMenuItem onClick={() => setShowEditName(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Name
                </DropdownMenuItem>
                {isCurrentUserAdmin && conversation.isGroup && (
                  <DropdownMenuItem onClick={() => setShowAddMember(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <MessageList 
        messages={messages}
        currentUserId={currentUserId}
        conversationId={conversation.id}
        participantIds={conversation.members.map(m => m.user.id)}
        typingUsers={typingUsers}
      />

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
      />

      {/* Dialogs */}
      {conversation && (
        <>
          <AddMemberDialog
            conversationId={conversation.id}
            isOpen={showAddMember}
            onClose={() => setShowAddMember(false)}
          />
          <EditNameDialog
            conversationId={conversation.id}
            currentName={getConversationDisplayName()}
            isOpen={showEditName}
            onClose={() => setShowEditName(false)}
          />
        </>
      )}
    </div>
  );
}
