import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Send, Shield, Lock, Users, Plus, UserPlus, Edit, UserX, MessageCircle, AlertTriangle, Clock, Star, Zap, ArrowLeft, Settings, Search, Filter, MoreVertical, Key, X, CheckCircle, LogOut, Building, ChevronDown, Trash2, Moon, Sun, ChevronLeft, ChevronRight } from "lucide-react";
import { SecureChatWebSocket } from "@/lib/websocket";
import { apiRequest } from "@/lib/queryClient";
import MemberProfileModal from "@/components/Workforce/MemberProfileModal";
import InviteMemberDialog from "@/components/Workforce/InviteMemberDialog";
import { AddMemberDialog } from "@/components/Chat/AddMemberDialog";
import ConversationMembers from "@/components/Chat/ConversationMembers";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { MessageReactions } from "@/components/Chat/MessageReactions";
import { SecureMessage } from "@/components/Chat/SecureMessage";
import { PHIMessageModal, type PHIMessageData } from "@/components/Chat/PHIMessageModal";
import { PHICheckModal } from "@/components/Chat/PHICheckModal";
import MessageInput from "@/components/Chat/MessageInput";

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

interface ModeratorDemoProps {
  onReturnToDashboard?: () => void;
  isMasterAdmin?: boolean;
}

