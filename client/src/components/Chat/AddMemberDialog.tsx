import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Users, Plus, X } from "lucide-react";

interface AddMemberDialogProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface WorkforceMember {
  id: string;
  userId: string;
  workforceId: string;
  role: string;
  user: {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
  };
  workforceName?: string;
}

export function AddMemberDialog({ conversationId, isOpen, onClose }: AddMemberDialogProps) {
  const [manualUsernames, setManualUsernames] = useState<string[]>([""]);
  const [selectedWorkforceMembers, setSelectedWorkforceMembers] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workforce members for group conversations - only same workforce members (not cross-workforce moderators)
  const { data: workforceMembers, isLoading: loadingMembers } = useQuery({
    queryKey: ['/api/user/workforce-members-for-add'],
    enabled: isOpen,
    queryFn: async () => {
      try {
        // First check current user
        const userResponse = await fetch('/api/auth/user', {
          credentials: 'include'
        });
        
        if (!userResponse.ok) {
          console.error('Failed to fetch current user');
          return [];
        }
        
        const user = await userResponse.json();
        
        // Master admin users can see all workforce members for selection
        if (user?.role === 'master' || user?.id === '45717668') {
          const allMembersResponse = await fetch('/api/demo/workforce-members', {
            credentials: 'include'
          });
          
          if (!allMembersResponse.ok) {
            console.error('Failed to fetch all workforce members');
            return [];
          }
          
          const allMembers = await allMembersResponse.json();
          return Array.isArray(allMembers) ? allMembers : [];
        }
        
        // For group conversations, moderators and regular users should only see their own workforce
        // Get user's workforce membership first
        const membershipResponse = await fetch('/api/user/workforce-membership', {
          credentials: 'include'
        });
        
        if (!membershipResponse.ok) {
          console.error('Failed to fetch user workforce membership');
          return [];
        }
        
        const membership = await membershipResponse.json();
        
        if (!membership || !membership.workforceId) {
          console.log('User has no workforce membership');
          return [];
        }
        
        // For group conversations, get only same workforce members
        const workforceResponse = await fetch(`/api/workforces/${membership.workforceId}/members`, {
          credentials: 'include'
        });
        
        if (!workforceResponse.ok) {
          console.error('Failed to fetch same workforce members');
          return [];
        }
        
        const workforceMembers = await workforceResponse.json();
        return Array.isArray(workforceMembers) ? workforceMembers : [];
      } catch (error) {
        console.error('Error fetching workforce members:', error);
        return [];
      }
    }
  });

  // Fetch current conversation members to filter them out
  const { data: currentMembers } = useQuery({
    queryKey: [`/api/conversations/${conversationId}/members`],
    enabled: isOpen && !!conversationId,
    queryFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}/members`, {
        credentials: 'include'
      });
      if (!response.ok) {
        const demoResponse = await fetch(`/api/demo/conversations/${conversationId}/members`, {
          credentials: 'include'
        });
        if (!demoResponse.ok) throw new Error('Failed to fetch current members');
        return demoResponse.json();
      }
      return response.json();
    }
  });

  // Filter out members already in conversation
  const availableWorkforceMembers = Array.isArray(workforceMembers) 
    ? workforceMembers.filter((member: any) => 
        !currentMembers?.some((currentMember: any) => currentMember.userId === member.userId)
      )
    : [];

  const addMembersMutation = useMutation({
    mutationFn: async (membersToAdd: { usernames: string[]; workforceUserIds: string[] }) => {
      const results = [];
      const errors = [];

      // Add workforce members
      for (const userId of membersToAdd.workforceUserIds) {
        const member = Array.isArray(workforceMembers) 
          ? workforceMembers.find((m: any) => m.userId === userId)
          : null;
        if (!member?.user?.username) continue;

        try {
          let response = await fetch(`/api/demo/conversations/${conversationId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
              username: member.user.username,
              inviterId: localStorage.getItem('currentUserId') || "45717668"
            }),
          });
          
          if (!response.ok && response.status === 404) {
            response = await fetch(`/api/conversations/${conversationId}/members`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ username: member.user.username }),
            });
          }
          
          if (response.ok) {
            results.push(await response.json());
          } else {
            const error = await response.json();
            errors.push(`${member.user.username}: ${error.message}`);
          }
        } catch (error) {
          errors.push(`${member.user.username}: Network error`);
        }
      }

      // Add manual usernames
      for (const username of membersToAdd.usernames.filter(u => u.trim())) {
        try {
          let response = await fetch(`/api/demo/conversations/${conversationId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ 
              username: username.trim(),
              inviterId: localStorage.getItem('currentUserId') || "45717668"
            }),
          });
          
          if (!response.ok && response.status === 404) {
            response = await fetch(`/api/conversations/${conversationId}/members`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",  
              body: JSON.stringify({ username: username.trim() }),
            });
          }
          
          if (response.ok) {
            results.push(await response.json());
          } else {
            const error = await response.json();
            errors.push(`${username}: ${error.message}`);
          }
        } catch (error) {
          errors.push(`${username}: Network error`);
        }
      }

      return { results, errors };
    },
    onSuccess: ({ results, errors }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/members`] });
      
      if (results.length > 0) {
        toast({
          title: "Members added",
          description: `Successfully added ${results.length} member${results.length > 1 ? 's' : ''} to the conversation.`,
        });
      }
      
      if (errors.length > 0) {
        toast({
          title: "Some additions failed",
          description: errors.slice(0, 3).join(', ') + (errors.length > 3 ? '...' : ''),
          variant: "destructive",
        });
      }
      
      // Reset form
      setManualUsernames([""]);
      setSelectedWorkforceMembers([]);
      onClose();
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
        title: "Failed to add members",
        description: error.message || "Please check the usernames and try again.",
        variant: "destructive",
      });
    },
  });

  const addUsernameField = () => {
    setManualUsernames([...manualUsernames, ""]);
  };

  const removeUsernameField = (index: number) => {
    if (manualUsernames.length > 1) {
      setManualUsernames(manualUsernames.filter((_, i) => i !== index));
    }
  };

  const updateUsername = (index: number, value: string) => {
    const updated = [...manualUsernames];
    updated[index] = value;
    setManualUsernames(updated);
  };

  const toggleWorkforceMember = (userId: string) => {
    setSelectedWorkforceMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validUsernames = manualUsernames.filter(u => u.trim());
    
    if (validUsernames.length === 0 && selectedWorkforceMembers.length === 0) {
      toast({
        title: "No members selected",
        description: "Please select workforce members or enter usernames to add.",
        variant: "destructive",
      });
      return;
    }

    addMembersMutation.mutate({
      usernames: validUsernames,
      workforceUserIds: selectedWorkforceMembers
    });
  };

  const getDisplayName = (member: any) => {
    return member.user.username || 
           `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 
           member.user.email || 
           'Unknown User';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto secure-content">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Add Members to Conversation
          </DialogTitle>
          <DialogDescription>
            Select workforce members via checkboxes or enter usernames manually to add multiple people at once.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Workforce Members Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <Label className="text-sm font-medium">Workforce Members</Label>
              {selectedWorkforceMembers.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedWorkforceMembers.length} selected
                </Badge>
              )}
            </div>
            
            {loadingMembers ? (
              <div className="text-sm text-gray-500">Loading workforce members...</div>
            ) : availableWorkforceMembers.length === 0 ? (
              <div className="text-sm text-gray-500">All workforce members are already in this conversation</div>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                {availableWorkforceMembers.map((member: any, index: number) => (
                  <div key={`${member.userId}-${index}`} className="flex items-center space-x-3">
                    <Checkbox
                      id={`member-${member.userId}-${index}`}
                      checked={selectedWorkforceMembers.includes(member.userId)}
                      onCheckedChange={() => toggleWorkforceMember(member.userId)}
                    />
                    <div className="flex items-center space-x-2 flex-1">
                      <div className="w-8 h-8 bg-gray-400 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {getDisplayName(member).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {getDisplayName(member)}
                        </p>
                        {member.workforceName && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            {member.workforceName}
                          </p>
                        )}
                      </div>
                      <Badge variant={member.role === 'moderator' ? 'default' : 'secondary'} className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Manual Username Entry */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Cross-Workforce Moderators</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addUsernameField}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Field
              </Button>
            </div>
            <div className="space-y-2">
              {manualUsernames.map((username, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => updateUsername(index, e.target.value)}
                    placeholder="Enter username for cross-workforce moderator"
                    className="flex-1"
                  />
                  {manualUsernames.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUsernameField(index)}
                      className="w-8 h-8 p-0 text-gray-500 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Enter usernames of moderators from other workforces for cross-workforce collaboration
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addMembersMutation.isPending}
            >
              {addMembersMutation.isPending ? "Adding Members..." : "Add Selected Members"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}