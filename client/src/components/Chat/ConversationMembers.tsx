import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Crown, Shield, User as UserIcon, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConversationMember {
  userId: string;
  isAdmin: boolean;
  user: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
    role?: string;
  };
  workforceMembership?: {
    workforceName?: string;
    role?: string;
    workforceId?: string;
    workforce?: {
      name?: string;
    };
  };
}

interface ConversationMembersProps {
  conversationId: string;
  memberCount?: number;
  isGroup: boolean;
  className?: string;
  currentUserId?: string;
  onPrivateSkramStart?: (conversationId: string) => void;
}

export default function ConversationMembers({ 
  conversationId, 
  memberCount, 
  isGroup,
  className = "",
  currentUserId,
  onPrivateSkramStart
}: ConversationMembersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversation members when dialog is opened
  const { data: members, isLoading } = useQuery({
    queryKey: [`/api/conversations/${conversationId}/members`],
    enabled: isOpen && !!conversationId,
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}/members`, {
        credentials: 'include'
      });
      if (!response.ok) {
        // Try demo API as fallback
        const demoResponse = await fetch(`/api/demo/conversations/${conversationId}/members`, {
          credentials: 'include'
        });
        if (!demoResponse.ok) {
          throw new Error('Failed to fetch members');
        }
        return demoResponse.json();
      }
      return response.json();
    }
  });

  const getDisplayName = (member: ConversationMember) => {
    const user = member.user;
    return user.username || 
           `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
           user.email || 
           'Unknown User';
  };

  const getInitials = (member: ConversationMember) => {
    const user = member.user;
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getRoleIcon = (member: ConversationMember) => {
    if (member.user.role === 'master') {
      return <Crown className="w-3 h-3 text-yellow-500" />;
    }
    if (member.user.role === 'moderator' || member.isAdmin) {
      return <Shield className="w-3 h-3 text-blue-500" />;
    }
    return <UserIcon className="w-3 h-3 text-gray-500" />;
  };

  const getRoleBadge = (member: ConversationMember) => {
    if (member.user.role === 'master') {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Master</Badge>;
    }
    if (member.user.role === 'moderator') {
      return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Moderator</Badge>;
    }
    if (member.isAdmin) {
      return <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">Admin</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Member</Badge>;
  };

  const handleStartPrivateSkram = async (member: ConversationMember) => {
    if (!currentUserId) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to start Private Skrams",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/demo/conversations/direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: member.userId,
          initiatorId: currentUserId
        }),
        credentials: 'include'
      });

      if (response.ok) {
        const directConversation = await response.json();
        
        // Refresh conversations list
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        
        toast({
          title: "Private Skram Started",
          description: `Started secure conversation with ${getDisplayName(member)}`,
        });

        // Notify parent component about new conversation
        if (onPrivateSkramStart) {
          onPrivateSkramStart(directConversation.id);
        }

        setIsOpen(false);
      } else {
        const errorData = await response.json();
        toast({
          title: "Cannot Start Private Skram",
          description: errorData.message || "Failed to start Private Skram",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start Private Skram. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show simplified version for direct messages (just member count without dialog)
  if (!isGroup) {
    return (
      <div className={`text-xs text-gray-600 dark:text-gray-400 ${className}`}>
        <Users className="w-3 h-3 mr-1 inline" />
        {memberCount || 2} members
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 ${className}`}
        >
          <Users className="w-3 h-3 mr-1" />
          {memberCount || 0} members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Conversation Members
            <Badge variant="outline" className="ml-2">{members?.length || memberCount || 0}</Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-2">
              {members?.map((member: ConversationMember) => (
                <div 
                  key={member.userId}
                  className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.user.profileImageUrl} />
                    <AvatarFallback className="text-xs">
                      {getInitials(member)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(member)}
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {getDisplayName(member)}
                      </p>
                    </div>
                    {(() => {
                      // Try multiple sources for workforce name
                      const workforceName = member.workforceMembership?.workforceName || 
                                          member.workforceMembership?.workforce?.name || 
                                          (member.workforceMembership?.workforceId === 'demo-workforce' ? 'Demo Workforce' : 
                                           member.workforceMembership?.workforceId === 'test-workforce-1' ? 'Test Company' : 
                                           member.workforceMembership?.workforceId || null);
                      
                      return workforceName ? (
                        <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
                          {workforceName}
                        </p>
                      ) : null;
                    })()}
                    {member.user.email && member.user.email !== getDisplayName(member) && (
                      <p className="text-xs text-gray-500 truncate">
                        {member.user.email}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getRoleBadge(member)}
                    {currentUserId && member.userId !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartPrivateSkram(member)}
                        className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900 dark:hover:text-blue-300"
                        title="Start Private Skram"
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              
              {(!members || members.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No members found
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}