export default function ModeratorDemo({ onReturnToDashboard, isMasterAdmin = false }: ModeratorDemoProps) {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'normal' | 'low'>('all');
  const [workforceFilter, setWorkforceFilter] = useState<string>("all");
  const websocketRef = useRef<SecureChatWebSocket | null>(null);
  const initializationDone = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dialog states
  const [showStartPrivateDialog, setShowStartPrivateDialog] = useState(false);
  const [selectedPrivateMember, setSelectedPrivateMember] = useState("");
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showEditChatDialog, setShowEditChatDialog] = useState(false);
  const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [showInviteMemberDialog, setShowInviteMemberDialog] = useState(false);
  const [showWorkforceDropdown, setShowWorkforceDropdown] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showWorkforceNameDialog, setShowWorkforceNameDialog] = useState(false);
  const [newWorkforceName, setNewWorkforceName] = useState('');
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
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState("");
  const [newChatName, setNewChatName] = useState("");

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
  }, [user?.id, queryClient]);

  // Close workforce dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showWorkforceDropdown && !target.closest('[data-workforce-dropdown]')) {
        setShowWorkforceDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWorkforceDropdown]);

  // Fetch real conversations from database
  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  // Fetch workspace members for management (includes own workforce + other moderators for cross-workforce collaboration)
  const { data: workforceMembers = [] } = useQuery<any[]>({
    queryKey: ['/api/demo/workforce-members'],
    enabled: !!user,
  });

  // Get current user's workforce membership for cross-workforce indicators
  const { data: userWorkforceMembership } = useQuery<any>({
    queryKey: ['/api/user/workforce-membership'],
    enabled: !!user,
  });

  // Mutation for updating workforce name
  const updateWorkforceNameMutation = useMutation({
    mutationFn: async ({ workforceId, name }: { workforceId: string; name: string }) => {
      return apiRequest('PATCH', `/api/workforces/${workforceId}`, { name });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workforce name updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/workforce-membership'] });
      setShowWorkforceNameDialog(false);
      setNewWorkforceName('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update workforce name",
        variant: "destructive"
      });
    }
  });

  // Handle workforce name edit
  const handleEditWorkforceName = () => {
    if (userWorkforceMembership?.workforceName) {
      setNewWorkforceName(userWorkforceMembership.workforceName);
      setShowWorkforceNameDialog(true);
    }
  };

  const handleSaveWorkforceName = () => {
    if (newWorkforceName.trim() && userWorkforceMembership?.workforceId) {
      updateWorkforceNameMutation.mutate({
        workforceId: userWorkforceMembership.workforceId,
        name: newWorkforceName.trim()
      });
    }
  };

  // Group members by workforce relationship for better UX
  const ownWorkforceMembers = isMasterAdmin 
    ? workforceMembers // Master admins see all members as "own workforce"
    : workforceMembers.filter(member => 
        member.workforceId === userWorkforceMembership?.workforceId
      );
  const crossWorkforceModerators = isMasterAdmin 
    ? [] // Master admins don't need cross-workforce view since they see all
    : workforceMembers.filter(member => 
        member.role === 'moderator' && member.workforceId !== userWorkforceMembership?.workforceId
      );
  
  // Combine for display, prioritizing own workforce and removing duplicates
  const filteredWorkforceMembers = [
    ...ownWorkforceMembers,
    ...crossWorkforceModerators.filter(crossMod => 
      !ownWorkforceMembers.find(ownMember => ownMember.userId === crossMod.userId)
    )
  ];

  // Debug logging for sidebar Private Skram dialog
  console.log('DEBUG - Sidebar Private Skram Data:', {
    totalWorkforceMembers: workforceMembers.length,
    ownWorkforceMembers: ownWorkforceMembers.length,
    crossWorkforceModerators: crossWorkforceModerators.length,
    filteredWorkforceMembers: filteredWorkforceMembers.length,
    userWorkforceMembership,
    isMasterAdmin,
    rawWorkforceMembers: workforceMembers
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
          console.log('MODERATOR_DEMO - Marking conversation as read:', activeConversationId);
          const response = await fetch(`/api/conversations/${activeConversationId}/mark-read`, {
            method: 'POST',
            credentials: 'include',
          });
          console.log('MODERATOR_DEMO - Mark as read response status:', response.status);
          // Refresh conversations to update unread counts with a delay to ensure DB update completes
          setTimeout(() => {
            console.log('MODERATOR_DEMO - Invalidating conversations cache');
            queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
          }, 500);
        } catch (error) {
          console.error('MODERATOR_DEMO - Failed to mark conversation as read:', error);
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
      highlightReason: getPriorityReason(msg.content),
      reactions: msg.reactions || [], // Include reactions data from the API
      messageType: msg.messageType,
      securityLevel: msg.securityLevel,
      requiresAuthentication: msg.requiresAuthentication,
      phiTypes: msg.phiTypes,
      phiDescription: msg.phiDescription
    }));
  }, [conversationMessages, user?.id]);

  // Scroll to bottom functionality for messages
  const scrollToBottom = (immediate = false) => {
    if (immediate) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Scroll to bottom when messages change or on initial load
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Also scroll to bottom on initial conversation load - immediate scroll
  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom(true); // Immediate scroll on conversation switch
      }, 50); // Small delay to ensure DOM is rendered
      return () => clearTimeout(timer);
    }
  }, [activeConversationId]);

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
  
  // Debug logging for conversation filtering
  console.log('DEBUG - All conversations:', conversations);
  console.log('DEBUG - Group conversations:', groupConversations.length);
  console.log('DEBUG - Direct conversations:', directConversations.length);
  console.log('DEBUG - Direct conversation names:', directConversations.map(c => c.name));

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

  // Leave conversation mutation (regular users)
  const leaveConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return await apiRequest('DELETE', `/api/conversations/${conversationId}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setActiveConversationId(null);
      toast({
        title: "Success",
        description: data.message || "Left conversation successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to leave conversation",
        variant: "destructive",
      });
    },
  });

  // Delete conversation mutation (admin full delete)
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: string) => {
      return await apiRequest('DELETE', `/api/conversations/${conversationId}?force=true`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setActiveConversationId(null);
      toast({
        title: "Success",
        description: data.message || "Conversation deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete conversation",
        variant: "destructive",
      });
    },
  });

  // Password reset mutation
  const passwordResetMutation = useMutation({
    mutationFn: async (data: { userId: string }) => {
      return await apiRequest('POST', `/api/users/${data.userId}/reset-password`, {});
    },
    onSuccess: () => {
      setShowPasswordReset(false);
      setSelectedMember(null);
      setNewPassword("");
      toast({
        title: "Success",
        description: "Password reset instructions sent to user via SMS or email",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to send password reset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Member deactivation mutation
  const deactivateMemberMutation = useMutation({
    mutationFn: async (data: { memberId: string; status: string }) => {
      return await apiRequest('PATCH', `/api/workforce-members/${data.memberId}/status`, {
        status: data.status
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/demo/workforce-members'] });
      toast({
        title: "Success",
        description: `Member ${variables.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to update member status: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handlePasswordReset = (member: any) => {
    setSelectedMember(member);
    setShowPasswordReset(true);
  };

  const handlePasswordResetSubmit = () => {
    if (!selectedMember) return;
    passwordResetMutation.mutate({
      userId: selectedMember.userId,
    });
  };

  const handleMemberDeactivation = (member: any, newStatus: string) => {
    // For demo workforce members, we need to find the actual member ID from the database
    // Instead of using a pattern, we'll use the userId directly and let the backend handle it
    deactivateMemberMutation.mutate({
      memberId: member.userId, // Pass userId, backend will find the actual member record
      status: newStatus
    });
  };

  // Handle direct message with workforce boundary checking
  const handleDirectMessage = async (member: any) => {
    try {
      const response = await fetch('/api/demo/conversations/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: member.userId,
          initiatorId: user?.id
        }),
      });

      if (response.ok) {
        const directConversation = await response.json();
        
        // Switch to the direct conversation
        setActiveConversationId(directConversation.id);
        
        toast({
          title: "Direct Message Started",
          description: `Started secure conversation with ${member.username || member.userId}`,
        });
      } else {
        const errorData = await response.json();
        
        // Handle workforce boundary violations specifically
        if (response.status === 403) {
          toast({
            title: "Access Restricted",
            description: errorData.message || "You can only message members of your own workforce",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Failed to Start Conversation",
            description: errorData.message || "Could not start direct conversation",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start direct conversation. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Invite member mutation
  const inviteMemberMutation = useMutation({
    mutationFn: async (inviteData: { workforceId: string; email: string; phoneNumber: string; role: string }) => {
      return await apiRequest('POST', '/api/workforce-invitations', inviteData);
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "Workforce invitation has been sent successfully."
      });
      setShowInviteMemberDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/demo/workforce-members'] });
    },
    onError: (error: any) => {
      toast({
        title: "Invitation Failed",
        description: `Failed to send workforce invitation: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const handleInviteMember = (inviteData: { workforceId: string; email: string; phoneNumber: string; role: string }) => {
    inviteMemberMutation.mutate(inviteData);
  };

  // Function to get display name for direct conversations
  const getDirectConversationDisplayName = (conversation: any) => {
    if (conversation.isGroup) {
      return conversation.name;
    }
    
    // The current user could be represented by username, email, or user ID
    const currentIdentifiers = [
      currentUser.username,
      currentUser.email,
      user?.username,
      user?.email,
      user?.id
    ].filter(Boolean);
    
    console.log('DEBUG - Processing conversation:', conversation.name, 'Current identifiers:', currentIdentifiers);
    
    // Handle new format: "Direct: user1 & user2"
    if (conversation.name.startsWith('Direct: ')) {
      const usernames = conversation.name.replace('Direct: ', '').split(' & ');
      console.log('DEBUG - Direct format usernames:', usernames);
      const otherUser = usernames.find((name: string) => !currentIdentifiers.includes(name));
      console.log('DEBUG - Other user from direct format:', otherUser);
      return otherUser || usernames[0] || "Unknown User";
    }
    
    // Handle old format: "user1, user2" or "user1, Private Chat"
    if (conversation.name.includes(', ')) {
      const parts = conversation.name.split(', ');
      console.log('DEBUG - Old format parts:', parts);
      
      // Remove "Private Chat" if present
      const userParts = parts.filter((part: string) => part !== 'Private Chat');
      console.log('DEBUG - User parts after filtering:', userParts);
      
      // Find the part that's not the current user
      const otherUser = userParts.find((part: string) => !currentIdentifiers.includes(part));
      console.log('DEBUG - Other user found in old format:', otherUser);
      
      // Return the other user, or null if it's just the current user
      if (otherUser) {
        return otherUser;
      }
      
      // If only current user parts remain, this conversation should be hidden
      return null;
    }
    
    // If it's just a single name and it's the current user, hide it
    if (currentIdentifiers.includes(conversation.name)) {
      return null;
    }
    
    return conversation.name;
  };

  // Send message function
  const handleSendMessage = (content: string, attachments?: any[]) => {
    if ((!content.trim() && !attachments?.length) || !activeConversationId) return;

    // Store message and attachments, then show PHI check modal first
    setPendingMessage(content.trim());
    setPendingAttachments(attachments || []);
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
      if (websocketRef.current && activeConversationId) {
        const activeConv = conversations.find(c => c.id === activeConversationId);
        const participantIds = activeConv?.members?.map((m: any) => m.userId) || [];
        
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
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${activeConversationId}/messages`] });
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

    try {
      if (phiData.containsPHI) {
        // Send secure message with PHI data
        const response = await apiRequest('POST', '/api/messages/secure', {
          conversationId: activeConversationId,
          content: pendingMessage,
          messageType: 'secure',
          phiTypes: phiData.phiTypes,
          description: phiData.description,
          attachments: pendingAttachments,
        });

        if (response) {
          toast({
            title: "Secure Message Sent",
            description: "PHI message has been sent with password protection",
          });
        }
      } else {
        // Send regular message via WebSocket
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

      // Clear message input and close modal
      setMessageInput("");
      setPendingMessage("");
      setPendingAttachments([]);
      setShowPHIModal(false);

      // Refresh messages
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${activeConversationId}/messages`] });

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  // Filter messages by priority
  const filteredMessages = messages.filter(message => 
    priorityFilter === 'all' || message.priority === priorityFilter
  );

  // Get priority icon and color
  const getPriorityDisplay = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { icon: Zap, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50', border: 'border-l-red-500' };
      case 'high':
        return { icon: AlertTriangle, color: 'text-orange-500 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/50', border: 'border-l-orange-500' };
      case 'low':
        return { icon: Clock, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-800', border: 'border-l-gray-500' };
      default:
        return { icon: MessageCircle, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50', border: 'border-l-blue-500' };
    }
  };

  const activeConversation = conversations.find(conv => conv.id === activeConversationId);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Toaster />
      
      {/* Left Sidebar - Slack style */}
      <div className={`${isSidebarMinimized ? 'w-16' : 'w-64'} bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col transition-all duration-200 ease-out`}>
        {/* Workspace Header */}
        <div className="h-12 bg-gray-50 dark:bg-slate-900 flex items-center px-3 border-b border-gray-200 dark:border-slate-600">
          {isSidebarMinimized ? (
            // Minimized Header with Expand Button
            <div className="flex items-center justify-between w-full">
              <div className={`w-6 h-6 ${isMasterAdmin ? 'bg-yellow-600' : 'bg-purple-600'} rounded flex items-center justify-center`}>
                <Shield className="w-4 h-4 text-white" />
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 min-h-[36px] min-w-[36px] hover:bg-gray-100 dark:hover:bg-slate-700 touch-friendly bg-blue-50 dark:bg-blue-900/30"
                onClick={() => setIsSidebarMinimized(false)}
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </Button>
            </div>
          ) : (
            // Full Header with Minimize Button
            <>
              <div className="flex items-center space-x-2 flex-1">
                <div className={`w-6 h-6 ${isMasterAdmin ? 'bg-yellow-600' : 'bg-purple-600'} rounded flex items-center justify-center`}>
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <button 
                  onClick={handleEditWorkforceName}
                  className="text-gray-900 dark:text-white font-bold text-sm hover:text-gray-700 dark:hover:text-slate-200 transition-colors text-left"
                  title={isMasterAdmin ? "Click to edit workspace name" : "Click to edit workforce name"}
                >
                  {isMasterAdmin 
                    ? 'SecureChat Admin' 
                    : (userWorkforceMembership?.workforceName || 'SecureChat')
                  }
                </button>
              </div>
              <div className="flex items-center gap-1">
                {/* Minimize Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 min-h-[36px] min-w-[36px] hover:bg-gray-100 dark:hover:bg-slate-700 touch-friendly bg-blue-50 dark:bg-blue-900/30"
                  onClick={() => setIsSidebarMinimized(true)}
                  title="Minimize sidebar"
                >
                  <ChevronLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </Button>
                <Button variant="ghost" size="sm" className="w-6 h-6 p-0 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {isSidebarMinimized ? (
          // Minimized Search and Actions
          <div className="flex flex-col items-center px-2 py-2 gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-10 h-10 p-0 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              title="Jump to..."
            >
              <Search className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => window.location.href = "/workforce"}
              className="w-10 h-10 p-0 bg-purple-600 hover:bg-purple-700 text-white"
              title="Workforce Management"
            >
              <Users className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-10 h-10 p-0 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
              title="Priority Filter"
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          // Full Search and Actions
          <>
            {/* Search and Jump to */}
            <div className="px-3 py-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white text-xs h-7"
              >
                <Search className="w-3 h-3 mr-2" />
                Jump to...
              </Button>
            </div>

            {/* Workforce Management - Primary Action for Moderators */}
            <div className="px-3 pb-2">
              <Button
                onClick={() => window.location.href = "/workforce"}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-start gap-2 text-xs h-8 font-medium"
                title="Access your dedicated workforce management dashboard"
              >
                <Users className="w-3 h-3" />
                Workforce Management
              </Button>
            </div>

            {/* Priority Filter */}
            <div className="px-3 pb-3">
              <div className="mb-2">
                <Label className="text-gray-500 dark:text-slate-400 text-xs">Priority Filter</Label>
              </div>
              <Select value={priorityFilter} onValueChange={(value: any) => setPriorityFilter(value)}>
                <SelectTrigger className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white text-xs h-7">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Messages</SelectItem>
                  <SelectItem value="urgent">🔴 Urgent</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="normal">🔵 Normal</SelectItem>
                  <SelectItem value="low">⚪ Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Group Skrams Section */}
        <div className="flex-1 overflow-y-auto">
          {isSidebarMinimized ? (
            // Minimized Conversations View
            <div className="px-2 py-2 space-y-1">
              {/* Group Conversations - Icons Only */}
              {groupConversations.slice(0, 5).map((conv) => (
                <div key={conv.id} className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-10 h-10 p-0 relative ${
                      activeConversationId === conv.id
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    title={conv.name}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  {(conv.unreadCount || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                      {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              ))}
              
              {/* Direct Conversations - Icons Only */}
              {directConversations.slice(0, 5).map((conv) => {
                const displayName = getDirectConversationDisplayName(conv);
                if (!displayName || displayName === "Private Chat" || displayName.trim() === "" || displayName === "Me") {
                  return null;
                }
                
                return (
                  <div key={conv.id} className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveConversationId(conv.id)}
                      className={`w-10 h-10 p-0 relative ${
                        activeConversationId === conv.id
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                      title={displayName}
                    >
                      <div className="w-2 h-2 bg-green-400 rounded-full absolute top-1 right-1"></div>
                      {displayName.charAt(0).toUpperCase()}
                    </Button>
                    {(conv.unreadCount || 0) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Full Conversations View
            <div className="px-3">
              <div className="py-2">
                <div className="flex items-center justify-between mb-1 px-2">
                  <button className="flex items-center text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white text-xs font-medium">
                    <div className="flex mr-1">
                      <Zap className="w-3 h-3" />
                      <Zap className="w-3 h-3 -ml-1" />
                    </div>
                    Group Skrams
                  </button>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCreateGroupDialog(true)}
                      className="w-4 h-4 p-0 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                      title="Create new Group Skram"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    {isMasterAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-4 h-4 p-0 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700"
                        title="Advanced group skram settings"
                      >
                        <Settings className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
            <div className="space-y-1">
              {groupConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group w-full text-left p-3 rounded-lg transition-colors flex items-center ${
                    activeConversationId === conv.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <button
                    onClick={() => setActiveConversationId(conv.id)}
                    className="flex-1 text-left flex items-center"
                  >
                    <span className="text-sm font-medium truncate flex-1">{conv.name}</span>
                    <div className="flex items-center ml-2 text-xs opacity-70 space-x-2">
                      {(conv.unreadCount || 0) > 0 && (
                        <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium min-w-[18px] text-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                  {/* Moderators and Master Admin can delete Group Skrams */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isMasterAdmin) {
                        // Master admin can choose to leave or fully delete
                        const action = window.confirm(`Choose action for Group Skram "${conv.name}":\n\nOK = Leave group (you only)\nCancel = Full delete (removes for everyone)`);
                        if (action) {
                          // Leave group
                          leaveConversationMutation.mutate(conv.id);
                        } else {
                          // Full delete
                          if (window.confirm(`Are you sure you want to PERMANENTLY DELETE the entire Group Skram "${conv.name}" for ALL members?`)) {
                            deleteConversationMutation.mutate(conv.id);
                          }
                        }
                      } else {
                        // Regular moderators just leave the group
                        if (window.confirm(`Are you sure you want to leave the Group Skram "${conv.name}"? You can be re-invited later.`)) {
                          leaveConversationMutation.mutate(conv.id);
                        }
                      }
                    }}
                    className="w-4 h-4 p-0 text-gray-400 dark:text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    title={isMasterAdmin ? "Leave or Delete Group Skram" : "Leave Group Skram"}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Direct Messages Section */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1 px-2">
                <button className="flex items-center text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white text-xs font-medium">
                  <Zap className="w-3 h-3 mr-1" />
                  Private Skrams
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('DEBUG - Plus button clicked, opening dialog');
                    setShowStartPrivateDialog(true);
                  }}
                  className="w-6 h-6 p-1 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 z-10 border border-transparent hover:border-gray-300 dark:hover:border-slate-500"
                  title="Start Private Skram"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-0">
                {directConversations.map((conv) => {
                  const displayName = getDirectConversationDisplayName(conv);
                  console.log('DEBUG - Rendering conversation:', conv.id, 'with display name:', displayName);
                  
                  // Don't render conversations that result in empty names, null, or current user only
                  if (!displayName || displayName === "Private Chat" || displayName.trim() === "" || displayName === "Me") {
                    console.log('DEBUG - Skipping conversation with empty/invalid display name:', conv.name);
                    return null;
                  }
                  
                  return (
                    <div
                      key={conv.id}
                      className={`group w-full text-left px-2 py-1 rounded text-sm transition-colors flex items-center ${
                        activeConversationId === conv.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <button
                        onClick={() => setActiveConversationId(conv.id)}
                        className="flex-1 text-left flex items-center"
                      >
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2 flex-shrink-0"></div>
                        <span className="truncate flex-1">{displayName}</span>
                        {(conv.unreadCount || 0) > 0 && (
                          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium min-w-[18px] text-center ml-2">
                            {conv.unreadCount}
                          </span>
                        )}
                      </button>
                      {/* Moderators and Master Admin can delete Private Skrams */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isMasterAdmin) {
                            // Master admin can delete private conversations
                            if (window.confirm(`Are you sure you want to delete the Private Skram with "${displayName}"? This will permanently remove it for all participants.`)) {
                              deleteConversationMutation.mutate(conv.id);
                            }
                          } else {
                            // Regular moderators should only be able to leave/hide
                            if (window.confirm(`Are you sure you want to leave the Private Skram with "${displayName}"? This will remove it from your view.`)) {
                              leaveConversationMutation.mutate(conv.id);
                            }
                          }
                        }}
                        className="w-4 h-4 p-0 text-gray-400 dark:text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        title={isMasterAdmin ? "Delete Private Skram (permanent)" : "Leave Private Skram"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-b border-slate-600">
          {isSidebarMinimized ? (
            // Minimized User Info
            <div className="flex flex-col items-center gap-2">
              <div className={`w-8 h-8 ${isMasterAdmin ? 'bg-yellow-500' : 'bg-purple-600'} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm font-medium">
                  {currentUser.username?.charAt(0).toUpperCase() || (isMasterAdmin ? 'A' : 'M')}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="w-8 h-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                {isMasterAdmin && onReturnToDashboard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReturnToDashboard}
                    className="w-8 h-8 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                    title="Return to Dashboard"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  className="w-8 h-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-900/20"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            // Full User Info
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${isMasterAdmin ? 'bg-yellow-500' : 'bg-purple-600'} rounded-full flex items-center justify-center`}>
                <span className="text-white text-sm font-medium">
                  {currentUser.username?.charAt(0).toUpperCase() || (isMasterAdmin ? 'A' : 'M')}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {currentUser.username || 'User'}
                </p>
                <p className="text-xs text-slate-400">{isMasterAdmin ? 'Master Admin' : 'Moderator'}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleDarkMode}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-600 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-600"
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                {isMasterAdmin && onReturnToDashboard && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReturnToDashboard}
                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-600 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-600"
                    title="Return to Dashboard"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.href = "/api/logout"}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-900/20 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>


      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header - Matching ChatAreaFixed style */}
        <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {onReturnToDashboard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReturnToDashboard}
                className={`mr-2 hidden sm:flex ${
                  isMasterAdmin 
                    ? 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                    : 'text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                {isMasterAdmin ? 'Return to Dashboard' : 'Return to Testing'}
              </Button>
            )}
            {/* Mobile return button - icon only */}
            {onReturnToDashboard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReturnToDashboard}
                className={`mr-2 sm:hidden w-9 h-9 p-0 ${
                  isMasterAdmin 
                    ? 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                    : 'text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
                title={isMasterAdmin ? 'Return to Dashboard' : 'Return to Testing'}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              {!activeConversation?.isGroup && (
                <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
              )}
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">
                {activeConversation?.name || 'Select a conversation'}
              </h2>
              {activeConversation && (
                <div className="hidden sm:block">
                  <ConversationMembers 
                    conversationId={activeConversation.id}
                    memberCount={activeConversation.members?.length}
                    isGroup={activeConversation.isGroup}
                    currentUserId={user?.id}
                    onPrivateSkramStart={(conversationId) => setActiveConversationId(conversationId)}
                  />
                </div>
              )}
              {activeConversation?.isGroup && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-7 h-7 p-0 text-gray-500 hover:text-gray-700 hidden sm:flex"
                  onClick={() => {
                    console.log('Add member button clicked!');
                    setShowAddMemberDialog(true);
                  }}
                  title="Add workforce member to conversation"
                >
                  <UserPlus className="h-3 w-3" />
                </Button>
              )}
            </div>
            {activeConversation && !activeConversation.isGroup && (
              <div className="hidden md:flex items-center space-x-2">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <span className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">This conversation is just between you two</span>
              </div>
            )}

          </div>
          
          {/* Workforce Members Icon - Top Right - Always Visible */}
          <div className="flex items-center space-x-2">
            {/* Mobile: Add group member button (if needed) */}
            {activeConversation?.isGroup && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-9 h-9 p-0 text-gray-500 hover:text-gray-700 sm:hidden"
                onClick={() => {
                  console.log('Add member button clicked!');
                  setShowAddMemberDialog(true);
                }}
                title="Add workforce member to conversation"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            )}
            
            <div className="relative" data-workforce-dropdown>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-11 h-11 p-0 text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowWorkforceDropdown(!showWorkforceDropdown)}
                title={isMasterAdmin 
                  ? `All Workforces (${ownWorkforceMembers.filter(m => m.userId !== user?.id).length} members)` 
                  : `My Workforce (${ownWorkforceMembers.filter(m => m.userId !== user?.id).length} members)`}
              >
                <Users className="h-5 w-5" />
                {ownWorkforceMembers.filter(m => m.userId !== user?.id).length > 0 && (
                  <span className={`absolute -top-1 -right-1 ${isMasterAdmin ? 'bg-yellow-600' : 'bg-purple-600'} text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium`}>
                    {ownWorkforceMembers.filter(m => m.userId !== user?.id).length}
                  </span>
                )}
              </Button>
              
              {showWorkforceDropdown && (
                <div className="absolute top-full right-0 mt-2 w-80 sm:w-80 w-screen max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                        {isMasterAdmin ? 'All Workforces' : 'My Workforce'}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowInviteMemberDialog(true);
                          setShowWorkforceDropdown(false);
                        }}
                        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                        title="Invite new member"
                      >
                        <UserPlus className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Workforce Members */}
                    <div className="space-y-2">
                      {ownWorkforceMembers
                        .filter(member => member.userId !== user?.id)
                        .map((member, index) => (
                        <div
                          key={`own-workforce-${member.userId}-${index}`}
                          className="group flex items-center justify-between p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div 
                            className="flex items-center space-x-3 flex-1 cursor-pointer" 
                            onClick={() => {
                              setSelectedMember(member);
                              setShowMemberProfile(true);
                              setShowWorkforceDropdown(false);
                            }}
                            title={`View profile for ${member.username || member.userId}`}
                          >
                            <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                                {member.username || member.userId}
                              </p>
                              <div className="flex items-center gap-2">
                                {member.role === 'moderator' && (
                                  <span className="text-xs text-purple-600 dark:text-purple-400">Moderator</span>
                                )}
                                {isMasterAdmin && member.workforceName && (
                                  <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                    {member.workforceName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDirectMessage(member);
                                setShowWorkforceDropdown(false);
                              }}
                              className="w-7 h-7 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Send Direct Message"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePasswordReset(member);
                                setShowWorkforceDropdown(false);
                              }}
                              className="w-7 h-7 p-0 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                              title="Reset Password"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMemberDeactivation(member, member.status === 'active' ? 'inactive' : 'active');
                                setShowWorkforceDropdown(false);
                              }}
                              disabled={deactivateMemberMutation.isPending}
                              className={`w-7 h-7 p-0 ${
                                member.status === 'active' 
                                  ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300' 
                                  : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                              }`}
                              title={member.status === 'active' ? 'Deactivate Member' : 'Activate Member'}
                            >
                              {member.status === 'active' ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Cross-Workforce Moderators in Header Dropdown */}
                      {crossWorkforceModerators.length > 0 && (
                        <>
                          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
                            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                              Other Moderators ({crossWorkforceModerators.length})
                            </h4>
                          </div>
                          {crossWorkforceModerators.map((member, index) => (
                            <div
                              key={`cross-moderator-${member.userId}-${index}`}
                              className="group flex items-center justify-between p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-l-4 border-orange-400"
                            >
                              <div 
                                className="flex items-center space-x-3 flex-1 cursor-pointer" 
                                onClick={() => {
                                  setSelectedMember(member);
                                  setShowMemberProfile(true);
                                  setShowWorkforceDropdown(false);
                                }}
                                title={`Cross-workforce moderator: ${member.username || member.userId} (${member.workforceName || (member.workforceId === 'demo-workforce' ? 'Demo Workforce' : member.workforceId === 'test-workforce-1' ? 'Test Company' : member.workforceId || 'Unknown Workforce')})`}
                              >
                                <div className="w-3 h-3 bg-orange-400 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                                    {member.username || member.userId}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-purple-600 dark:text-purple-400">Moderator</span>
                                    <span className="text-xs text-orange-600 dark:text-orange-400">{member.workforceName || (member.workforceId === 'demo-workforce' ? 'Demo Workforce' : member.workforceId === 'test-workforce-1' ? 'Test Company' : member.workforceId || 'Unknown Workforce')}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDirectMessage(member);
                                    setShowWorkforceDropdown(false);
                                  }}
                                  className="w-7 h-7 p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                  title="Send Cross-Workforce Message"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" className="w-7 h-7 p-0 text-gray-500 hover:text-gray-700">
              <Search className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Add Member CTA for empty group conversations */}
          {activeConversation && activeConversation.isGroup && filteredMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-w-md">
                <UserPlus className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">
                  Start Your Group Skram
                </h3>
                <Button 
                  onClick={() => setShowAddMemberDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Workforce Members
                </Button>
              </div>
            </div>
          )}
          
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex flex-col max-w-sm lg:max-w-md">
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
                        {message.sender}
                      </span>
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
          ))}
          
          {/* Invisible div for scrolling to bottom */}
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

      {/* Create Group Dialog */}
      <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group Skram</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Skram Name</Label>
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter skram name"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={() => {
                  if (newGroupName.trim()) {
                    createConversationMutation.mutate({
                      name: newGroupName,
                      isGroup: true,
                      memberIds: [user?.id || "45717668"]
                    });
                    setNewGroupName("");
                    setShowCreateGroupDialog(false);
                  }
                }} 
                disabled={!newGroupName.trim()}
              >
                Create Skram
              </Button>
              <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Private Dialog */}
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
                    const availableMembers = filteredWorkforceMembers
                      .filter(member => member.userId !== user?.id)
                      .filter(member => {
                      // For Private Skrams, moderators can only chat with:
                      // 1. Any user in their own workforce (same workforceId)
                      // 2. OTHER moderators from different workforces
                      const isSameWorkforce = member.workforceId === userWorkforceMembership?.workforceId;
                      const isCrossWorkforceModerator = member.role === 'moderator' && member.workforceId !== userWorkforceMembership?.workforceId;
                      const canChat = isSameWorkforce || isCrossWorkforceModerator;
                      
                      // Debug logging for filtering
                      console.log(`DEBUG - Member filtering:`, {
                        username: member.username,
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
                    
                    console.log('DEBUG - Dialog Open State:', showStartPrivateDialog);
                    console.log('DEBUG - Available members for Private Skram dialog:', availableMembers.length, availableMembers);
                    
                    return availableMembers.map((member, index) => {
                      const displayName = member.username || member.user?.username || member.user?.firstName || member.user?.email?.split('@')[0] || 'Unknown User';
                      // Try multiple sources for workforce name
                      const workforceName = member.workforceName || 
                                          member.workforce?.name || 
                                          (member.workforceId === 'demo-workforce' ? 'Demo Workforce' : 
                                           member.workforceId === 'test-workforce-1' ? 'Test Company' : 
                                           member.workforceId || 'Unknown Workforce');
                      const roleDisplay = member.role === 'moderator' ? 'Moderator' : 'Member';
                      
                      return (
                        <SelectItem key={`private-select-${member.userId}-${index}`} value={member.userId}>
                          <div className="flex flex-col">
                            <span className="font-medium">{displayName}</span>
                            <span className="text-xs text-gray-500">{roleDisplay} • {workforceName}</span>
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
                        initiatorId: user?.id || "45717668",
                        userObject: user
                      });
                      
                      const response = await fetch('/api/demo/conversations/direct', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          participantId: selectedPrivateMember,
                          initiatorId: user?.id || "45717668"
                        }),
                        credentials: 'include'
                      });

                      if (response.ok) {
                        const directConversation = await response.json();
                        setActiveConversationId(directConversation.id);
                        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
                        toast({
                          title: "Private Skram Started",
                          description: "Direct conversation created successfully"
                        });
                      } else {
                        console.log('DEBUG - API Response status:', response.status);
                        const errorText = await response.text();
                        console.error('DEBUG - Raw API Error Response:', errorText);
                        
                        let errorData;
                        try {
                          errorData = JSON.parse(errorText);
                        } catch (e) {
                          errorData = { message: errorText };
                        }
                        
                        console.error('DEBUG - Parsed API Error:', errorData);
                        throw new Error(errorData.message || 'Failed to create conversation');
                      }
                    } catch (error: any) {
                      console.error('Private Skram creation error:', error);
                      toast({
                        title: "Error", 
                        description: error.message || "Failed to create private conversation",
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

      {/* Password Reset Dialog */}
      <Dialog open={showPasswordReset} onOpenChange={setShowPasswordReset}>
        <DialogContent className="bg-white dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-slate-100">
              <Key className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Reset Password
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-slate-400">
              Send password reset instructions to{" "}
              <span className="font-medium">
                {selectedMember?.username ? `@${selectedMember.username}` : selectedMember?.userId}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-start gap-3">
                <Key className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div className="flex-1">
                  <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-1">
                    Send Password Reset
                  </h5>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                    Send reset instructions to{" "}
                    <span className="font-medium">
                      {selectedMember?.username ? `@${selectedMember.username}` : selectedMember?.userId}
                    </span>
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200 mb-3">
                    This will send password reset instructions to the user via SMS or email. The user can then create their own new password securely.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordReset(false);
                        setSelectedMember(null);
                        setNewPassword("");
                      }}
                      className="border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordResetSubmit}
                      disabled={passwordResetMutation.isPending}
                      className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600 text-white"
                    >
                      {passwordResetMutation.isPending ? "Sending..." : "Send Reset Instructions"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Profile Modal */}
      <MemberProfileModal
        member={selectedMember ? {
          id: `member-${selectedMember.userId}`,
          workforceId: 'demo-workforce',
          userId: selectedMember.userId,
          role: selectedMember.role,
          joinedAt: new Date().toISOString(),
          status: selectedMember.status || 'active',
          user: {
            id: selectedMember.userId,
            email: selectedMember.email || `${selectedMember.username}@skram.app`,
            firstName: selectedMember.firstName,
            lastName: selectedMember.lastName,
            profileImageUrl: selectedMember.profileImageUrl,
            username: selectedMember.username,
            phoneNumber: selectedMember.phoneNumber
          }
        } : null}
        open={showMemberProfile}
        onOpenChange={setShowMemberProfile}
        currentUserRole={isMasterAdmin ? "master" : "admin"}
      />

      {/* Add Member to Conversation Dialog */}
      {activeConversationId && (
        <AddMemberDialog
          conversationId={activeConversationId}
          isOpen={showAddMemberDialog}
          onClose={() => setShowAddMemberDialog(false)}
        />
      )}

      {/* Invite Member Dialog */}
      <InviteMemberDialog
        open={showInviteMemberDialog}
        onOpenChange={setShowInviteMemberDialog}
        onSubmit={handleInviteMember}
        workforceId="demo-workforce"
        isLoading={inviteMemberMutation.isPending}
      />

      {/* Workforce Name Edit Dialog */}
      <Dialog open={showWorkforceNameDialog} onOpenChange={setShowWorkforceNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-purple-600" />
              Edit {isMasterAdmin ? 'Workspace' : 'Workforce'} Name
            </DialogTitle>
            <DialogDescription>
              {isMasterAdmin 
                ? "Update the name of your admin workspace"
                : "Update the name of your workforce. This will be visible to all members."
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="workforce-name">
                {isMasterAdmin ? 'Workspace Name' : 'Workforce Name'}
              </Label>
              <Input
                id="workforce-name"
                value={newWorkforceName}
                onChange={(e) => setNewWorkforceName(e.target.value)}
                placeholder={isMasterAdmin ? "Enter workspace name" : "Enter workforce name"}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setShowWorkforceNameDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveWorkforceName}
                disabled={!newWorkforceName.trim() || updateWorkforceNameMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {updateWorkforceNameMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
}