import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AddMemberDialog } from "@/components/Chat/AddMemberDialog";
import ConversationMembers from "@/components/Chat/ConversationMembers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Send, Shield, Lock, Users, Plus, MessageCircle, AlertTriangle, Clock, Star, Zap, Settings, Search, Filter, MoreVertical, LogOut, Menu, UserPlus, Trash2, Moon, Sun, X, ChevronLeft, ChevronRight } from "lucide-react";
import { SecureChatWebSocket } from "@/lib/websocket";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { createPermissionChecker } from "@/lib/permissions";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { MessageReactions } from "@/components/Chat/MessageReactions";
import { SecureMessage } from "@/components/Chat/SecureMessage";
import { PHIMessageModal, type PHIMessageData } from "@/components/Chat/PHIMessageModal";
import { PHICheckModal } from "@/components/Chat/PHICheckModal";
import MessageInput from "@/components/Chat/MessageInput";

interface Message {
  id: string;
  sender: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
    role?: string;
  };
  senderWorkforce?: {
    workforceId: string;
    workforceName?: string;
    role?: string;
  };
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
  attachments?: any[];
}

interface Conversation {
  id: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  members: Array<{
    isAdmin: boolean;
    user: {
      id: string;
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
  }>;
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

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'normal' | 'low'>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const websocketRef = useRef<SecureChatWebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showStartPrivateDialog, setShowStartPrivateDialog] = useState(false);
  const [selectedPrivateMember, setSelectedPrivateMember] = useState("");
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<string[]>([]);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showPHICheckModal, setShowPHICheckModal] = useState(false);
  const [showPHIModal, setShowPHIModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true';
    }
    return false;
  });
  const [showWorkforceDropdown, setShowWorkforceDropdown] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  
  // Handle dark mode toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  // Initialize WebSocket once
  useEffect(() => {
    console.log('WebSocket effect triggered:', { userId: user?.id, hasWebSocket: !!websocketRef.current, isLoading });
    if (user?.id && !websocketRef.current && !isLoading) {
      console.log('Initializing WebSocket for user:', user.id);
      try {
        websocketRef.current = new SecureChatWebSocket(user.id);
        console.log('WebSocket initialized successfully:', !!websocketRef.current);
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
      }
    }
  }, [user?.id, isLoading]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Setup WebSocket message handlers
  useEffect(() => {
    console.log('WebSocket handlers effect triggered:', !!websocketRef.current);
    if (!websocketRef.current) return;

    websocketRef.current.onMessage('new_message', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversationId, 'messages'] });
    });

    websocketRef.current.onMessage('error', (data: any) => {
      toast({
        title: "Message Error",
        description: data.message || "Failed to send message",
        variant: "destructive",
      });
    });

    // Don't disconnect WebSocket in cleanup - it's managed by the initialization effect
  }, [queryClient, activeConversationId]);

  // Fetch conversations
  const {
    data: conversations = [],
    isLoading: conversationsLoading,
  } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  // Fetch workforce members for Private Skram dialog and adding to groups
  const {
    data: workforceMembers = [],
    isLoading: workforceMembersLoading,
  } = useQuery<any[]>({
    queryKey: ['/api/demo/workforce-members'],
    enabled: !!user,
  });

  // Fetch user's workforce membership
  const {
    data: userWorkforceMembership,
    isLoading: membershipLoading,
  } = useQuery<any>({
    queryKey: ['/api/user/workforce-membership'],
    enabled: !!user,
  });

  // Create permission checker
  const permissionChecker = useMemo(() => {
    if (!user || !userWorkforceMembership || !user.role) return null;
    return createPermissionChecker(
      user.role as any, // system role
      userWorkforceMembership.role, // workforce role
      true // is workforce member
    );
  }, [user, userWorkforceMembership]);



  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      console.log('Auto-selecting first conversation:', conversations[0].id, conversations[0].name);
      console.log('All conversations for this user:', conversations.map(c => ({ id: c.id, name: c.name })));
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations.length, activeConversationId]);

  // Fetch messages for active conversation
  const {
    data: rawMessages = [],
    isLoading: messagesLoading,
  } = useQuery<any[]>({
    queryKey: ['/api/conversations', activeConversationId, 'messages'],
    enabled: !!activeConversationId,
  });

  // Transform and analyze messages
  const messages = useMemo(() => {
    return rawMessages.map((msg): Message => {
      const priority = analyzePriority(msg.content);
      const highlightReason = getPriorityReason(msg.content);
      
      return {
        id: msg.id,
        sender: msg.sender || {
          id: msg.senderId,
          username: 'Unknown',
          firstName: null,
          lastName: null,
          email: null,
          profileImageUrl: null,
          role: 'member' as const
        },
        senderWorkforce: msg.senderWorkforce,
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
        attachments: msg.attachments || [], // Map attachments
      };
    });
  }, [rawMessages, user?.id]);

  // Filter messages by priority
  const filteredMessages = messages.filter(message => 
    priorityFilter === 'all' || message.priority === priorityFilter
  );

  // Handle conversation selection and WebSocket joining
  useEffect(() => {
    if (activeConversationId && websocketRef.current) {
      console.log('Joining conversation:', activeConversationId);
      websocketRef.current.joinConversation(activeConversationId);
      
      // Mark conversation as read when switching to it
      const markAsRead = async () => {
        try {
          console.log('Marking conversation as read:', activeConversationId);
          const response = await apiRequest('POST', `/api/conversations/${activeConversationId}/mark-read`);
          console.log('Mark as read response:', response);
          // Refresh conversations to update unread counts with a delay to ensure DB update completes
          setTimeout(() => {
            console.log('Invalidating conversations cache');
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          }, 500);
        } catch (error) {
          console.error('Failed to mark conversation as read:', error);
        }
      };
      
      markAsRead();
    }
  }, [activeConversationId, queryClient]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredMessages]);

  // Send message
  const handleSendMessage = (content: string, attachments?: any[]) => {
    console.log('handleSendMessage called with:', { content, attachments });
    console.log('Attachments count:', attachments?.length || 0);
    console.log('Attachments details:', attachments);
    
    if ((!content.trim() && !attachments?.length) || !activeConversationId) return;

    // Store message and attachments, then show PHI check modal first
    setPendingMessage(content.trim());
    setPendingAttachments(attachments || []);
    console.log('Stored pendingAttachments:', attachments);
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
    console.log('🔄 Home - User confirmed message contains PHI, opening detailed PHI modal');
    alert('Opening PHI Modal - pendingMessage: ' + pendingMessage);
    setShowPHICheckModal(false);
    setShowPHIModal(true);
  };

  const sendNormalMessage = async () => {
    console.log('sendNormalMessage called with pendingAttachments:', pendingAttachments);
    console.log('pendingAttachments count:', pendingAttachments?.length || 0);
    console.log('pendingAttachments details:', pendingAttachments);
    
    try {
      if (websocketRef.current && activeConversationId) {
        const activeConv = conversations.find(c => c.id === activeConversationId);
        const participantIds = activeConv?.members?.map((m: any) => m.userId) || [];
        
        console.log('About to send WebSocket message with attachments:', pendingAttachments);
        websocketRef.current.sendMessage(
          activeConversationId,
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
        queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversationId, 'messages'] });
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
    if (!pendingMessage || !activeConversationId) return;

    console.log('🔄 Home - PHI confirm received:', JSON.stringify(phiData, null, 2));
    console.log('🔄 Home - Patient names from PHI data:', {
      patientFirstName: phiData.patientFirstName,
      patientLastName: phiData.patientLastName
    });
    
    // CRITICAL: Check if patient names are actually present
    if (!phiData.patientFirstName || !phiData.patientLastName) {
      console.error('🚨 HOME: Patient names missing from PHI data!', phiData);
      alert('ERROR: Patient names missing from PHI data: ' + JSON.stringify(phiData));
    }

    try {
      if (phiData.containsPHI) {
        // Send secure message with PHI data
        const requestData = {
          conversationId: activeConversationId,
          content: pendingMessage,
          messageType: 'secure',
          phiTypes: phiData.phiTypes,
          description: phiData.description,
          patientFirstName: phiData.patientFirstName,
          patientLastName: phiData.patientLastName,
          attachments: pendingAttachments,
        };
        
        console.log('📡 Home - Sending secure message API request:', JSON.stringify(requestData, null, 2));
        console.log('📡 Home - Patient names being sent:', {
          patientFirstName: requestData.patientFirstName,
          patientLastName: requestData.patientLastName
        });
        
        let response;
        try {
          console.log('📡 Home - ABOUT TO SEND API REQUEST with data:', JSON.stringify(requestData, null, 2));
          const apiResponse = await apiRequest('POST', '/api/messages/secure', requestData);
          console.log('📡 Home - Raw API Response:', apiResponse);
          response = await apiResponse.json();
          console.log('📡 Home - Parsed JSON Response:', response);
          
          // CRITICAL: Verify the created message has patient names
          if (response && response.id) {
            console.log('✅ Message created with ID:', response.id);
            console.log('✅ Message patient names:', response.patientFirstName, response.patientLastName);
            if (!response.patientFirstName || !response.patientLastName) {
              console.error('❌ CRITICAL: Message created but patient names missing from response!');
            }
          }
        } catch (apiError: any) {
          console.error('🚨 API REQUEST FAILED:', apiError);
          console.error('🚨 API Error details:', {
            message: apiError.message,
            status: apiError.status,
            response: apiError.response
          });
          alert('API REQUEST FAILED: ' + apiError.message);
          throw apiError; // Re-throw to trigger the outer catch
        }

        if (response) {
          toast({
            title: "Secure Message Sent",
            description: "PHI message has been sent with password protection",
          });
        }
      } else {
        // Send regular message
        if (websocketRef.current) {
          const activeConv = conversations.find(c => c.id === activeConversationId);
          const participantIds = activeConv?.members?.map((m: any) => m.userId) || [];
          
          websocketRef.current.sendMessage(
            activeConversationId,
            pendingMessage,
            pendingAttachments || [], // attachments
            'text', // messageType
            participantIds
          );
        }
      }

      // Clear message input (modal will auto-close)
      setMessageInput("");
      setPendingMessage("");
      setPendingAttachments([]);

      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversationId, 'messages'] });

    } catch (error: any) {
      console.error('Error sending message:', error);
      alert('OUTER CATCH: ' + error.message);
      toast({
        title: "Error", 
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      return; // Don't continue processing if there was an error
    }
  };

  // Handle key press in message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(messageInput);
    }
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
        description: "Group Skram created successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create Group Skram",
        variant: "destructive",
      });
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return await apiRequest('DELETE', `/api/conversations/${conversationId}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setActiveConversationId(null);
      toast({
        title: "Success",
        description: data.message || "Operation completed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process request",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Handle swipe gestures for mobile navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX || !touchStartY) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = touchStartX - currentX;
    const diffY = touchStartY - currentY;

    // Only trigger horizontal swipes (ignore vertical scrolling)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0 && isSidebarOpen) {
        // Swipe left to close sidebar
        setIsSidebarOpen(false);
      } else if (diffX < 0 && !isSidebarOpen && touchStartX < 50) {
        // Swipe right from left edge to open sidebar
        setIsSidebarOpen(true);
      }
      setTouchStartX(0);
      setTouchStartY(0);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartX(0);
    setTouchStartY(0);
  };

  return (
    <div 
      className="h-screen flex bg-gray-50 dark:bg-gray-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden touch-friendly transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsSidebarOpen(false);
          }}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-50 lg:z-auto ${isSidebarMinimized ? 'w-16' : 'w-72 sm:w-80 lg:w-64 xl:w-72'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full lg:h-auto transition-all duration-200 ease-out lg:transition-all shadow-xl lg:shadow-none`}>
        {/* Header */}
        <div className="relative p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {isSidebarMinimized ? (
              /* Minimized Header with Expand Button */
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 min-h-[44px] min-w-[44px] hover:bg-gray-100 dark:hover:bg-gray-700 touch-friendly bg-blue-50 dark:bg-blue-900/30"
                  onClick={() => setIsSidebarMinimized(false)}
                  title="Expand sidebar"
                >
                  <ChevronRight className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </Button>
              </div>
            ) : (
              /* Full Header with Minimize Button */
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">SKRAM</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Secure Messaging</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Minimize Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 min-h-[44px] min-w-[44px] hover:bg-gray-100 dark:hover:bg-gray-700 touch-friendly"
                    onClick={() => setIsSidebarMinimized(true)}
                    title="Minimize sidebar"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  {/* Close button for mobile */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden p-2 min-h-[48px] min-w-[48px] hover:bg-gray-100 dark:hover:bg-gray-700 touch-friendly"
                    onClick={() => setIsSidebarOpen(false)}
                    title="Close menu"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          {isSidebarMinimized ? (
            /* Minimized User Info */
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  {user.username?.charAt(0).toUpperCase() || user.firstName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 min-h-[32px] min-w-[32px]"
                  title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDarkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 min-h-[32px] min-w-[32px]"
                  title="Logout"
                >
                  <LogOut className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            /* Full User Info */
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-8 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.username?.charAt(0).toUpperCase() || user.firstName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.username || user.firstName || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Regular User</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700 min-h-[40px] min-w-[40px]"
                  title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900/20 min-h-[40px] min-w-[40px]"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Priority Filter */}
        {!isSidebarMinimized && (
          <div className="px-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="mb-2">
              <Label className="text-gray-500 dark:text-gray-400 text-xs">Priority Filter</Label>
            </div>
            <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
              <SelectTrigger className="w-full text-xs h-7">
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
        )}

        {/* Mobile Navigation Hint */}
        <div className="lg:hidden px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 text-center">
            Swipe left to close • Tap conversation to open • Swipe right from edge to open
          </p>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-2 mobile-scroll">
          <div className="py-2">
            {!isSidebarMinimized ? (
              /* Full Conversation List */
              <>
                {/* Group Skrams Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                      <div className="flex mr-1">
                        <Zap className="w-3 h-3" />
                        <Zap className="w-3 h-3 -ml-1" />
                      </div>
                      Group Skrams
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateGroupDialog(true)}
                      className="min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      title="Create new Group Skram"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
              <div className="space-y-0.5">
                {conversations.filter(c => c.isGroup).map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group w-full text-left px-3 py-3 sm:py-2 rounded transition-colors flex items-center min-h-[50px] sm:min-h-[44px] touch-friendly ${
                      activeConversationId === conversation.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveConversationId(conversation.id);
                        setIsSidebarOpen(false);
                      }}
                      className="flex-1 text-left flex items-center touch-friendly"
                    >
                      <span className="text-sm sm:text-xs font-medium truncate flex-1">{conversation.name}</span>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-blue-600 text-white text-xs px-1 py-0 min-w-[16px] h-3 flex items-center justify-center">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </Badge>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Private Skrams Section */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1 px-2">
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  Private Skrams
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStartPrivateDialog(true)}
                  className="min-w-[44px] min-h-[44px] p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  title="Start Private Skram"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-0.5">
                {conversations.filter(c => !c.isGroup).map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`group w-full text-left px-3 py-3 sm:py-2 rounded text-sm transition-colors flex items-center min-h-[50px] sm:min-h-[44px] touch-friendly ${
                      activeConversationId === conversation.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600'
                    }`}
                  >
                    <button
                      onClick={() => {
                        setActiveConversationId(conversation.id);
                        setIsSidebarOpen(false);
                      }}
                      className="flex-1 text-left flex items-center touch-friendly"
                    >
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2 flex-shrink-0"></div>
                      <span className="text-sm sm:text-xs truncate flex-1">{conversation.name}</span>
                      {conversation.unreadCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-blue-600 text-white text-xs px-1 py-0 min-w-[16px] h-3 flex items-center justify-center">
                          {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                        </Badge>
                      )}
                    </button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const actionText = conversation.isGroup ? "leave" : "delete";
                        const conversationType = conversation.isGroup ? "Group Skram" : "Private Skram";
                        if (window.confirm(`Are you sure you want to ${actionText} "${conversation.name}"? ${conversation.isGroup ? "You will no longer see messages from this group." : "This will permanently delete the conversation."}`)) {
                          deleteConversationMutation.mutate(conversation.id);
                        }
                      }}
                      className="w-3 h-3 p-0 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                      title={conversation.isGroup ? "Leave Group Skram" : "Delete Private Skram"}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                ))}
                  </div>
                </div>
              </>
            ) : (
              /* Mobile-Optimized Minimized Conversation List */
              <div className="flex flex-col gap-2 px-1">
                {/* Show only first 3 group conversations as mobile-friendly icons */}
                {conversations.filter(c => c.isGroup).slice(0, 3).map((conversation) => (
                  <Button
                    key={conversation.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveConversationId(conversation.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full p-3 min-h-[48px] relative touch-friendly ${
                      activeConversationId === conversation.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                    }`}
                    title={conversation.name}
                  >
                    <Users className="w-5 h-5" />
                    {conversation.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-medium">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </span>
                    )}
                  </Button>
                ))}
                {/* Show first 3 private conversations as mobile-friendly icons */}
                {conversations.filter(c => !c.isGroup).slice(0, 3).map((conversation) => (
                  <Button
                    key={conversation.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveConversationId(conversation.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full p-3 min-h-[48px] relative touch-friendly ${
                      activeConversationId === conversation.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600'
                    }`}
                    title={conversation.name}
                  >
                    <MessageCircle className="w-5 h-5" />
                    {conversation.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-medium">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </span>
                    )}
                  </Button>
                ))}
                {/* Mobile-friendly expand button if there are more conversations */}
                {conversations.length > 6 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSidebarMinimized(false)}
                    className="w-full p-3 min-h-[48px] text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 active:bg-gray-200 dark:active:bg-gray-600 touch-friendly"
                    title="Show all conversations"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden p-2 min-h-[48px] min-w-[48px] flex-shrink-0 touch-friendly hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors rounded-lg"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title={isSidebarOpen ? "Close menu" : "Open menu"}
              >
                <Menu className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </Button>
              {activeConversation && (
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  {!activeConversation?.isGroup && (
                    <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  )}
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                    {activeConversation.name}
                  </h2>
                  <div className="hidden sm:block">
                    <ConversationMembers
                      conversationId={activeConversation.id}
                      memberCount={activeConversation.members.length}
                      isGroup={activeConversation.isGroup}
                      currentUserId={user?.id}
                      onPrivateSkramStart={(conversationId) => {
                        setActiveConversationId(conversationId);
                      }}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    />
                  </div>
                  {activeConversation?.isGroup && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="min-h-[44px] min-w-[44px] p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex-shrink-0"
                      onClick={() => {
                        setShowAddMemberDialog(true);
                      }}
                      title="Add member"
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Priority Filter and Members Icon */}
            <div className="flex items-center gap-2">
              {priorityFilter !== 'all' && (
                <Badge variant="secondary" className="text-xs px-2 py-0">
                  {priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1)}
                </Badge>
              )}
              
              {/* Workforce Members Icon */}
              <div className="relative" data-workforce-dropdown>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-11 h-11 p-0 text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowWorkforceDropdown(!showWorkforceDropdown)}
                  title={`My Workforce (${workforceMembers.filter(m => m.userId !== user?.id).length} members)`}
                >
                  <Users className="h-5 w-5" />
                  {workforceMembers.filter(m => m.userId !== user?.id).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {workforceMembers.filter(m => m.userId !== user?.id).length}
                    </span>
                  )}
                </Button>
                
                {showWorkforceDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-80 sm:w-80 w-screen max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                          My Workforce
                        </h3>
                      </div>
                      
                      {/* Workforce Members */}
                      <div className="space-y-2">
                        {workforceMembers
                          .filter(member => member.userId !== user?.id)
                          .map((member, index) => (
                          <div
                            key={`workforce-${member.userId}-${index}`}
                            className="group flex items-center justify-between p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                                  {member.user?.username || member.user?.firstName || 'Unknown User'}
                                </p>
                                <div className="flex items-center gap-2">
                                  {member.role === 'moderator' && (
                                    <span className="text-xs text-purple-600 dark:text-purple-400">Moderator</span>
                                  )}
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {member.workforceName || 'Unknown Workforce'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Start private conversation
                                  setSelectedPrivateMember(member.userId);
                                  setShowStartPrivateDialog(true);
                                  setShowWorkforceDropdown(false);
                                }}
                                className="w-8 h-8 p-0 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                title="Start Private Skram"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4">
          {messagesLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 space-y-4">
              {priorityFilter !== 'all' && (
                <div className="text-center">
                  No messages with this priority
                </div>
              )}
              {activeConversation?.isGroup && priorityFilter === 'all' && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-w-md mx-auto">
                  <UserPlus className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4 text-center">
                    Start Your Group Skram
                  </h3>
                  <Button
                    onClick={() => setShowAddMemberDialog(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Workforce Members
                  </Button>
                </div>
              )}
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex flex-col max-w-[85%] sm:max-w-sm lg:max-w-md xl:max-w-lg">
                  <div
                    className={`${message.messageType === 'secure' ? '' : 'px-4 py-2 rounded-lg'} ${
                      message.messageType === 'secure' 
                        ? '' // No background for PHI messages - SecureMessage handles styling
                        : message.isOwn
                        ? 'bg-blue-600 text-white'
                        : message.priority === 'urgent'
                        ? 'bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-gray-900 dark:text-white'
                        : message.priority === 'high'
                        ? 'bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 text-gray-900 dark:text-white'
                      : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white'
                  }`}
                >
                  {!message.isOwn && (
                    <div className="text-xs font-medium mb-1 opacity-75">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-900 dark:text-white">
                          {message.sender.username || message.sender.firstName || 'Unknown'}
                        </span>
                        {message.senderWorkforce && (
                          <span className="text-blue-600 dark:text-blue-400 text-xs">
                            · {message.senderWorkforce.workforceName || message.senderWorkforce.workforceId}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {message.messageType === 'secure' ? (
                    <SecureMessage
                      messageId={message.id}
                      content={message.content}
                      securityLevel={message.securityLevel || "confidential"}
                      requiresAuthentication={true}
                      phiTypes={message.phiTypes || []}
                      phiDescription={message.phiDescription}
                      attachments={[]}
                      senderName={message.sender?.username || 'Unknown User'}
                      timestamp={message.timestamp || new Date().toISOString()}
                      className="text-sm"
                    />
                  ) : (
                    <span className="text-sm break-words px-4 py-2">{message.content}</span>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs opacity-75">{message.timestamp}</div>
                    {message.priority !== 'normal' && !message.isOwn && (
                      <div className="flex items-center gap-1">
                        {message.priority === 'urgent' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                        {message.priority === 'high' && <Star className="w-3 h-3 text-yellow-500" />}
                        {message.priority === 'low' && <Clock className="w-3 h-3 text-blue-500" />}
                      </div>
                    )}
                  </div>
                  {message.priority !== 'normal' && !message.isOwn && (
                    <div className="text-xs mt-1 opacity-60 italic">
                      {message.highlightReason}
                    </div>
                  )}
                </div>
                
                {/* Message Reactions */}
                {activeConversationId && (
                  <MessageReactions
                    messageId={message.id}
                    reactions={message.reactions || []}
                    currentUserId={user?.id || ''}
                    onReactionUpdate={() => {
                      // Invalidate messages cache to refresh reactions
                      queryClient.invalidateQueries({ queryKey: ['/api/conversations', activeConversationId, 'messages'] });
                    }}
                  />
                )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={(isTyping) => {
            // Handle typing indicator if needed
            console.log('Typing:', isTyping);
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
                  {(() => {
                    const filteredWorkforceMembers = Array.from(new Map(workforceMembers.map(member => [member.userId, member])).values())
                      .filter(member => member.userId !== user?.id)
                      .filter(member => {
                        // For Private Skrams, regular users can chat with:
                        // 1. Any user in their own workforce (same workforceId)
                        // 2. Moderators from different workforces
                        const isSameWorkforce = member.workforceId === userWorkforceMembership?.workforceId;
                        const isCrossWorkforceModerator = member.role === 'moderator' && member.workforceId !== userWorkforceMembership?.workforceId;
                        const canChat = isSameWorkforce || isCrossWorkforceModerator;
                        
                        console.log('DEBUG - Member filtering:', {
                          userUsername: member.user?.username,
                          userId: member.userId,
                          memberWorkforceId: member.workforceId,
                          userWorkforceId: userWorkforceMembership?.workforceId,
                          memberRole: member.role,
                          isSameWorkforce,
                          isCrossWorkforceModerator,
                          canChat,
                          fullMember: member
                        });
                        
                        return canChat;
                      });

                    console.log('DEBUG - Available members for Private Skram dialog:', filteredWorkforceMembers.length, filteredWorkforceMembers);

                    return filteredWorkforceMembers.map((member, index) => {
                      const displayName = member.user?.username || member.user?.firstName || 'Unknown User';
                      const workforceName = (member.workforceId === 'demo-workforce' ? 'Demo Workforce' : 
                                           member.workforceId === 'test-workforce-1' ? 'Test Company' : 
                                           member.workforceId || 'Unknown Workforce');
                      const roleDisplay = member.role === 'moderator' ? 'Moderator' : 'Member';
                      
                      return (
                        <SelectItem key={`private-select-${member.userId}-${index}`} value={member.userId}>
                          <div className="flex flex-col">
                            <span className="font-medium">{displayName}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{roleDisplay} • {workforceName}</span>
                          </div>
                        </SelectItem>
                      );
                    });
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={async () => {
                  console.log('DEBUG - Button clicked with selectedPrivateMember:', selectedPrivateMember);
                  if (selectedPrivateMember) {
                    try {
                      // Use the direct conversation endpoint instead of the generic one
                      console.log('DEBUG - Starting Private Skram with:', {
                        participantId: selectedPrivateMember,
                        initiatorId: user?.id
                      });

                      const response = await fetch('/api/demo/conversations/direct', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          participantId: selectedPrivateMember,
                          initiatorId: user?.id
                        }),
                        credentials: 'include'
                      });

                      if (response.ok) {
                        const directConversation = await response.json();
                        console.log('DEBUG - Direct conversation created:', directConversation);
                        
                        // Refresh conversations list
                        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
                        
                        toast({
                          title: "Private Skram Started",
                          description: "Secure conversation created successfully"
                        });
                        
                        // Auto-select the new conversation
                        setActiveConversationId(directConversation.id);
                      } else {
                        const errorData = await response.json();
                        console.error('DEBUG - Error creating conversation:', errorData);
                        toast({
                          title: "Error",
                          description: errorData.message || "Failed to create private conversation",
                          variant: "destructive"
                        });
                      }
                    } catch (error) {
                      console.error('DEBUG - Exception during conversation creation:', error);
                      toast({
                        title: "Error",
                        description: (error as Error).message || "Failed to create private conversation",
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

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group Skram</DialogTitle>
            <DialogDescription>
              Create a secure group conversation with your workforce members.
            </DialogDescription>
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
            <div className="flex space-x-2">
              <Button 
                onClick={() => {
                  if (newGroupName.trim()) {
                    createConversationMutation.mutate({
                      name: newGroupName,
                      isGroup: true,
                      memberIds: [user?.id || ""]
                    });
                    setNewGroupName("");
                    setShowCreateGroupDialog(false);
                  }
                }} 
                disabled={!newGroupName.trim() || createConversationMutation.isPending}
              >
                {createConversationMutation.isPending ? "Creating..." : "Create Group Skram"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      {activeConversationId && (
        <AddMemberDialog 
          conversationId={activeConversationId}
          isOpen={showAddMemberDialog}
          onClose={() => setShowAddMemberDialog(false)}
        />
      )}

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

      {/* PHI Message Modal */}
      <PHIMessageModal
        isOpen={showPHIModal}
        onClose={() => {
          setShowPHIModal(false);
          setPendingMessage("");
        }}
        onConfirm={handlePHIConfirm}
        messageContent={pendingMessage}
      />

      {/* Floating Action Button for Mobile (when sidebar is closed) */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 left-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center touch-friendly transition-all duration-200 ease-out floating-action-button"
          title="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      {/* Edge Swipe Indicator */}
      {!isSidebarOpen && (
        <div className="lg:hidden fixed left-0 top-1/2 transform -translate-y-1/2 w-1 h-20 bg-blue-600/30 rounded-r-full pointer-events-none z-40 swipe-indicator">
        </div>
      )}
    </div>
  );
}