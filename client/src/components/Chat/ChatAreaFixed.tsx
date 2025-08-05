import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Menu, Video, Phone, Users, Lock, Clock, Settings, Edit, UserPlus, Crown, Search } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
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
import ConversationMembers from "./ConversationMembers";
import { SecureChatWebSocket } from "@/lib/websocket";
import { createPermissionChecker } from "@/lib/permissions";

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

export default function ChatAreaFixed({
  conversation,
  messages,
  onToggleSidebar,
  currentUserId,
  websocket,
}: ChatAreaProps) {
  const { user } = useAuth();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditName, setShowEditName] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Array<{
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
  }>>([]);

  // Get user's workforce membership to determine permissions
  const { data: userWorkforceMembership } = useQuery({
    queryKey: ['/api/user/workforce-membership'],
    enabled: !!user,
  });

  // Memoize permission checker with real user data
  const permissions = useMemo(() => {
    if (!user) return null;
    
    const systemRole = (user as any)?.role || 'member';
    const workforceRole = (userWorkforceMembership as any)?.role || 'user';
    const isWorkforceMember = !!userWorkforceMembership;
    
    return createPermissionChecker(systemRole, workforceRole, isWorkforceMember);
  }, [user?.role, userWorkforceMembership]);

  // Check if user can perform moderator actions
  const canEditChatName = permissions?.canChangeChatNames() || false;
  const canAddMembers = permissions?.canAddMembersToChats() || false;

  // Memoize display name to prevent recalculation
  const conversationDisplayName = useMemo(() => {
    if (!conversation) return "";
    
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
  }, [conversation?.name, conversation?.isGroup, conversation?.members, currentUserId]);

  // Stable callbacks to prevent useEffect reruns
  const handleSendMessage = useCallback((content: string) => {
    if (!websocket || !conversation) return;
    
    const messageData = {
      conversationId: conversation.id,
      content,
      messageType: 'text',
    };
    
    websocket.send({
      type: 'send_message',
      ...messageData
    });
  }, [websocket, conversation?.id]);

  const handleTyping = useCallback(() => {
    if (!websocket || !conversation) return;
    
    websocket.send({
      type: 'user_typing',
      conversationId: conversation.id,
      userId: currentUserId
    });
  }, [websocket, conversation?.id, currentUserId]);

  // Stable dialog handlers
  const openAddMember = useCallback(() => setShowAddMember(true), []);
  const closeAddMember = useCallback(() => setShowAddMember(false), []);
  const openEditName = useCallback(() => setShowEditName(true), []);
  const closeEditName = useCallback(() => setShowEditName(false), []);

  // WebSocket setup with stable dependencies
  useEffect(() => {
    if (!websocket || !conversation?.id) return;

    const handleTypingMessage = (data: any) => {
      if (data.conversationId === conversation.id) {
        setTypingUsers(data.typingUsers || []);
      }
    };

    websocket.onMessage('user_typing', handleTypingMessage);

    return () => {
      // Cleanup if needed
    };
  }, [websocket, conversation?.id]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Select a conversation</p>
          <p className="text-sm mb-6">Choose a conversation to start messaging</p>
          
          {/* Only show admin dashboard for master/admin users */}
          {(user?.role === 'master' || user?.role === 'admin') && (
            <div className="mt-8 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg shadow-xl max-w-md mx-auto">
              <Crown className="w-16 h-16 text-yellow-600 dark:text-yellow-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                🌟 Master User Dashboard 🌟
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Your Role:</strong> {user?.role || 'loading...'}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Create and manage company workforces with email integration
              </p>
              <Link href="/workforce">
                <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3 shadow-lg">
                  <Crown className="w-5 h-5 mr-2" />
                  👥 Workforce Management
                </Button>
              </Link>
            </div>
          )}
          
          {/* Show moderator dashboard for moderator users */}
          {user?.role === 'moderator' && (
            <div className="mt-8 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg shadow-xl max-w-md mx-auto">
              <Settings className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                🛡️ Moderator Dashboard
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Your Role:</strong> {user?.role || 'loading...'}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                Manage conversations, moderate content, and assist team members with secure communication.
              </p>
            </div>
          )}
          
          {/* Show regular member welcome message */}
          {user?.role === 'member' && (
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg shadow-xl max-w-md mx-auto">
              <Users className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                Welcome to SecureChat
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                <strong>Your Role:</strong> {user?.role || 'loading...'}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Start secure conversations with your team members. Create a new group or message someone directly.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header - Matching ModeratorDemo style */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden"
            onClick={onToggleSidebar}
          >
            <Menu className="w-4 h-4 text-gray-600" />
          </Button>
          
          <div className="flex items-center space-x-2">
            {!conversation.isGroup && (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            )}
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              {conversationDisplayName}
            </h2>
            {conversation && (
              <ConversationMembers 
                conversationId={conversation.id}
                memberCount={conversation.members?.length}
                isGroup={conversation.isGroup}
              />
            )}
            {conversation.isGroup && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-7 h-7 p-0 text-gray-500 hover:text-gray-700"
                onClick={openAddMember}
                title="Add workforce member to conversation"
              >
                <UserPlus className="h-3 w-3" />
              </Button>
            )}
          </div>
          {conversation && !conversation.isGroup && (
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <span className="text-xs text-gray-500 dark:text-slate-400">This conversation is just between you two</span>
            </div>
          )}
          {conversation && conversation.isGroup && (
            <div className="flex items-center space-x-2">
              <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
              <span className="text-xs text-blue-500 dark:text-blue-400">Group conversation • Click + to add workforce members</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-gray-500 hover:text-gray-700">
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <MessageList 
        messages={messages}
        currentUserId={currentUserId}
        typingUsers={typingUsers}
      />

      {/* Message Input */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        onTyping={handleTyping}
      />

      {/* Dialogs */}
      <AddMemberDialog
        conversationId={conversation.id}
        isOpen={showAddMember}
        onClose={closeAddMember}
      />
      <EditNameDialog
        conversationId={conversation.id}
        currentName={conversationDisplayName}
        isOpen={showEditName}
        onClose={closeEditName}
      />
    </div>
  );
}