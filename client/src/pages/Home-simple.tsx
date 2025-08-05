import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import ChatSidebar from "@/components/Chat/ChatSidebar";
import ChatArea from "@/components/Chat/ChatArea";
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

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const websocketRef = useRef<SecureChatWebSocket | null>(null);

  // Initialize WebSocket only once with proper cleanup
  if (user?.id && !websocketRef.current) {
    try {
      websocketRef.current = new SecureChatWebSocket(user.id);
      websocketRef.current.onMessage('new_message', () => {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        }, 100);
      });
    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }
  }

  // Redirect if not authenticated
  if (!isLoading && !isAuthenticated) {
    toast({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

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
    if (websocketRef.current) {
      websocketRef.current.joinConversation(conversationId);
    }
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

  // Auto-select first conversation if none selected and conversations exist
  if (conversations.length > 0 && !activeConversationId && conversations[0]?.id) {
    setTimeout(() => setActiveConversationId(conversations[0].id), 0);
  }

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - Desktop always visible, Mobile toggleable */}
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
  );
}