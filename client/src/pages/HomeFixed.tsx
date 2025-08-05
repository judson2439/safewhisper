import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import ChatSidebar from "@/components/Chat/ChatSidebar";
import ChatArea from "@/components/Chat/ChatAreaFixed";
import { SecureChatWebSocket } from "@/lib/websocket";
import { Crown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  expiresAt: string;
  messageType: string;
  sender: {
    id: string;
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
      firstName?: string;
      lastName?: string;
      profileImageUrl?: string;
    };
  }>;
}

interface HomeFixedProps {
  onReturnToDashboard?: () => void;
}

export default function HomeFixed({ onReturnToDashboard }: HomeFixedProps = {}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const websocketRef = useRef<SecureChatWebSocket | null>(null);
  const initializationDone = useRef(false);

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
    }
  }, [isAuthenticated, isLoading, toast]);

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

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  // Auto-select first conversation
  useEffect(() => {
    if (conversations.length > 0 && !activeConversationId) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations.length, activeConversationId]);

  // Join conversation when selected
  useEffect(() => {
    if (activeConversationId && websocketRef.current) {
      websocketRef.current.joinConversation(activeConversationId);
    }
  }, [activeConversationId]);

  // Fetch messages for active conversation
  const { data: conversationMessages = [] } = useQuery<Message[]>({
    queryKey: ['/api/conversations', activeConversationId, 'messages'],
    enabled: !!activeConversationId,
  });

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
        description: "Failed to create conversation",
        variant: "destructive",
      });
    },
  });

  // Handle conversation selection
  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setIsSidebarOpen(false);
  };

  // Handle conversation creation
  const handleCreateConversation = (name: string, isGroup: boolean, memberIds: string[]) => {
    createConversationMutation.mutate({ name, isGroup, memberIds });
  };

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

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Master User Header */}
      {user?.role === 'master' && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Master Admin Mode</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2 border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-300 dark:hover:bg-yellow-900/20"
              onClick={() => {
                if (onReturnToDashboard) {
                  // Called from AdminDashboard - use callback to switch tabs
                  onReturnToDashboard();
                } else {
                  // Called from standalone route - navigate to admin
                  setLocation('/admin');
                }
              }}
            >
              <Crown className="w-4 h-4" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      )}
      
      {/* Chat Interface */}
      <div className="flex flex-1 overflow-hidden">
        {/* Non-Master User Theme Toggle */}
        {user?.role !== 'master' && (
          <div className="absolute top-4 right-4 z-50">
            <ThemeToggle />
          </div>
        )}
        
        {/* Sidebar */}
        <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block`}>
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId || undefined}
            onSelectConversation={handleSelectConversation}
            onCreateConversation={handleCreateConversation}
            currentUserId={user.id}
          />
        </div>

        {/* Chat Area */}
        <ChatArea
          conversation={activeConversation || null}
          messages={conversationMessages}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentUserId={user.id}
          websocket={websocketRef.current}
        />
      </div>
    </div>
  );
}