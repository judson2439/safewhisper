import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Send, Shield, Lock, Users, Plus, UserPlus, Edit, UserX, MessageCircle, AlertTriangle, Clock, Star, Zap, ArrowLeft, Settings, Search, Filter, MoreVertical } from "lucide-react";
import { SecureChatWebSocket } from "@/lib/websocket";
import { apiRequest } from "@/lib/queryClient";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
  isSystemMessage?: boolean;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  highlightReason?: string;
}

interface ModeratorDemoProps {
  onReturnToDashboard?: () => void;
  isMasterAdmin?: boolean;
}

// Priority analysis functions
function analyzePriority(content: string): 'urgent' | 'high' | 'normal' | 'low' {
  const lowerContent = content.toLowerCase();
  const urgentKeywords = ['urgent', 'emergency', 'critical', 'asap', 'immediately', 'crisis'];
  const highKeywords = ['important', 'deadline', 'priority', 'required', 'meeting', 'please', '?'];
  const lowKeywords = ['fyi', 'info', 'update', 'btw', 'just so you know'];
  
  // Check for all caps (urgent)
  if (content === content.toUpperCase() && content.length > 5) {
    return 'urgent';
  }
  
  // Check for multiple exclamation marks
  if ((content.match(/!/g) || []).length >= 2) {
    return 'urgent';
  }
  
  // Check for urgent keywords
  if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'urgent';
  }
  
  // Check for high priority keywords
  if (highKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'high';
  }
  
  // Check for low priority keywords
  if (lowKeywords.some(keyword => lowerContent.includes(keyword))) {
    return 'low';
  }
  
  return 'normal';
}

function getPriorityReason(content: string): string {
  const priority = analyzePriority(content);
  const lowerContent = content.toLowerCase();
  
  switch (priority) {
    case 'urgent':
      if (content === content.toUpperCase() && content.length > 5) {
        return 'ALL CAPS message indicates urgency';
      }
      if ((content.match(/!/g) || []).length >= 2) {
        return 'Multiple exclamation marks suggest urgency';
      }
      return 'Contains urgent keywords';
    case 'high':
      if (lowerContent.includes('?')) {
        return 'Contains question requiring response';
      }
      return 'Contains priority keywords';
    case 'low':
      return 'Informational message';
    default:
      return 'Standard message';
  }
}

