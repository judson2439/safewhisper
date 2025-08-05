import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send, Shield, MessageCircle, AlertTriangle, Clock, Star, Zap, ArrowLeft, Menu, User, Search, Settings, Lock, LogOut, Users, Plus, UserPlus } from "lucide-react";
import ConversationMembers from "@/components/Chat/ConversationMembers";
import { MessageReactions } from "@/components/Chat/MessageReactions";
import { SecureMessage } from "@/components/Chat/SecureMessage";
import { PHIMessageModal, type PHIMessageData } from "@/components/Chat/PHIMessageModal";
import { PHICheckModal } from "@/components/Chat/PHICheckModal";
import MessageInput from "@/components/Chat/MessageInput";
import { SecureChatWebSocket } from "@/lib/websocket";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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
  reactions?: any[]; // Message reactions array
  messageType?: string;
  securityLevel?: string;
  requiresAuthentication?: boolean;
  phiTypes?: string[];
  phiDescription?: string;
}

interface UserDemoProps {
  onReturnToDashboard?: () => void;
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

export default function UserDemo({ onReturnToDashboard }: UserDemoProps = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedChat, setSelectedChat] = useState("team-discussion");
  const [messageInput, setMessageInput] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'normal' | 'low'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const websocketRef = useRef<SecureChatWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializationDone = useRef(false);
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showStartPrivateDialog, setShowStartPrivateDialog] = useState(false);
  const [selectedPrivateMember, setSelectedPrivateMember] = useState("");
  const [showPHICheckModal, setShowPHICheckModal] = useState(false);
  const [showPHIModal, setShowPHIModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);

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
      const userParts = parts.filter((part: string) => part !== 'Private Chat');
      
      // Find the part that's not the current user
      const otherUser = userParts.find((part: string) => !currentIdentifiers.includes(part));
      return otherUser || userParts[0] || "Unknown User";
    }
    
    // If it's just a single name and it's the current user, return "Me"
    if (currentIdentifiers.includes(conversation.name)) {
      return "Me";
    }
    
    return conversation.name;
  };

  // Demo conversations
  const conversations = [
    { id: "team-discussion", name: "Team Discussion", isGroup: true, members: [] },
    { id: "project-updates", name: "Project Updates", isGroup: true, members: [] },
    { id: "general", name: "General Chat", isGroup: true, members: [] },
    { id: "dm-sarah", name: "Sarah Johnson", isGroup: false, members: [] },
    { id: "dm-mike", name: "Mike Chen", isGroup: false, members: [] },
  ];

  // Demo messages with priority analysis
  const initialMessages = useMemo(() => {
    const rawMessages = [
      {
        id: "1",
        sender: "System",
        content: "Welcome to the team discussion! Remember all messages are encrypted and auto-delete after 24 hours.",
        timestamp: "10:30 AM",
        isOwn: false
      },
      {
        id: "2", 
        sender: "John User",
        content: "Thanks! I've reviewed the new project guidelines.",
        timestamp: "10:35 AM",
        isOwn: false
      },
      {
        id: "3",
        sender: "You",
        content: "Sounds good! I'll review them this afternoon.",
        timestamp: "10:37 AM",
        isOwn: true
      },
      {
        id: "4",
        sender: "Sarah",
        content: "URGENT: Server maintenance tonight at 11 PM!",
        timestamp: "10:40 AM", 
        isOwn: false
      },
      {
        id: "5",
        sender: "Mike",
        content: "Important: Please review the security guidelines by Friday.",
        timestamp: "10:45 AM", 
        isOwn: false
      },
      {
        id: "6",
        sender: "Lisa",
        content: "FYI - Office will be closed tomorrow for cleaning.",
        timestamp: "10:50 AM", 
        isOwn: false
      }
    ];

    return rawMessages.map((msg): Message => {
      const priority = analyzePriority(msg.content);
      const highlightReason = getPriorityReason(msg.content);
      
      return {
        ...msg,
        priority,
        highlightReason,
        reactions: [], // Initialize empty reactions array for demo
      };
    });
  }, []);

  // Fetch real conversations from API
  const { data: apiConversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  // Use API conversations if available, otherwise fall back to demo conversations
  const activeConversations = Array.isArray(apiConversations) && apiConversations.length > 0 ? apiConversations : conversations;

  // Fetch messages for the selected conversation from API
  const { data: apiMessages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', selectedChat, 'messages'],
    enabled: !!user && !!selectedChat && Array.isArray(activeConversations) && activeConversations.some((c: any) => c.id === selectedChat),
  });

  const [conversationMessages, setConversationMessages] = useState<{[key: string]: Message[]}>({
    "team-discussion": initialMessages,
    "project-updates": [],
    "general": [],
    "dm-sarah": [],
    "dm-mike": []
  });

  // Transform and analyze messages (similar to Home.tsx and ModeratorDemo.tsx)
  const transformedMessages = useMemo(() => {
    if (Array.isArray(apiMessages) && apiMessages.length > 0) {
      // Transform API messages to match Message interface
      return apiMessages.map((msg: any): Message => {
        const priority = analyzePriority(msg.content);
        const highlightReason = getPriorityReason(msg.content);
        
        return {
          id: msg.id,
          sender: msg.sender?.username || msg.sender?.firstName || msg.sender?.email?.split('@')[0] || 'Unknown User',
          content: msg.content,
          timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isOwn: msg.senderId === user?.id,
          priority,
          highlightReason,
          reactions: msg.reactions || [], // Include reactions data
          messageType: msg.messageType, // Map PHI message type
          securityLevel: msg.securityLevel, // Map security level
          requiresAuthentication: msg.requiresAuthentication, // Map authentication requirement
          phiTypes: msg.phiTypes, // Map PHI types
          phiDescription: msg.phiDescription, // Map PHI description
        };
      });
    } else {
      // Fall back to local demo messages
      return conversationMessages[selectedChat] || [];
    }
  }, [apiMessages, conversationMessages, selectedChat, user?.id]);

  // Get current messages - use transformed API messages if available, otherwise fall back to local state
  const currentMessages = transformedMessages;
  const filteredMessages = Array.isArray(currentMessages) ? currentMessages.filter((message: any) => 
    priorityFilter === 'all' || message.priority === priorityFilter
  ) : [];

  // Initialize WebSocket once
  useEffect(() => {
    if (user?.id && !websocketRef.current && !initializationDone.current) {
      initializationDone.current = true;
      websocketRef.current = new SecureChatWebSocket(user.id);
      websocketRef.current.onMessage('new_message', (data) => {
        // Invalidate conversations to refresh unread counts
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        
        // If the message is for the current conversation, also refresh messages
        if (data.conversationId === activeConversationId) {
          queryClient.invalidateQueries({ 
            queryKey: [`/api/conversations/${activeConversationId}/messages`] 
          });
        }
      });
    }
    
    return () => {
      if (websocketRef.current) {
        websocketRef.current.disconnect();
        websocketRef.current = null;
        initializationDone.current = false;
      }
    };
  }, [user?.id, queryClient, activeConversationId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  // Send message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) {
      return;
    }

    // Make sure we have a valid conversation
    const apiConversation = activeConversations.find((c: any) => c.id === selectedChat);
    
    if (!apiConversation) {
      toast({
        title: "Error",
        description: "Please select a valid conversation first",
        variant: "destructive",
      });
      return;
    }

    // Store message and show PHI check modal first
    setPendingMessage(messageInput.trim());
    setPendingAttachments([]);
    setShowPHICheckModal(true);
  };

  // Handle PHI check modal responses
  const handlePHICheckNo = () => {
    // User says message doesn't contain PHI - send normally
    setShowPHICheckModal(false);
    sendNormalMessage();
  };

  const handlePHICheckYes = () => {
    // User says message contains PHI - show detailed PHI modal
    setShowPHICheckModal(false);
    setShowPHIModal(true);
  };

  const sendNormalMessage = async () => {
    try {
      const apiConversation = activeConversations.find((c: any) => c.id === selectedChat);
      const conversationId = apiConversation?.id || selectedChat;
      
      if (websocketRef.current && apiConversation) {
        const participantIds = apiConversation.members?.map((m: any) => m.userId) || [];
        
        websocketRef.current.sendMessage(
          conversationId,
          pendingMessage,
          pendingAttachments || [],
          'text',
          participantIds
        );

        // Clear pending data
        setPendingMessage("");
        setPendingAttachments([]);
        setMessageInput("");

        // Refresh messages
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handlePHIConfirm = async (phiData: PHIMessageData) => {
    if (!pendingMessage || !selectedChat) return;

    // Get the actual API conversation ID instead of local selectedChat
    const apiConversation = activeConversations.find((c: any) => c.id === selectedChat);
    const conversationId = apiConversation?.id || selectedChat;

    try {
      if (phiData.containsPHI) {
        // Send secure message with PHI data
        const response = await apiRequest('POST', '/api/messages/secure', {
          conversationId: conversationId,
          content: pendingMessage,
          messageType: 'secure',
          phiTypes: phiData.phiTypes,
          description: phiData.description,
        });

        if (response.ok) {
          toast({
            title: "Secure PHI Message Sent",
            description: `Message with ${phiData.phiTypes.length} PHI type(s) has been secured with password protection`,
          });
        }
      } else {
        // Send regular message via WebSocket
        if (websocketRef.current && apiConversation) {
          const participantIds = apiConversation.members?.map((m: any) => m.userId) || [];
          
          websocketRef.current.sendMessage(
            conversationId,
            pendingMessage,
            [], // attachments
            'text', // messageType
            participantIds
          );
        }
      }

      // Clear message input and close modal
      setMessageInput("");
      setPendingMessage("");
      setShowPHIModal(false);

      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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

  const activeConversation = conversations.find(c => c.id === selectedChat);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Toaster />
      
      {/* Left Sidebar - Slack style */}
      <div className="w-64 bg-slate-800 flex flex-col">
        {/* Workspace Header */}
        <div className="h-12 bg-slate-900 flex items-center px-3 border-b border-slate-600">
          <div className="flex items-center space-x-2 flex-1">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-sm">
              SecureChat User
            </span>
          </div>
          <Button variant="ghost" size="sm" className="w-6 h-6 p-0 text-slate-400 hover:text-white">
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Search and Jump to */}
        <div className="px-3 py-2 flex-shrink-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-slate-300 hover:bg-slate-700 hover:text-white text-xs h-7"
          >
            <Search className="w-3 h-3 mr-2" />
            Jump to...
          </Button>
        </div>

        {/* Group Skrams Section */}
        <div className="flex-1 overflow-y-auto px-3">
          <div className="py-2">
            <div className="flex items-center justify-between mb-1 px-2">
              <button className="flex items-center text-slate-300 hover:text-white text-xs font-medium">
                <div className="flex mr-1">
                  <Zap className="w-3 h-3" />
                  <Zap className="w-3 h-3 -ml-1" />
                </div>
                Group Skrams
              </button>
            </div>
            <div className="space-y-0">
              {activeConversations.filter(c => c.isGroup).map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => {
                    setSelectedChat(conversation.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`group w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center ${
                    selectedChat === conversation.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="truncate">{conversation.name}</span>
                </button>
              ))}
            </div>

            {/* Direct Messages Section */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1 px-2">
                <button className="flex items-center text-slate-300 hover:text-white text-xs font-medium">
                  <span className="mr-1">▼</span>
                  <Zap className="w-3 h-3 mr-1" />
                  Private Skrams
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStartPrivateDialog(true)}
                  className="w-4 h-4 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                  title="Start Private Skram"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-0">
                {activeConversations.filter(c => !c.isGroup).map((conversation) => (
                  <button
                    key={conversation.id}
                    onClick={() => {
                      setSelectedChat(conversation.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`group w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center ${
                      selectedChat === conversation.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></div>
                    <span className="truncate">{getDirectConversationDisplayName(conversation)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div className="mt-6 px-2">
              <div className="mb-2">
                <Label className="text-slate-400 text-xs">Priority Filter</Label>
              </div>
              <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                <SelectTrigger className="w-full bg-slate-700 border-slate-600 text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="high">🟡 High Priority</SelectItem>
                  <SelectItem value="normal">⚪ Normal</SelectItem>
                  <SelectItem value="low">🔵 Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* User Profile at Bottom */}
        <div className="h-12 bg-slate-900 border-t border-slate-600 flex items-center px-3">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <span className="text-white text-xs font-medium">
                {(user?.username || user?.email?.split('@')[0] || "U").charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.username || user?.email?.split('@')[0] || "User"}</p>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-slate-400 text-xs">Regular User</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onReturnToDashboard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReturnToDashboard}
                className="w-5 h-5 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
                title="Return to Dashboard"
              >
                <ArrowLeft className="w-3 h-3" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-5 h-5 p-0 text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={() => window.location.href = "/api/logout"}
              title="Sign Out"
            >
              <LogOut className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header - Slack style */}
        <div className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            {onReturnToDashboard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReturnToDashboard}
                className="mr-2 text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-300"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Return to Testing
              </Button>
            )}
            <div className="flex items-center space-x-2">
              {!activeConversations.find(c => c.id === selectedChat)?.isGroup && (
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              )}
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                {activeConversations.find(c => c.id === selectedChat)?.name || 'Select a conversation'}
              </h2>
              {activeConversations.find(c => c.id === selectedChat) && (
                <ConversationMembers 
                  conversationId={selectedChat}
                  memberCount={activeConversations.find(c => c.id === selectedChat)?.members?.length}
                  isGroup={activeConversations.find(c => c.id === selectedChat)?.isGroup || false}
                  currentUserId={user?.id}
                  onPrivateSkramStart={(conversationId) => {
                    setActiveConversationId(conversationId);
                    setSelectedChat(conversationId);
                  }}
                />
              )}
            </div>
            {activeConversations.find(c => c.id === selectedChat) && !activeConversations.find(c => c.id === selectedChat)?.isGroup && (
              <div className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span className="text-xs text-gray-500 dark:text-slate-400">This conversation is just between you two</span>
              </div>
            )}
          </div>
          {activeConversations.find(c => c.id === selectedChat) && (
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-gray-500 hover:text-gray-700">
                <Settings className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-gray-500 hover:text-gray-700">
                <Search className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredMessages.map((message: any) => {
            const priorityDisplay = getPriorityDisplay(message.priority || 'normal');
            const PriorityIcon = priorityDisplay.icon;

            return (
              <div
                key={message.id}
                className="group hover:bg-gray-50 px-3 py-2 rounded"
              >
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-400 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">
                      {message.sender.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {message.sender}
                      </span>
                      <span className="text-xs text-gray-500">{message.timestamp}</span>
                      {message.priority !== 'normal' && (
                        <div className="flex items-center space-x-1">
                          <PriorityIcon className={`h-3 w-3 ${priorityDisplay.color}`} />
                          <span className={`text-xs ${priorityDisplay.color} font-medium`}>
                            {message.priority?.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`${message.priority !== 'normal' ? priorityDisplay.bg + ' p-2 rounded border-l-3 ' + priorityDisplay.border : ''}`}>
                      <SecureMessage
                        messageId={message.id}
                        content={message.content}
                        securityLevel={
                          message.messageType === 'secure' ? 'confidential' : 
                          (message.securityLevel || 'normal')
                        }
                        requiresAuthentication={
                          message.messageType === 'secure' || 
                          message.securityLevel === 'confidential' || 
                          message.requiresAuthentication === true
                        }
                        phiTypes={message.phiTypes || []}
                        phiDescription={message.phiDescription}
                        attachments={[]}
                        senderName={message.sender?.username || 'Unknown User'}
                        timestamp={message.timestamp || new Date().toISOString()}
                        className="text-sm text-gray-900 dark:text-slate-100"
                      />

                    </div>
                    {message.highlightReason && (
                      <div className="text-xs text-gray-500 mt-1 italic">{message.highlightReason}</div>
                    )}
                    
                    {/* Message Reactions */}
                    <MessageReactions
                      messageId={message.id}
                      reactions={message.reactions || []}
                      currentUserId={user?.id || ''}
                      onReactionUpdate={() => {
                        // Refresh messages when reactions are updated
                        console.log('Reaction updated');
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <MessageInput
          onSendMessage={(message: string) => {
            setMessageInput(message);
            handleSendMessage();
          }}
          onTyping={(isTyping) => {
            // Handle typing indicator if needed
          }}
        />
      </div>

      <Toaster />
      
      {/* Start Private Skram Dialog */}
      <Dialog open={showStartPrivateDialog} onOpenChange={setShowStartPrivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Private Skram</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Member</Label>
              <Select value={selectedPrivateMember} onValueChange={setSelectedPrivateMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a member to message privately" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demo-user-1">
                    <div className="flex flex-col">
                      <span className="font-medium">John Doe</span>
                      <span className="text-xs text-gray-500">Member • Demo Workforce</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="demo-user-2">
                    <div className="flex flex-col">
                      <span className="font-medium">Sarah Johnson</span>
                      <span className="text-xs text-gray-500">Member • Demo Workforce</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="demo-moderator-1">
                    <div className="flex flex-col">
                      <span className="font-medium">SMSMODERATOR</span>
                      <span className="text-xs text-gray-500">Moderator • Demo Workforce</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cross-moderator-1">
                    <div className="flex flex-col">
                      <span className="font-medium">testmod2</span>
                      <span className="text-xs text-gray-500">Moderator • Test Company</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={async () => {
                  if (selectedPrivateMember) {
                    try {
                      toast({
                        title: "Private Skram Started",
                        description: "Demo conversation created successfully"
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to create private conversation",
                        variant: "destructive"
                      });
                    }
                    setSelectedPrivateMember("");
                    setShowStartPrivateDialog(false);
                  }
                }} 
                disabled={!selectedPrivateMember}
              >
                Start Private Skram
              </Button>
              <Button variant="outline" onClick={() => setShowStartPrivateDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PHI Message Modal */}
      {/* PHI Check Modal */}
      <PHICheckModal
        isOpen={showPHICheckModal}
        messageContent={pendingMessage}
        onClose={() => {
          setShowPHICheckModal(false);
          setPendingMessage("");
          setPendingAttachments([]);
        }}
        onYes={handlePHICheckYes}
        onNo={handlePHICheckNo}
      />

      <PHIMessageModal
        isOpen={showPHIModal}
        onClose={() => {
          setShowPHIModal(false);
          setPendingMessage("");
        }}
        onConfirm={handlePHIConfirm}
        messageContent={pendingMessage}
      />
    </div>
  );
}