export default function ModeratorDemoFixed({ onReturnToDashboard, isMasterAdmin = false }: ModeratorDemoProps = {}) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'normal' | 'low'>('all');
  const websocketRef = useRef<SecureChatWebSocket | null>(null);
  const initializationDone = useRef(false);

  // Dialog states
  const [showStartPrivateDialog, setShowStartPrivateDialog] = useState(false);
  const [selectedPrivateMember, setSelectedPrivateMember] = useState("");
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showEditChatDialog, setShowEditChatDialog] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState("");
  const [newChatName, setNewChatName] = useState("");

  // Initialize WebSocket once
  useEffect(() => {
    if (user?.id && !websocketRef.current && !initializationDone.current) {
      initializationDone.current = true;
      websocketRef.current = new SecureChatWebSocket(user.id);
      websocketRef.current.onMessage('new_message', () => {
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      });
    }
    
    return () => {
      if (websocketRef.current) {
        websocketRef.current.disconnect();
        websocketRef.current = null;
        initializationDone.current = false;
      }
    };
  }, [user?.id, queryClient]);

  // Fetch real conversations from database
  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  // Fetch workspace members for management
  const { data: workforceMembers = [] } = useQuery<any[]>({
    queryKey: ['/api/demo/workforce-members'],
    enabled: !!user,
  });

  // Fetch user's workforce membership for permission checking
  const { data: userWorkforceMembership } = useQuery<any>({
    queryKey: ['/api/user/workforce-membership'],
    enabled: !!user,
  });

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations.length, activeConversationId]);

  // Join conversation when selected and mark as read
  useEffect(() => {
    if (activeConversationId && websocketRef.current) {
      websocketRef.current.joinConversation(activeConversationId);
      
      // Mark conversation as read when switching to it
      const markAsRead = async () => {
        try {
          console.log('MODERATOR - Marking conversation as read:', activeConversationId);
          const response = await fetch(`/api/conversations/${activeConversationId}/mark-read`, {
            method: 'POST',
            credentials: 'include',
          });
          console.log('MODERATOR - Mark as read response status:', response.status);
          // Refresh conversations to update unread counts with a delay to ensure DB update completes
          setTimeout(() => {
            console.log('MODERATOR - Invalidating conversations cache');
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          }, 500);
        } catch (error) {
          console.error('MODERATOR - Failed to mark conversation as read:', error);
        }
      };
      
      markAsRead();
    }
  }, [activeConversationId, queryClient]);

  // Fetch messages for active conversation
  const { data: conversationMessages = [] } = useQuery<any[]>({
    queryKey: ['/api/conversations', activeConversationId, 'messages'],
    enabled: !!activeConversationId,
  });

  // Convert real messages to the format expected by the component
  const messages = useMemo(() => {
    return conversationMessages.map((msg) => ({
      id: msg.id,
      sender: msg.sender?.username || msg.sender?.firstName || msg.sender?.email?.split('@')[0] || 'Unknown User',
      content: msg.content,
      timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: msg.senderId === user?.id,
      isSystemMessage: msg.senderId === '45717668', // Admin user ID
      priority: analyzePriority(msg.content) as any,
      highlightReason: getPriorityReason(msg.content)
    }));
  }, [conversationMessages, user?.id]);

  // User data
  const currentUser = {
    id: user?.id || "45717668",
    username: user?.username || user?.email?.split('@')[0] || "user",
    email: user?.email || "",
    role: isMasterAdmin ? "master" : "moderator"
  };

  // Separate conversations into groups and direct messages
  const groupConversations = conversations.filter(conv => conv.isGroup);
  const directConversations = conversations.filter(conv => !conv.isGroup);

  // Function to get display name for direct conversations
  const getDirectConversationDisplayName = (conversation: any) => {
    if (conversation.isGroup) {
      return conversation.name;
    }
    
    // The current user could be represented by username, email, or user ID
    const currentIdentifiers = [
      user?.username,
      user?.email,
      user?.id
    ].filter(Boolean);
    
    // Handle new format: "Direct: user1 & user2"
    if (conversation.name.startsWith('Direct: ')) {
      const usernames = conversation.name.replace('Direct: ', '').split(' & ');
      const otherUser = usernames.find((name: string) => !currentIdentifiers.includes(name));
      return otherUser || usernames[0] || "Unknown User";
    }
    
    // Handle old format: "user1, user2" or "user1, Private Chat"
    if (conversation.name.includes(', ')) {
      const parts = conversation.name.split(', ');
      
      // Remove "Private Chat" if present
      const userParts = parts.filter(part => part !== 'Private Chat');
      
      // Find the part that's not the current user
      const otherUser = userParts.find((part) => !currentIdentifiers.includes(part));
      return otherUser || userParts[0] || "Unknown User";
    }
    
    // If it's just a single name and it's the current user, return "Me"
    if (currentIdentifiers.includes(conversation.name)) {
      return "Me";
    }
    
    return conversation.name;
  };

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (data: { name: string; isGroup: boolean; memberIds: string[] }) => {
      return await apiRequest('POST', '/api/conversations', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: "Success",
        description: "Conversation created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  // Send message function
  const handleSendMessage = () => {
    if (!messageInput.trim() || !websocketRef.current || !activeConversationId) return;

    websocketRef.current.send({
      type: 'send_message',
      conversationId: activeConversationId,
      content: messageInput,
      messageType: 'text',
    });

    setMessageInput("");
  };

  // Filter messages by priority
  const filteredMessages = messages.filter(message => 
    priorityFilter === 'all' || message.priority === priorityFilter
  );

  // Get priority icon and color
  const getPriorityDisplay = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { icon: Zap, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950', border: 'border-l-red-500' };
      case 'high':
        return { icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-l-orange-500' };
      case 'low':
        return { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-950', border: 'border-l-gray-500' };
      default:
        return { icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-l-blue-500' };
    }
  };

  const activeConversation = conversations.find(conv => conv.id === activeConversationId);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <Toaster />
      
      {/* Sidebar - Slack-inspired design */}
      <div className="w-80 bg-slate-800 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-slate-900 flex items-center px-4 border-b border-slate-700">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg">SecureChat</h1>
              <p className="text-slate-400 text-sm">{isMasterAdmin ? 'Master Admin' : 'Moderator'} Dashboard</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white hover:bg-slate-700"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>

        {/* Priority Filter */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-slate-300 text-sm">Message Priority Filter</Label>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <Filter className="h-3 w-3" />
            </Button>
          </div>
          <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="urgent">🔴 Urgent Only</SelectItem>
              <SelectItem value="high">🟠 High Priority</SelectItem>
              <SelectItem value="normal">🔵 Normal</SelectItem>
              <SelectItem value="low">⚪ Low Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Group Conversations */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-300 font-medium">Group Scrams</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateGroupDialog(true)}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {groupConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`group w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeConversationId === conv.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{conv.name}</span>
                      {conv.unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs bg-slate-600 px-2 py-1 rounded">
                        {conv.members?.length || 0}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white h-5 w-5 p-0"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Conversations */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-300 font-medium">Private Scrams</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStartPrivateDialog(true)}
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {directConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`group w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeConversationId === conv.id
                      ? 'bg-green-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="font-medium">{getDirectConversationDisplayName(conv)}</span>
                      {conv.unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-4 flex items-center justify-center">
                          {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Lock className="h-3 w-3 text-slate-500" />
                      <span className="text-xs text-slate-500">Private</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile at Bottom */}
        <div className="h-14 bg-slate-900 border-t border-slate-700 flex items-center px-4">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${isMasterAdmin ? 'bg-yellow-500' : 'bg-red-500'} rounded flex items-center justify-center`}>
              <span className="text-white text-sm font-medium">{isMasterAdmin ? 'A' : 'M'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentUser.username}</p>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-slate-400 text-xs">{isMasterAdmin ? 'Master Admin' : 'Moderator'}</span>
              </div>
            </div>
            {isMasterAdmin && onReturnToDashboard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReturnToDashboard}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
                title="Return to Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header - Slack style */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {!activeConversation?.isGroup && (
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              )}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {activeConversation?.name || 'Select a conversation'}
              </h2>
            </div>
            {activeConversation && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {activeConversation.isGroup ? 'Group Scram' : 'Private Scram'}
                </Badge>
                {!activeConversation.isGroup && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    End-to-end encrypted
                  </Badge>
                )}
              </div>
            )}
          </div>
          {activeConversation && (
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowEditChatDialog(true)}
                className="text-gray-500 hover:text-gray-700"
                title="Edit Scram Name"
              >
                <Edit className="h-4 w-4" />
              </Button>
              {activeConversation.isGroup && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAddMemberDialog(true)}
                  className="text-gray-500 hover:text-gray-700"
                  title="Add Members"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredMessages.map((message) => {
            const priorityDisplay = getPriorityDisplay(message.priority || 'normal');
            const PriorityIcon = priorityDisplay.icon;

            return (
              <div
                key={message.id}
                className={`${priorityDisplay.bg} ${priorityDisplay.border} border-l-4 p-4 rounded-r-lg`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {message.sender}
                    </span>
                    <span className="text-sm text-gray-500">{message.timestamp}</span>
                    <div className="flex items-center space-x-1">
                      <PriorityIcon className={`h-4 w-4 ${priorityDisplay.color}`} />
                      <Badge variant="outline" className={`text-xs ${priorityDisplay.color}`}>
                        {message.priority?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  {message.isOwn && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
                <p className="text-gray-800 dark:text-gray-200">{message.content}</p>
                {message.highlightReason && (
                  <p className="text-xs text-gray-500 mt-1 italic">{message.highlightReason}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex space-x-3">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Members Panel */}
      <div className="w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Members Header */}
        <div className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Members</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowStartPrivateDialog(true)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Start Private Scram"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {workforceMembers.map((member, index) => (
              <div
                key={`member-${member.userId}-${index}`}
                className="group flex items-center justify-between p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedPrivateMember(member.userId);
                  setShowStartPrivateDialog(true);
                }}
                title={`Start private scram with ${member.username || member.email}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(member.username || member.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.username || member.email}
                    </p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {member.role === 'moderator' ? 'Moderator' : 'Member'}
                      </p>
                      {member.role === 'moderator' && (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          <Shield className="h-2 w-2 mr-1" />
                          MOD
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        {activeConversation?.isGroup && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddMemberDialog(true)}
                className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Add
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <UserX className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group Scram</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Name</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
            <Button 
              onClick={() => {
                if (newGroupName.trim()) {
                  createConversationMutation.mutate({
                    name: newGroupName,
                    isGroup: true,
                    memberIds: [user?.id || '']
                  });
                  setNewGroupName('');
                  setShowCreateGroupDialog(false);
                }
              }}
              disabled={!newGroupName.trim()}
            >
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Chat Name Dialog */}
      <Dialog open={showEditChatDialog} onOpenChange={setShowEditChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Scram Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Scram Name</Label>
              <Input
                value={newChatName}
                onChange={(e) => setNewChatName(e.target.value)}
                placeholder={activeConversation?.name || "Enter new name"}
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => {
                  if (newChatName.trim()) {
                    // Update conversation name logic here
                    toast({
                      title: "Success",
                      description: "Scram name updated successfully",
                    });
                    setNewChatName('');
                    setShowEditChatDialog(false);
                  }
                }}
                disabled={!newChatName.trim()}
              >
                Update Name
              </Button>
              <Button variant="outline" onClick={() => setShowEditChatDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member to Scram</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Member</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member to add" />
                </SelectTrigger>
                <SelectContent>
                  {workforceMembers.map((member, index) => (
                    <SelectItem key={`add-${member.userId}-${index}`} value={member.userId}>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{member.username || member.user?.username || member.user?.firstName || member.user?.email?.split('@')[0] || 'Unknown User'}</span>
                          {member.role === 'moderator' && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                              <Shield className="h-2 w-2 mr-1" />
                              MOD
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => setShowAddMemberDialog(false)}>
                Add Member
              </Button>
              <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Private Scram Dialog */}
      <Dialog open={showStartPrivateDialog} onOpenChange={setShowStartPrivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Private Scram</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select member for private conversation</Label>
              <Select value={selectedPrivateMember} onValueChange={setSelectedPrivateMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member to message privately" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(new Map(workforceMembers.map(member => [member.userId, member])).values())
                    .filter(member => member.userId !== user?.id)
                    .filter(member => {
                      // For Private Skrams, moderators can only chat with:
                      // 1. Any user in their own workforce (same workforceId)  
                      // 2. OTHER moderators from different workforces
                      const isSameWorkforce = member.workforceId === userWorkforceMembership?.workforceId;
                      const isCrossWorkforceModerator = member.role === 'moderator' && member.workforceId !== userWorkforceMembership?.workforceId;
                      return isSameWorkforce || isCrossWorkforceModerator;
                    })
                    .map((member, index) => (
                    <SelectItem key={`private-${member.userId}-${index}`} value={member.userId}>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{member.username || member.user?.username || member.user?.firstName || member.user?.email?.split('@')[0] || 'Unknown User'}</span>
                          {member.role === 'moderator' && (
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                              <Shield className="h-2 w-2 mr-1" />
                              MOD
                            </Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={async () => {
                  if (selectedPrivateMember) {
                    try {
                      // Use the demo direct conversation endpoint for workforce boundary checking
                      const response = await fetch('/api/demo/conversations/direct', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          participantId: selectedPrivateMember,
                          initiatorId: user?.id
                        }),
                      });

                      if (response.ok) {
                        const directConversation = await response.json();
                        setActiveConversationId(directConversation.id);
                        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
                        toast({
                          title: "Private Scram Started",
                          description: "Direct conversation created successfully"
                        });
                      } else {
                        throw new Error('Failed to create conversation');
                      }
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to create private conversation",
                        variant: "destructive"
                      });
                    }
                    setSelectedPrivateMember('');
                    setShowStartPrivateDialog(false);
                  }
                }}
                disabled={!selectedPrivateMember}
              >
                Start Private Scram
              </Button>
              <Button variant="outline" onClick={() => setShowStartPrivateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}